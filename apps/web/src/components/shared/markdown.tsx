import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

export function Markdown(props: { content: string; className?: string }) {
  const content = props.content ?? "";

  return (
    <div className={cn("text-sm leading-6 text-foreground", props.className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          p: (p) => <p className="mt-3 first:mt-0">{p.children}</p>,
          ul: (p) => <ul className="mt-3 list-disc pl-5">{p.children}</ul>,
          ol: (p) => <ol className="mt-3 list-decimal pl-5">{p.children}</ol>,
          li: (p) => <li className="mt-1">{p.children}</li>,
          a: (p) => (
            <a
              href={String(p.href ?? "#")}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2"
            >
              {p.children}
            </a>
          ),
          blockquote: (p) => (
            <blockquote className="mt-3 border-l-2 pl-4 text-muted-foreground">
              {p.children}
            </blockquote>
          ),
          code: (p) => {
            const inline = (p as { inline?: unknown }).inline === true;
            if (inline) {
              return (
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">
                  {p.children}
                </code>
              );
            }
            return <code className="font-mono text-xs">{p.children}</code>;
          },
          pre: (p) => (
            <pre className="mt-3 overflow-x-auto rounded-md border bg-muted p-3 text-xs leading-5">
              {p.children}
            </pre>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
