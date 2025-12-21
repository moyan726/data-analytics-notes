// Mermaid 初始化配置
document$.subscribe(() => {
  mermaid.initialize({
    startOnLoad: true,
    theme: "default",
    securityLevel: "loose",
    fontFamily: "Noto Sans SC, sans-serif",
    flowchart: {
      useMaxWidth: true,
      htmlLabels: true,
      curve: "basis"
    },
    sequence: {
      useMaxWidth: true,
      mirrorActors: true
    }
  });
});
