"use client";

import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import { BlockQuotePluginView } from "./block-quote/view";
import { BoldPluginView } from "./bold/view";
import { BulletedListPluginView } from "./bulleted-list/view";
import { CodeBlockPluginView } from "./code-block/view";
import { DiagramBlockPluginView } from "./diagram-block/view";
import { HeadingOnePluginView } from "./heading-one/view";
import { HeadingTwoPluginView } from "./heading-two/view";
import { ItalicPluginView } from "./italic/view";
import { NumberedListPluginView } from "./numbered-list/view";
import { RedoPluginView } from "./redo/view";
import { UnderlinePluginView } from "./underline/view";
import { UndoPluginView } from "./undo/view";

export function EditorToolbar(props: { disabled?: boolean }) {
  return (
    <div
      className={cn(
        "sticky top-12 z-10 -mx-1 mb-3 flex items-center gap-1",
        "rounded-md border bg-background px-2 py-1",
      )}
    >
      <UndoPluginView disabled={props.disabled} />
      <RedoPluginView disabled={props.disabled} />

      <Separator orientation="vertical" className="mx-1 h-5" />

      <HeadingOnePluginView disabled={props.disabled} />
      <HeadingTwoPluginView disabled={props.disabled} />
      <BlockQuotePluginView disabled={props.disabled} />
      <CodeBlockPluginView disabled={props.disabled} />
      <DiagramBlockPluginView disabled={props.disabled} />

      <Separator orientation="vertical" className="mx-1 h-5" />

      <BoldPluginView disabled={props.disabled} />
      <ItalicPluginView disabled={props.disabled} />
      <UnderlinePluginView disabled={props.disabled} />

      <Separator orientation="vertical" className="mx-1 h-5" />

      <BulletedListPluginView disabled={props.disabled} />
      <NumberedListPluginView disabled={props.disabled} />
    </div>
  );
}
