import type mermaidType from "mermaid";

type MermaidApi = typeof mermaidType;

let mermaidPromise: Promise<MermaidApi> | null = null;
let mermaidInitialized = false;

async function getMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import("mermaid").then((module) => module.default);
  }

  const mermaid = await mermaidPromise;

  if (!mermaidInitialized) {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      suppressErrorRendering: true,
      theme: "default",
    });
    mermaidInitialized = true;
  }

  return mermaid;
}

export async function renderMermaidToSvg(code: string, id: string) {
  const mermaid = await getMermaid();
  const result = await mermaid.render(id, code);
  return result.svg;
}
