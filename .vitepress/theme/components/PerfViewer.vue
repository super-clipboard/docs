<script setup lang="ts">
/**
 * PerfViewer.vue — Phase 4 性能日志可视化（手写 Canvas 实现，零依赖）
 *
 * 纯前端：File API + 流式解析 + Canvas 2D 渲染。所有数据停留在浏览器
 * 内存，绝不联网上传。
 */
import { computed, onMounted, ref, watch, nextTick } from "vue";

interface HeaderLine {
  v: number;
  kind: "header";
  app: string;
  appVersion: string;
  uaPlatform: string;
  arch: string;
  screen: string;
  tz: string;
  startedAt: number;
}

interface SampleLine {
  v: number;
  kind: "sample";
  ts: number;
  heap?: { used: number; total: number; limit: number };
  proc?: { rss: number; ext: number };
  cpu?: { delta: number };
  fps?: { avg: number };
  longtask?: { n: number; ms: number };
  idx?: { docs: number };
  db?: { docs: number };
  list?: { visible: number };
  route?: string;
  vip?: 0 | 1;
}

interface EventLine {
  v: number;
  kind: "event";
  ts: number;
  name: string;
  payload?: Record<string, unknown>;
}

type Line = HeaderLine | SampleLine | EventLine;

interface ParsedFile {
  name: string;
  color: string;
  header: HeaderLine | null;
  samples: SampleLine[];
  events: EventLine[];
  bounds: { min: number; max: number };
}

interface MetricDef {
  id: string;
  label: string;
  pick: (s: SampleLine) => number | undefined;
  unit?: string;
}

const METRICS: MetricDef[] = [
  { id: "heap.used", label: "Heap used", pick: (s) => s.heap?.used, unit: "MB" },
  { id: "proc.rss", label: "Process RSS", pick: (s) => s.proc?.rss, unit: "MB" },
  { id: "cpu.delta", label: "CPU", pick: (s) => s.cpu?.delta, unit: "%" },
  { id: "fps.avg", label: "FPS", pick: (s) => s.fps?.avg },
  { id: "longtask.ms", label: "Long-task", pick: (s) => s.longtask?.ms, unit: "ms" },
  { id: "db.docs", label: "DB docs", pick: (s) => s.db?.docs },
];

// d3 schemeTableau10
const PALETTE = [
  "#4e79a7",
  "#f28e2b",
  "#e15759",
  "#76b7b2",
  "#59a14f",
  "#edc948",
  "#b07aa1",
  "#ff9da7",
  "#9c755f",
  "#bab0ac",
];

const files = ref<ParsedFile[]>([]);
const visibleFiles = ref<Set<string>>(new Set());
const activeMetrics = ref<Set<string>>(new Set(METRICS.map((m) => m.id)));
const showEvents = ref(true);
const relativeTime = ref(false);
const loading = ref(false);

/** 当前 X 视口（null = 自适应全量）。共享给所有 canvas。 */
const view = ref<{ xMin: number; xMax: number } | null>(null);

/** 鼠标位置（用于跨 canvas 共享的 crosshair）。x 是数据空间值；px 是相对图表容器的 x 像素。 */
const cursor = ref<{ x: number; px: number; canvasIdx: number } | null>(null);

const canvasRefs = ref<(HTMLCanvasElement | null)[]>([]);
const containerRef = ref<HTMLDivElement | null>(null);
const tooltipRef = ref<HTMLDivElement | null>(null);

const PAD = { left: 60, right: 18, top: 18, bottom: 24 };
const CHART_HEIGHT = 130;

const shownMetrics = computed(() => METRICS.filter((m) => activeMetrics.value.has(m.id)));
const shownFiles = computed(() => files.value.filter((f) => visibleFiles.value.has(f.name)));

/** 在当前 relativeTime 模式下、所有可见文件的 X 范围。 */
const fullBounds = computed<{ xMin: number; xMax: number } | null>(() => {
  let min = Infinity;
  let max = -Infinity;
  for (const f of shownFiles.value) {
    const start = relativeTime.value ? (f.header?.startedAt ?? f.bounds.min) : 0;
    const lo = f.bounds.min - start;
    const hi = f.bounds.max - start;
    if (lo < min) min = lo;
    if (hi > max) max = hi;
  }
  if (min === Infinity) return null;
  if (min === max) {
    min -= 500;
    max += 500;
  }
  return { xMin: min, xMax: max };
});

