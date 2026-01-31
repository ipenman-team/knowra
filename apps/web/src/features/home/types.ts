export type ViewId = "dashboard" | "contexta-ai" | "settings";

export type Selected =
  | { kind: "view"; id: ViewId }
