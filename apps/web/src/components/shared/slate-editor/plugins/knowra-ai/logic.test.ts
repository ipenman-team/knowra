import { describe, expect, it } from "vitest";

import {
  resolveInlineAiMode,
  truncateInlineAiSelectedText,
} from "./logic";

describe("resolveInlineAiMode", () => {
  it("returns off when config is absent", () => {
    expect(resolveInlineAiMode({ editorReadOnly: false })).toBe("off");
  });

  it("returns off when config is disabled", () => {
    expect(
      resolveInlineAiMode({
        editorReadOnly: false,
        config: { enabled: false },
      }),
    ).toBe("off");
  });

  it("returns edit when enabled and editor is editable", () => {
    expect(
      resolveInlineAiMode({
        editorReadOnly: false,
        config: { enabled: true },
      }),
    ).toBe("edit");
  });

  it("returns off for readonly mode unless allowReadOnly is true", () => {
    expect(
      resolveInlineAiMode({
        editorReadOnly: true,
        config: { enabled: true, allowReadOnly: false },
      }),
    ).toBe("off");

    expect(
      resolveInlineAiMode({
        editorReadOnly: true,
        config: { enabled: true, allowReadOnly: true },
      }),
    ).toBe("readonly");
  });
});

describe("truncateInlineAiSelectedText", () => {
  it("trims and keeps short text", () => {
    expect(truncateInlineAiSelectedText("  hello  ", 10)).toEqual({
      text: "hello",
      truncated: false,
    });
  });

  it("truncates long text with ellipsis", () => {
    expect(truncateInlineAiSelectedText("abcdef", 4)).toEqual({
      text: "abcd...",
      truncated: true,
    });
  });
});