const effectiveView = computed<{ xMin: number; xMax: number } | null>(
  () => view.value ?? fullBounds.value,
);

// 切换 relativeTime / 文件集合时重置视口
watch([relativeTime, shownFiles], () => {
  view.value = null;
});

// ─── 文件加载与解析 ────────────────────────────────────────────────

async function handlePick(ev: Event): Promise<void> {
  const input = ev.target as HTMLInputElement;
  if (!input.files) return;
  loading.value = true;
  try {
    const newOnes: ParsedFile[] = [];
    for (const file of Array.from(input.files)) {
      const parsed = await parseFile(file);
      parsed.color = PALETTE[(files.value.length + newOnes.length) % PALETTE.length];
      newOnes.push(parsed);
    }
    files.value = [...files.value, ...newOnes];
    for (const f of newOnes) visibleFiles.value.add(f.name);
  } finally {
    loading.value = false;
    input.value = "";
  }
}

async function parseFile(file: File): Promise<ParsedFile> {
  const out: ParsedFile = {
    name: file.name,
    color: "#888",
    header: null,
    samples: [],
    events: [],
    bounds: { min: Infinity, max: -Infinity },
  };
  const stream = file.stream().pipeThrough(new TextDecoderStream());
  const reader = stream.getReader();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += value;
    let nl: number;
    while ((nl = buf.indexOf("\n")) !== -1) {
      const raw = buf.slice(0, nl);
      buf = buf.slice(nl + 1);
      consumeLine(raw, out);
    }
  }
  if (buf.trim()) consumeLine(buf, out);
  out.samples.sort((a, b) => a.ts - b.ts);
  if (out.samples.length > 5000) {
    out.samples = downsampleLTTB(out.samples, 2000);
  }
  return out;
}

function consumeLine(raw: string, out: ParsedFile): void {
  const line = raw.trim();
  if (!line) return;
  let parsed: Line;
  try {
    parsed = JSON.parse(line) as Line;
  } catch {
    return;
  }
  if (parsed.kind === "header") {
    out.header = parsed;
  } else if (parsed.kind === "sample") {
    out.samples.push(parsed);
    if (parsed.ts < out.bounds.min) out.bounds.min = parsed.ts;
    if (parsed.ts > out.bounds.max) out.bounds.max = parsed.ts;
  } else if (parsed.kind === "event") {
    out.events.push(parsed);
  }
}

function downsampleLTTB(samples: SampleLine[], target: number): SampleLine[] {
  if (samples.length <= target) return samples;
  const bucketSize = (samples.length - 2) / (target - 2);
  const result: SampleLine[] = [samples[0]];
  let a = 0;
  for (let i = 0; i < target - 2; i++) {
    const rangeStart = Math.floor((i + 1) * bucketSize) + 1;
    const rangeEnd = Math.min(Math.floor((i + 2) * bucketSize) + 1, samples.length);
    let avgX = 0;
    let avgY = 0;
    const count = rangeEnd - rangeStart;
    for (let j = rangeStart; j < rangeEnd; j++) {
      avgX += samples[j].ts;
      avgY += samples[j].heap?.used ?? 0;
    }
    avgX /= count;
    avgY /= count;
    const aX = samples[a].ts;
    const aY = samples[a].heap?.used ?? 0;
    let maxArea = -1;
    let chosen = rangeStart;
    const rs = Math.floor(i * bucketSize) + 1;
    const re = Math.floor((i + 1) * bucketSize) + 1;
    for (let j = rs; j < re; j++) {
      const s = samples[j];
      const area = Math.abs(
        (aX - avgX) * ((s.heap?.used ?? 0) - aY) - (aX - s.ts) * (avgY - aY),
      );
      if (area > maxArea) {
        maxArea = area;
        chosen = j;
      }
    }
    result.push(samples[chosen]);
    a = chosen;
  }
  result.push(samples[samples.length - 1]);
  return result;
}

function removeFile(name: string): void {
  files.value = files.value.filter((f) => f.name !== name);
  visibleFiles.value.delete(name);
  if (shownFiles.value.length === 0) view.value = null;
}

