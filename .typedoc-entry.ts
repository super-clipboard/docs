// Re-export the userscript-types spec so TypeDoc can walk the namespace.
// TypeDoc picks declaration-only sources up reliably when the entry point
// is a real .ts file that re-exports them.
export * from "@super-clipboard/userscript-types/spec";
