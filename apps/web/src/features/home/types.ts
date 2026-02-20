export type ViewId = "workbench" | "knowra-ai" | "favorites" | "settings";

export type Selected =
  | { kind: "view"; id: ViewId }
