"use client";

import { useCallback, useMemo, useState } from "react";
import { Clock3, Search, X } from "lucide-react";
import nodeEmoji from "node-emoji";

import { cn } from "@/lib/utils";

import { Button } from "./button";
import { Input } from "./input";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

type EmojiPickerProps = {
  value?: string | null;
  onChange: (emoji: string | null) => void;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  placeholderEmoji?: string;
  recentStorageKey?: string;
  recentLimit?: number;
  triggerClassName?: string;
  contentClassName?: string;
  label?: string;
};

type EmojiEntry = {
  alias: string;
  emoji: string;
};

const EMOJI_RECENT_FALLBACK_KEY = "contexta:emoji-picker:recent";
const DEFAULT_RECENT_LIMIT = 24;

const COMMON_EMOJI_ALIASES = [
  "grinning",
  "smiley",
  "smile",
  "laughing",
  "joy",
  "wink",
  "heart_eyes",
  "kissing_heart",
  "sunglasses",
  "thinking_face",
  "sob",
  "thumbsup",
  "clap",
  "pray",
  "muscle",
  "tada",
  "fire",
  "100",
  "sparkles",
  "white_check_mark",
  "x",
  "bulb",
  "pushpin",
  "rocket",
] as const;

const EMOJI_ALIAS_LIST = Object.keys(nodeEmoji.emoji).sort();

const EMOJI_ENTRIES: EmojiEntry[] = EMOJI_ALIAS_LIST.map((alias) => ({
  alias,
  emoji: nodeEmoji.get(alias),
})).filter((entry) => Boolean(entry.emoji));

const COMMON_EMOJI_ENTRIES = COMMON_EMOJI_ALIASES.map((alias) => ({
  alias,
  emoji: nodeEmoji.get(alias),
})).filter((entry) => Boolean(entry.emoji));

const EMOJI_ALIAS_BY_CHAR = new Map<string, string>();
for (const entry of EMOJI_ENTRIES) {
  if (!EMOJI_ALIAS_BY_CHAR.has(entry.emoji)) {
    EMOJI_ALIAS_BY_CHAR.set(entry.emoji, entry.alias);
  }
}

export function EmojiPicker(props: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const recentStorageKey = props.recentStorageKey ?? EMOJI_RECENT_FALLBACK_KEY;
  const recentLimit = Math.max(1, props.recentLimit ?? DEFAULT_RECENT_LIMIT);
  const [recent, setRecent] = useState<string[]>(
    () => readRecentFromStorage(recentStorageKey, recentLimit),
  );
  const selectedEmoji = normalizeEmoji(props.value);
  const triggerEmoji = selectedEmoji ?? props.placeholderEmoji ?? "🙂";

  const persistRecent = useCallback(
    (nextRecent: string[]) => {
      if (typeof window === "undefined") return;

      try {
        window.localStorage.setItem(recentStorageKey, JSON.stringify(nextRecent.slice(0, recentLimit)));
      } catch {
        // ignore private mode or quota errors
      }
    },
    [recentLimit, recentStorageKey],
  );

  const updateRecent = useCallback(
    (emoji: string) => {
      const normalized = emoji.trim();
      if (!normalized) return;

      setRecent((prev) => {
        const nextRecent = [normalized, ...prev.filter((item) => item !== normalized)].slice(0, recentLimit);
        persistRecent(nextRecent);
        return nextRecent;
      });
    },
    [persistRecent, recentLimit],
  );

  const visibleEntries = useMemo(() => {
    const normalizedQuery = normalizeQuery(query);
    if (!normalizedQuery) return COMMON_EMOJI_ENTRIES;

    const dedup = new Set<string>();
    const results: EmojiEntry[] = [];

    for (const entry of EMOJI_ENTRIES) {
      if (!entry.alias.includes(normalizedQuery)) continue;
      if (dedup.has(entry.emoji)) continue;
      dedup.add(entry.emoji);
      results.push(entry);
      if (results.length >= 160) break;
    }

    return results;
  }, [query]);

  const recentEntries = useMemo(() => {
    return recent
      .map((emoji) => ({
        emoji,
        alias: getEmojiAlias(emoji),
      }))
      .filter((entry) => Boolean(entry.emoji));
  }, [recent]);

  const onSelectEmoji = useCallback(
    (emoji: string) => {
      const normalized = normalizeEmoji(emoji);
      if (!normalized) return;

      props.onChange(normalized);
      updateRecent(normalized);
      setQuery("");
      setOpen(false);
    },
    [props, updateRecent],
  );

  const onClear = useCallback(() => {
    props.onChange(null);
    setQuery("");
    setOpen(false);
  }, [props]);

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        props.onOpenChange?.(nextOpen);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={selectedEmoji || open ? "secondary" : "ghost"}
          size="sm"
          className={cn("h-8 px-2", props.triggerClassName)}
          disabled={props.disabled}
          aria-label={props.label ?? "选择 Emoji"}
        >
          <span className="text-xl leading-none">{triggerEmoji}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" sideOffset={8} className={cn("w-[360px] p-3", props.contentClassName)}>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索 emoji 或别名"
                className="pl-8"
              />
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 px-2"
              onMouseDown={(event) => event.preventDefault()}
              onClick={onClear}
            >
              <X className="h-4 w-4" />
              清除
            </Button>
          </div>

          {!query && recentEntries.length > 0 ? (
            <section className="space-y-2">
              <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
                <Clock3 className="h-4 w-4" />
                最近使用
              </div>
              <EmojiGrid entries={recentEntries} onSelectEmoji={onSelectEmoji} />
            </section>
          ) : null}

          <section className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">
              {query ? "搜索结果" : "常用"}
            </div>
            {visibleEntries.length > 0 ? (
              <EmojiGrid entries={visibleEntries} onSelectEmoji={onSelectEmoji} />
            ) : (
              <div className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
                未找到匹配的 emoji
              </div>
            )}
          </section>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function EmojiGrid(props: {
  entries: EmojiEntry[];
  onSelectEmoji: (emoji: string) => void;
}) {
  return (
    <div className="grid grid-cols-8 gap-1.5">
      {props.entries.map((entry) => (
        <button
          key={`${entry.alias}-${entry.emoji}`}
          type="button"
          title={`:${entry.alias}:`}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-md text-[22px]",
            "transition-colors hover:bg-muted",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
          onMouseDown={(event) => {
            event.preventDefault();
          }}
          onClick={() => {
            props.onSelectEmoji(entry.emoji);
          }}
        >
          {entry.emoji}
        </button>
      ))}
    </div>
  );
}

function getEmojiAlias(emoji: string) {
  return EMOJI_ALIAS_BY_CHAR.get(emoji) ?? nodeEmoji.which(emoji) ?? "emoji";
}

function normalizeQuery(value: string) {
  return value.trim().toLowerCase().replace(/^:+|:+$/g, "");
}

function normalizeEmoji(value?: string | null) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function readRecentFromStorage(storageKey: string, limit: number) {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter((value) => value.length > 0)
      .slice(0, limit);
  } catch {
    return [];
  }
}