function toggleFile(name: string): void {
  if (visibleFiles.value.has(name)) visibleFiles.value.delete(name);
  else visibleFiles.value.add(name);
}

function toggleMetric(id: string): void {
  if (activeMetrics.value.has(id)) activeMetrics.value.delete(id);
  else activeMetrics.value.add(id);
}

function resetView(): void {
  view.value = null;
}

// ─── 刻度计算（Heckbert nice numbers） ──────────────────────────────

function niceNum(range: number, round: boolean): number {
  if (range <= 0) return 1;
  const exp = Math.floor(Math.log10(range));
  const f = range / Math.pow(10, exp);
  let nf: number;
  if (round) nf = f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10;
  else nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  return nf * Math.pow(10, exp);
}

function niceTicks(min: number, max: number, maxTicks: number): number[] {
  if (!isFinite(min) || !isFinite(max) || min === max) return [min, max];
  const range = niceNum(max - min, false);
  const step = niceNum(range / (maxTicks - 1), true);
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = niceMin; v <= niceMax + step / 2; v += step) ticks.push(+v.toFixed(10));
  return ticks;
}

const TIME_GRADES = [
  1000, 5000, 10_000, 30_000, 60_000, 5 * 60_000, 10 * 60_000, 30 * 60_000, 60 * 60_000,
  6 * 3_600_000, 24 * 3_600_000,
];

function niceTimeTicks(min: number, max: number, plotW: number): number[] {
  const targetTicks = Math.max(2, Math.min(8, Math.floor(plotW / 90)));
  const span = max - min;
  let step = TIME_GRADES[0];
  for (const g of TIME_GRADES) {
    if (span / g <= targetTicks) {
      step = g;
      break;
    }
    step = g;
  }
  const start = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  for (let t = start; t <= max; t += step) ticks.push(t);
  return ticks;
}

function formatY(v: number): string {
  const abs = Math.abs(v);
  if (abs === 0) return "0";
  if (abs < 0.1) return v.toExponential(1);
  if (abs >= 1000) return v.toFixed(0);
  if (abs >= 10) return v.toFixed(1);
  return v.toFixed(2);
}

