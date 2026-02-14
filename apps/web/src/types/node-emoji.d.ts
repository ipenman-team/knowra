declare module "node-emoji" {
  type EmojiSearchItem = {
    key: string;
    emoji: string;
  };

  const nodeEmoji: {
    emoji: Record<string, string>;
    get: (name: string) => string;
    which: (emoji: string, includeColons?: boolean) => string | undefined;
    search: (query: string) => EmojiSearchItem[];
  };

  export default nodeEmoji;
}
