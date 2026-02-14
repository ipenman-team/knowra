import type { Extension } from "@codemirror/state";
import { StreamLanguage, type StreamParser } from "@codemirror/language";

import type { CodeLanguage } from "./logic";

const languageExtensionCache = new Map<CodeLanguage, Promise<Extension>>();

export function loadCodeLanguageExtension(language: CodeLanguage) {
  const cached = languageExtensionCache.get(language);
  if (cached) return cached;

  const pending = createLanguageExtension(language)
    .then((extension) => extension)
    .catch(() => []);

  languageExtensionCache.set(language, pending);
  return pending;
}

async function createLanguageExtension(language: CodeLanguage): Promise<Extension> {
  switch (language) {
    case "javascript": {
      const { javascript } = await import("@codemirror/lang-javascript");
      return javascript();
    }
    case "typescript": {
      const { javascript } = await import("@codemirror/lang-javascript");
      return javascript({ typescript: true });
    }
    case "jsx": {
      const { javascript } = await import("@codemirror/lang-javascript");
      return javascript({ jsx: true });
    }
    case "tsx": {
      const { javascript } = await import("@codemirror/lang-javascript");
      return javascript({ jsx: true, typescript: true });
    }
    case "python": {
      const { python } = await import("@codemirror/lang-python");
      return python();
    }
    case "go": {
      const { go } = await import("@codemirror/lang-go");
      return go();
    }
    case "java": {
      const { java } = await import("@codemirror/lang-java");
      return java();
    }
    case "rust": {
      const { rust } = await import("@codemirror/lang-rust");
      return rust();
    }
    case "c":
    case "cpp": {
      const { cpp } = await import("@codemirror/lang-cpp");
      return cpp();
    }
    case "php": {
      const { php } = await import("@codemirror/lang-php");
      return php();
    }
    case "sql": {
      const { sql } = await import("@codemirror/lang-sql");
      return sql();
    }
    case "json": {
      const { json } = await import("@codemirror/lang-json");
      return json();
    }
    case "html": {
      const { html } = await import("@codemirror/lang-html");
      return html();
    }
    case "css": {
      const { css } = await import("@codemirror/lang-css");
      return css();
    }
    case "xml": {
      const { xml } = await import("@codemirror/lang-xml");
      return xml();
    }
    case "markdown": {
      const { markdown } = await import("@codemirror/lang-markdown");
      return markdown();
    }
    case "yaml": {
      const { yaml } = await import("@codemirror/lang-yaml");
      return yaml();
    }
    case "kotlin":
      return loadClikeLegacy("kotlin");
    case "csharp":
      return loadClikeLegacy("csharp");
    case "scala":
      return loadClikeLegacy("scala");
    case "swift":
      return loadLegacyMode(() => import("@codemirror/legacy-modes/mode/swift"), "swift");
    case "ruby":
      return loadLegacyMode(() => import("@codemirror/legacy-modes/mode/ruby"), "ruby");
    case "bash":
      return loadLegacyMode(() => import("@codemirror/legacy-modes/mode/shell"), "shell");
    case "powershell":
      return loadLegacyMode(
        () => import("@codemirror/legacy-modes/mode/powershell"),
        "powerShell",
      );
    case "lua":
      return loadLegacyMode(() => import("@codemirror/legacy-modes/mode/lua"), "lua");
    case "perl":
      return loadLegacyMode(() => import("@codemirror/legacy-modes/mode/perl"), "perl");
    case "r":
      return loadLegacyMode(() => import("@codemirror/legacy-modes/mode/r"), "r");
    case "toml":
      return loadLegacyMode(() => import("@codemirror/legacy-modes/mode/toml"), "toml");
    case "ini":
      return loadLegacyMode(
        () => import("@codemirror/legacy-modes/mode/properties"),
        "properties",
      );
    case "scss":
      return loadLegacyMode(() => import("@codemirror/legacy-modes/mode/sass"), "sass");
    case "less": {
      const { css } = await import("@codemirror/lang-css");
      return css();
    }
    case "dockerfile":
      return loadLegacyMode(
        () => import("@codemirror/legacy-modes/mode/dockerfile"),
        "dockerFile",
      );
    case "nginx":
      return loadLegacyMode(() => import("@codemirror/legacy-modes/mode/nginx"), "nginx");
    case "graphql":
      return loadLegacyMode(
        () => import("@codemirror/legacy-modes/mode/javascript"),
        "javascript",
      );
    case "protobuf":
      return loadLegacyMode(
        () => import("@codemirror/legacy-modes/mode/protobuf"),
        "protobuf",
      );
    case "apl":
      return loadLegacyMode(() => import("@codemirror/legacy-modes/mode/apl"), "apl");
    case "asn1":
      return loadAsn1Legacy();
    case "brainfuck":
      return loadLegacyMode(
        () => import("@codemirror/legacy-modes/mode/brainfuck"),
        "brainfuck",
      );
    case "plaintext":
      return [];
    default:
      return [];
  }
}

async function loadClikeLegacy(type: "kotlin" | "csharp" | "scala") {
  const clikeModule = await import("@codemirror/legacy-modes/mode/clike");
  return StreamLanguage.define(clikeModule[type]);
}

async function loadAsn1Legacy() {
  const asn1Module = await import("@codemirror/legacy-modes/mode/asn1");
  return StreamLanguage.define(asn1Module.asn1({}));
}

async function loadLegacyMode<T extends string>(
  loader: () => Promise<Record<T, StreamParser<unknown>>>,
  exportName: T,
): Promise<Extension> {
  const modeModule = await loader();
  const parser = modeModule[exportName];

  if (!parser) return [];

  return StreamLanguage.define(parser);
}
