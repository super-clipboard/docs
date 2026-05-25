---
title: 性能日志查看器（调试）
---

# 性能日志查看器

纯前端的 JSONL 性能日志可视化页面。把 Super Clipboard 从
`{userData}/super-clipboard-next/perf-logs/` 导出的 `.jsonl` 文件拖进来，
可以叠加渲染多个文件的时序图进行对比。

::: info 隐私
本页面**不联网上传任何字节**。所有解析都在你的浏览器内、通过
[File API][file-api] + [`TextDecoderStream`][tds] 完成。
页面一旦缓存，离线打开仍可使用。

[file-api]: https://developer.mozilla.org/zh-CN/docs/Web/API/File_API
[tds]: https://developer.mozilla.org/zh-CN/docs/Web/API/TextDecoderStream
:::

## 如何采集日志

1. 在 Super Clipboard 中打开 **设置 → 调试与性能**。
2. 打开 **启用性能采样** 开关。每 5 秒采样一次，写入
   `{userData}/super-clipboard-next/perf-logs/YYYY-MM-DD.jsonl`。
3. 像平时一样使用应用，让它运行任意时长。
4. 点击同一设置项里的 **打开目录**，把感兴趣的 `.jsonl` 拷到任意位置。

## 打开文件

<PerfViewer />

## 使用建议

- **对比两次会话 / 不同机器 / 不同版本**：同时载入多个文件。每个文件
  自动分配一个颜色，在同一坐标系下叠加。
- **切换到相对时间**（`t = 0` 对齐会话起点），可以叠加不同时间启动的
  采样曲线。
- **指标芯片**：点击切换显隐，专注单一指标（例如排查内存泄漏时只看
  RSS）。
- **事件标记**：以虚线竖线呈现在第一个指标图上（如 `route-change`、
  `history-load-end`、`upgrade-shown`）。
- **交互**：鼠标滚轮以光标为中心缩放；点击拖动平移时间轴；双击重置到
  fit-all。