function formatX(v: number, relative: boolean): string {
  if (relative) {
    const ms = v;
    if (ms < 60_000) return (ms / 1000).toFixed(0) + "s";
    if (ms < 3_600_000) return (ms / 60_000).toFixed(0) + "m";
    return (ms / 3_600_000).toFixed(1) + "h";
  }
  const d = new Date(v);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function formatTooltipX(v: number, relative: boolean): string {
  if (relative) {
    const ms = v;
    const totalS = Math.round(ms / 1000);
    const h = Math.floor(totalS / 3600);
    const m = Math.floor((totalS % 3600) / 60);
    const s = totalS % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }
  return new Date(v).toLocaleString();
}

// ─── 渲染 ──────────────────────────────────────────────────────────

function getCssVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

interface DrawArgs {
  canvas: HTMLCanvasElement;
  metric: MetricDef;
  files: ParsedFile[];
  view: { xMin: number; xMax: number };
  relative: boolean;
  showEvents: boolean;
  showMarkers: boolean;
}

function drawChart(args: DrawArgs): void {
  const { canvas, metric, files: shown, view: v, relative, showEvents: ev, showMarkers } = args;
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth;
  const cssH = canvas.clientHeight;
  if (cssW <= 0 || cssH <= 0) return;
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);

  const plotW = cssW - PAD.left - PAD.right;
  const plotH = cssH - PAD.top - PAD.bottom;
  if (plotW <= 0 || plotH <= 0) return;

  const textColor = getCssVar("--vp-c-text-2", "#888");
  const gridColor = getCssVar("--vp-c-divider", "rgba(128,128,128,0.2)");
  const borderColor = getCssVar("--vp-c-divider", "rgba(128,128,128,0.4)");
  const fontFamily = "system-ui, -apple-system, sans-serif";

  // Y 范围
  let yMin = Infinity;
  let yMax = -Infinity;
  for (const f of shown) {
    const start = relative ? (f.header?.startedAt ?? f.bounds.min) : 0;
    for (const s of f.samples) {
      const x = s.ts - start;
      if (x < v.xMin || x > v.xMax) continue;
      const y = metric.pick(s);
      if (y === undefined) continue;
      if (y < yMin) yMin = y;
      if (y > yMax) yMax = y;
    }
  }
  if (yMin === Infinity) {
    yMin = 0;
    yMax = 1;
  }
  if (yMin === yMax) {
    const d = Math.max(1, Math.abs(yMin) * 0.1);
    yMin -= d;
    yMax += d;
  }
  const yTicks = niceTicks(yMin, yMax, 5);
  yMin = yTicks[0];
  yMax = yTicks[yTicks.length - 1];

  const xToPx = (x: number) =>
    PAD.left + ((x - v.xMin) / (v.xMax - v.xMin)) * plotW;
  const yToPx = (y: number) =>
    PAD.top + (1 - (y - yMin) / (yMax - yMin)) * plotH;

  // 背景网格 + Y 刻度
  ctx.font = `10px ${fontFamily}`;
  ctx.fillStyle = textColor;
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (const ty of yTicks) {
    const py = yToPx(ty);
    ctx.beginPath();
    ctx.moveTo(PAD.left, py);
    ctx.lineTo(PAD.left + plotW, py);
    ctx.stroke();
    ctx.fillText(formatY(ty), PAD.left - 6, py);
  }

  // X 刻度
  const xTicks = niceTimeTicks(v.xMin, v.xMax, plotW);
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (const tx of xTicks) {
    const px = xToPx(tx);
    if (px < PAD.left || px > PAD.left + plotW) continue;
    ctx.beginPath();
    ctx.moveTo(px, PAD.top);
    ctx.lineTo(px, PAD.top + plotH);
    ctx.stroke();
    ctx.fillText(formatX(tx, relative), px, PAD.top + plotH + 4);
  }

  // 指标标签 + 单位
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.font = `600 11px ${fontFamily}`;
  ctx.fillStyle = textColor;
  ctx.fillText(
    metric.unit ? `${metric.label} (${metric.unit})` : metric.label,
    PAD.left,
    2,
  );

  // 折线
  ctx.save();
  ctx.beginPath();
  ctx.rect(PAD.left, PAD.top, plotW, plotH);
  ctx.clip();

  for (const f of shown) {
    const start = relative ? (f.header?.startedAt ?? f.bounds.min) : 0;
    ctx.strokeStyle = f.color;
    ctx.lineWidth = 1.2;
    ctx.lineJoin = "round";
    ctx.beginPath();
    let started = false;
    let prevX: number | null = null;
    for (const s of f.samples) {
      const xVal = s.ts - start;
      const y = metric.pick(s);
      if (y === undefined) {
        started = false;
        prevX = xVal;
        continue;
      }
      const px = xToPx(xVal);
      const py = yToPx(y);
      // 视口外裁剪：保留视口外紧邻的一个点用于连续线
      if (xVal < v.xMin) {
        prevX = xVal;
        continue;
      }
      if (prevX !== null && prevX < v.xMin && !started) {
        // 重新开始一段，从最近的视口外点开始
        ctx.moveTo(px, py);
        started = true;
        prevX = xVal;
        continue;
      }
      if (!started) {
        ctx.moveTo(px, py);
        started = true;
      } else {
        ctx.lineTo(px, py);
      }
      prevX = xVal;
      if (xVal > v.xMax) break;
    }
    ctx.stroke();
  }

  // 事件 marker（仅首个图）
  if (showMarkers && ev) {
    ctx.lineWidth = 1.5;
    for (const f of shown) {
      const start = relative ? (f.header?.startedAt ?? f.bounds.min) : 0;
      ctx.strokeStyle = f.color;
      ctx.fillStyle = f.color;
      for (const e of f.events) {
        const x = e.ts - start;
        if (x < v.xMin || x > v.xMax) continue;
        const px = xToPx(x);
        // 主竖线（半透明实线，足以阅读）
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.moveTo(px, PAD.top);
        ctx.lineTo(px, PAD.top + plotH);
        ctx.stroke();
        // 顶端实心圆点（多文件叠加时易区分）
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(px, PAD.top + 4, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }

  ctx.restore();

  // 边框
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.strokeRect(PAD.left + 0.5, PAD.top + 0.5, plotW, plotH);

  // crosshair（共享）
  const cu = cursor.value;
  if (cu && cu.x >= v.xMin && cu.x <= v.xMax) {
    const px = xToPx(cu.x);
    ctx.strokeStyle = textColor;
    ctx.globalAlpha = 0.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(px, PAD.top);
    ctx.lineTo(px, PAD.top + plotH);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }
}

let rafScheduled = false;
function scheduleDraw(): void {
  if (rafScheduled) return;
  rafScheduled = true;
  requestAnimationFrame(() => {
    rafScheduled = false;
    const ev = effectiveView.value;
    if (!ev) {
      for (const c of canvasRefs.value) {
        if (!c) continue;
        const ctx = c.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, c.width, c.height);
      }
      return;
    }
    const shown = shownFiles.value;
    shownMetrics.value.forEach((metric, i) => {
      const canvas = canvasRefs.value[i];
      if (!canvas) return;
      drawChart({
        canvas,
        metric,
        files: shown,
        view: ev,
        relative: relativeTime.value,
        showEvents: showEvents.value,
        showMarkers: i === 0,
      });
    });
  });
}

watch(
  [shownFiles, shownMetrics, showEvents, relativeTime, effectiveView, cursor],
  () => scheduleDraw(),
  { deep: true },
);

onMounted(() => {
  scheduleDraw();
  const ro = new ResizeObserver(() => scheduleDraw());
  if (containerRef.value) ro.observe(containerRef.value);
  window.addEventListener("resize", () => scheduleDraw());
});

// ─── 交互 ──────────────────────────────────────────────────────────

function getPlotXFromEvent(canvas: HTMLCanvasElement, ev: MouseEvent): number | null {
  const r = canvas.getBoundingClientRect();
  const x = ev.clientX - r.left;
  if (x < PAD.left || x > r.width - PAD.right) return null;
  const v = effectiveView.value;
  if (!v) return null;
  const plotW = r.width - PAD.left - PAD.right;
  return v.xMin + ((x - PAD.left) / plotW) * (v.xMax - v.xMin);
}

function onWheel(idx: number, ev: WheelEvent): void {
  const canvas = canvasRefs.value[idx];
  if (!canvas) return;
  ev.preventDefault();
  const v = effectiveView.value;
  if (!v) return;
  const center = getPlotXFromEvent(canvas, ev);
  if (center === null) return;
  const factor = ev.deltaY < 0 ? 1 / 1.2 : 1.2;
  const newSpan = (v.xMax - v.xMin) * factor;
  const ratio = (center - v.xMin) / (v.xMax - v.xMin);
  let newMin = center - newSpan * ratio;
  let newMax = newMin + newSpan;
  // 限制：不缩到 < 1ms；不放大超出全量 10x
  const full = fullBounds.value;
  if (full) {
    const fullSpan = full.xMax - full.xMin;
    if (newSpan > fullSpan * 10) {
      newMin = full.xMin - fullSpan * 4.5;
      newMax = full.xMax + fullSpan * 4.5;
    }
  }
  if (newMax - newMin < 1) return;
  view.value = { xMin: newMin, xMax: newMax };
}

let dragging: { startClientX: number; startView: { xMin: number; xMax: number }; idx: number } | null = null;

function onMouseDown(idx: number, ev: MouseEvent): void {
  const v = effectiveView.value;
  if (!v) return;
  dragging = { startClientX: ev.clientX, startView: { ...v }, idx };
  (ev.target as HTMLElement).style.cursor = "grabbing";
}

function onMouseMove(idx: number, ev: MouseEvent): void {
  const canvas = canvasRefs.value[idx];
  if (!canvas) return;

  if (dragging) {
    const r = canvas.getBoundingClientRect();
    const plotW = r.width - PAD.left - PAD.right;
    const dxPx = ev.clientX - dragging.startClientX;
    const span = dragging.startView.xMax - dragging.startView.xMin;
    const dx = -(dxPx / plotW) * span;
    view.value = {
      xMin: dragging.startView.xMin + dx,
      xMax: dragging.startView.xMax + dx,
    };
    updateCursor(idx, ev);
    return;
  }

  updateCursor(idx, ev);
}

function updateCursor(idx: number, ev: MouseEvent): void {
  const canvas = canvasRefs.value[idx];
  if (!canvas) return;
  const x = getPlotXFromEvent(canvas, ev);
  if (x === null) {
    cursor.value = null;
    return;
  }
  const r = canvas.getBoundingClientRect();
  cursor.value = { x, px: ev.clientX - r.left, canvasIdx: idx };
  positionTooltip(ev);
}

function onMouseUp(): void {
  if (dragging) {
    const canvas = canvasRefs.value[dragging.idx];
    if (canvas) canvas.style.cursor = "";
    dragging = null;
  }
}

function onMouseLeave(): void {
  if (dragging) return;
  cursor.value = null;
}

function onDblClick(): void {
  resetView();
}

function positionTooltip(ev: MouseEvent): void {
  const tip = tooltipRef.value;
  const container = containerRef.value;
  if (!tip || !container) return;
  const r = container.getBoundingClientRect();
  const x = ev.clientX - r.left;
  const y = ev.clientY - r.top;
  // 右侧若超出 → 翻到左侧
  const tipW = tip.offsetWidth || 220;
  const tipH = tip.offsetHeight || 60;
  const left = x + 14 + tipW > r.width ? x - 14 - tipW : x + 14;
  const top = y + 14 + tipH > r.height ? y - 14 - tipH : y + 14;
  tip.style.left = `${Math.max(4, left)}px`;
  tip.style.top = `${Math.max(4, top)}px`;
}

// 在 cursor.x 附近为每个文件找最接近的样本（二分）
function nearestSample(file: ParsedFile, xVal: number): SampleLine | null {
  if (file.samples.length === 0) return null;
  const start = relativeTime.value ? (file.header?.startedAt ?? file.bounds.min) : 0;
  // 二分搜
  let lo = 0;
  let hi = file.samples.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (file.samples[mid].ts - start < xVal) lo = mid + 1;
    else hi = mid;
  }
  const cand = file.samples[lo];
  const prev = lo > 0 ? file.samples[lo - 1] : null;
  if (!prev) return cand;
  return Math.abs(cand.ts - start - xVal) < Math.abs(prev.ts - start - xVal) ? cand : prev;
}

const tooltipData = computed(() => {
  const cu = cursor.value;
  if (!cu) return null;
  const lines: Array<{
    file: string;
    color: string;
    sampleTs: number;
    values: Array<{ metric: string; value: string }>;
  }> = [];
  for (const f of shownFiles.value) {
    const s = nearestSample(f, cu.x);
    if (!s) continue;
    const values: Array<{ metric: string; value: string }> = [];
    for (const m of shownMetrics.value) {
      const v = m.pick(s);
      if (v === undefined) continue;
      values.push({
        metric: m.label,
        value: m.unit ? `${formatY(v)} ${m.unit}` : formatY(v),
      });
    }
    lines.push({ file: f.name, color: f.color, sampleTs: s.ts, values });
  }
  // 鼠标附近事件（按视口范围换算 ±10px 数据距离）
  const events: Array<{
    file: string;
    color: string;
    name: string;
    ts: number;
    delta: number; // ts - cursor.x，可正可负
    payload: string;
  }> = [];
  if (showEvents.value) {
    const vw = effectiveView.value;
    const container = containerRef.value;
    if (vw && container) {
      const r = container.getBoundingClientRect();
      const plotW = Math.max(r.width - PAD.left - PAD.right, 1);
      const threshold = ((vw.xMax - vw.xMin) / plotW) * 10; // 10px in data space
      for (const f of shownFiles.value) {
        const start = relativeTime.value ? (f.header?.startedAt ?? f.bounds.min) : 0;
        for (const e of f.events) {
          const x = e.ts - start;
          const d = x - cu.x;
          if (Math.abs(d) > threshold) continue;
          events.push({
            file: f.name,
            color: f.color,
            name: e.name,
            ts: e.ts,
            delta: d,
            payload: e.payload ? JSON.stringify(e.payload) : "",
          });
        }
      }
      events.sort((a, b) => Math.abs(a.delta) - Math.abs(b.delta));
    }
  }
  return { x: cu.x, lines, events };
});

function formatDelta(ms: number): string {
  const abs = Math.abs(ms);
  const sign = ms < 0 ? "−" : "+";
  if (abs < 1000) return `${sign}${Math.round(abs)}ms`;
  if (abs < 60_000) return `${sign}${(abs / 1000).toFixed(1)}s`;
  return `${sign}${(abs / 60_000).toFixed(1)}m`;
}

// 当 metrics 数量变化时，canvasRefs 数组需要保持长度对齐（v-for 自动）
watch(shownMetrics, async () => {
  await nextTick();
  scheduleDraw();
});
</script>

<template>
  <div class="perf-viewer">
    <div class="perf-toolbar">
      <label class="perf-file-pick">
        <input type="file" accept=".jsonl" multiple @change="handlePick" />
        <span>Pick JSONL files</span>
      </label>
      <label class="perf-toggle">
        <input type="checkbox" v-model="relativeTime" />
        <span>Relative time (t = 0)</span>
      </label>
      <label class="perf-toggle">
        <input type="checkbox" v-model="showEvents" />
        <span>Show events</span>
      </label>
      <button v-if="view" class="perf-mini-btn" @click="resetView">Reset zoom</button>
      <span v-if="loading" class="perf-loading">Parsing…</span>
      <span class="perf-hint">scroll = zoom · drag = pan · dblclick = reset</span>
    </div>

    <div class="perf-metrics">
      <button
        v-for="m in METRICS"
        :key="m.id"
        class="perf-chip"
        :class="{ 'perf-chip--on': activeMetrics.has(m.id) }"
        @click="toggleMetric(m.id)"
      >
        {{ m.label }}
      </button>
    </div>

    <div v-if="files.length === 0" class="perf-empty">
      No file loaded. Pick one or more <code>.jsonl</code> exports from
      <code>{userData}/super-clipboard-next-perf-logs/</code>.
      <br />
      All parsing is local — nothing leaves the browser.
    </div>

    <ul v-else class="perf-files">
      <li v-for="f in files" :key="f.name">
        <label>
          <input
            type="checkbox"
            :checked="visibleFiles.has(f.name)"
            @change="toggleFile(f.name)"
          />
          <span class="perf-swatch" :style="{ background: f.color }"></span>
          <strong>{{ f.name }}</strong>
          <small>· {{ f.samples.length }} samples · {{ f.events.length }} events</small>
          <small v-if="f.header"
            >· {{ f.header.appVersion }} / {{ f.header.uaPlatform }}
          </small>
        </label>
        <button class="perf-remove" @click="removeFile(f.name)">×</button>
      </li>
    </ul>

    <div ref="containerRef" class="perf-charts" @mouseleave="onMouseLeave">
      <canvas
        v-for="(m, i) in shownMetrics"
        :key="m.id"
        :ref="(el) => (canvasRefs[i] = el as HTMLCanvasElement | null)"
        class="perf-canvas"
        :style="{ height: `${CHART_HEIGHT}px` }"
        @wheel="(e) => onWheel(i, e)"
        @mousedown="(e) => onMouseDown(i, e)"
        @mousemove="(e) => onMouseMove(i, e)"
        @mouseup="onMouseUp"
        @dblclick="onDblClick"
      />
      <div
        v-show="tooltipData && (tooltipData.lines.length > 0 || tooltipData.events.length > 0)"
        ref="tooltipRef"
        class="perf-tooltip"
      >
        <div v-if="tooltipData" class="perf-tooltip__head">
          {{ formatTooltipX(tooltipData.x, relativeTime) }}
        </div>
        <div
          v-for="ln in tooltipData?.lines ?? []"
          :key="ln.file"
          class="perf-tooltip__file"
        >
          <div class="perf-tooltip__file-head">
            <span class="perf-swatch" :style="{ background: ln.color }"></span>
            <span class="perf-tooltip__name">{{ ln.file }}</span>
          </div>
          <div
            v-for="vv in ln.values"
            :key="vv.metric"
            class="perf-tooltip__row"
          >
            <span class="perf-tooltip__metric">{{ vv.metric }}</span>
            <span class="perf-tooltip__value">{{ vv.value }}</span>
          </div>
        </div>
        <div
          v-if="tooltipData && tooltipData.events.length > 0"
          class="perf-tooltip__events"
        >
          <div class="perf-tooltip__events-head">Events near cursor</div>
          <div
            v-for="(ev, i) in tooltipData.events"
            :key="i"
            class="perf-tooltip__event"
          >
            <span class="perf-swatch" :style="{ background: ev.color }"></span>
            <span class="perf-tooltip__event-delta">{{ formatDelta(ev.delta) }}</span>
            <span class="perf-tooltip__event-name">{{ ev.name }}</span>
            <span v-if="ev.payload" class="perf-tooltip__event-payload" :title="ev.payload">{{
              ev.payload
            }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.perf-viewer {
  margin: 1rem 0;
  font-size: 13px;
}
.perf-toolbar {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
  padding: 0.5rem 0.75rem;
  background: var(--vp-c-bg-soft);
  border-radius: 6px;
}
.perf-file-pick {
  position: relative;
  display: inline-block;
  cursor: pointer;
  padding: 0.4rem 0.8rem;
  background: var(--vp-c-brand-1);
  color: #fff;
  border-radius: 4px;
}
.perf-file-pick input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}
.perf-toggle {
  display: inline-flex;
  gap: 0.4rem;
  align-items: center;
  cursor: pointer;
  user-select: none;
}
.perf-loading {
  font-style: italic;
  color: var(--vp-c-text-2);
}
.perf-hint {
  margin-left: auto;
  font-size: 11px;
  color: var(--vp-c-text-3);
}
.perf-mini-btn {
  padding: 0.25rem 0.6rem;
  border: 1px solid var(--vp-c-divider);
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  color: var(--vp-c-text-2);
}
.perf-mini-btn:hover {
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}
.perf-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.6rem;
}
.perf-chip {
  padding: 0.25rem 0.6rem;
  border: 1px solid var(--vp-c-divider);
  background: transparent;
  border-radius: 999px;
  cursor: pointer;
  font-size: 12px;
  color: var(--vp-c-text-2);
}
.perf-chip--on {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}
.perf-empty {
  margin-top: 1rem;
  padding: 1.5rem;
  text-align: center;
  border: 1px dashed var(--vp-c-divider);
  border-radius: 6px;
  color: var(--vp-c-text-2);
}
.perf-files {
  list-style: none;
  margin: 0.8rem 0;
  padding: 0;
}
.perf-files li {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0;
  border-bottom: 1px solid var(--vp-c-divider);
}
.perf-files label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  cursor: pointer;
}
.perf-swatch {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 3px;
}
.perf-remove {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 18px;
  color: var(--vp-c-text-3);
}
.perf-remove:hover {
  color: var(--vp-c-danger-1, #d33);
}
.perf-charts {
  position: relative;
  margin-top: 1rem;
}
.perf-canvas {
  display: block;
  width: 100%;
  cursor: crosshair;
  user-select: none;
}
.perf-canvas:not(:first-child) {
  border-top: 1px solid var(--vp-c-divider);
}
.perf-tooltip {
  position: absolute;
  pointer-events: none;
  background: var(--vp-c-bg-elv, var(--vp-c-bg-soft));
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  padding: 0.4rem 0.6rem;
  font-size: 11px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  z-index: 5;
  min-width: 180px;
  max-width: 320px;
}
.perf-tooltip__head {
  font-weight: 600;
  margin-bottom: 0.3rem;
  color: var(--vp-c-text-1);
}
.perf-tooltip__file + .perf-tooltip__file {
  margin-top: 0.4rem;
  padding-top: 0.4rem;
  border-top: 1px dashed var(--vp-c-divider);
}
.perf-tooltip__file-head {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.2rem;
}
.perf-tooltip__name {
  font-weight: 500;
  color: var(--vp-c-text-1);
  word-break: break-all;
}
.perf-tooltip__row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  color: var(--vp-c-text-2);
}
.perf-tooltip__value {
  font-variant-numeric: tabular-nums;
  color: var(--vp-c-text-1);
}
.perf-tooltip__events {
  margin-top: 0.5rem;
  padding-top: 0.4rem;
  border-top: 1px dashed var(--vp-c-divider);
}
.perf-tooltip__events-head {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--vp-c-text-3);
  margin-bottom: 0.25rem;
}
.perf-tooltip__event {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.2rem;
  font-size: 12px;
}
.perf-tooltip__event-delta {
  font-variant-numeric: tabular-nums;
  color: var(--vp-c-text-2);
  min-width: 3.2em;
  text-align: right;
}
.perf-tooltip__event-name {
  font-weight: 500;
  color: var(--vp-c-text-1);
}
.perf-tooltip__event-payload {
  color: var(--vp-c-text-2);
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 180px;
}
</style>
