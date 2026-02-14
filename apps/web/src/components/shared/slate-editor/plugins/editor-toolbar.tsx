"use client";

import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import { AlignPluginView } from "./align/view";
import { BackgroundColorPluginView } from "./background-color/view";
import { BlockQuotePluginView } from "./block-quote/view";
import { BoldPluginView } from "./bold/view";
import { BulletedListPluginView } from "./bulleted-list/view";
import { CodeBlockPluginView } from "./code-block/view";
import { DiagramBlockPluginView } from "./diagram-block/view";
import { EmojiPluginView } from "./emoji/view";
import { FontSizePluginView } from "./font-size/view";
import { HeadingOnePluginView } from "./heading-one/view";
import { HeadingTwoPluginView } from "./heading-two/view";
import { ImageBlockPluginView } from "./image-block/view";
import { ItalicPluginView } from "./italic/view";
import { LinkPluginView } from "./link/view";
import { NumberedListPluginView } from "./numbered-list/view";
import { RedoPluginView } from "./redo/view";
import { TextColorPluginView } from "./text-color/view";
import { TableBlockPluginView } from "./table-block/view";
import { UnderlinePluginView } from "./underline/view";
import { UndoPluginView } from "./undo/view";

export function EditorToolbar(props: { disabled?: boolean }) {
  return (
    <div
      className={cn(
        "sticky z-20 -mx-1 mb-3 flex items-center gap-1",
        "rounded-md border bg-background px-2 py-1",
      )}
      style={{ top: "var(--page-header-sticky-height, 3.5rem)" }}
    >
      <UndoPluginView disabled={props.disabled} />
      <RedoPluginView disabled={props.disabled} />

      <Separator orientation="vertical" className="mx-1 h-5" />

      <HeadingOnePluginView disabled={props.disabled} />
      <HeadingTwoPluginView disabled={props.disabled} />
      <BlockQuotePluginView disabled={props.disabled} />
      <CodeBlockPluginView disabled={props.disabled} />
      <DiagramBlockPluginView disabled={props.disabled} />
      <ImageBlockPluginView disabled={props.disabled} />
      <TableBlockPluginView disabled={props.disabled} />
      <EmojiPluginView disabled={props.disabled} />

      <Separator orientation="vertical" className="mx-1 h-5" />

      <FontSizePluginView disabled={props.disabled} />
      <BoldPluginView disabled={props.disabled} />
      <ItalicPluginView disabled={props.disabled} />
      <UnderlinePluginView disabled={props.disabled} />
      <LinkPluginView disabled={props.disabled} />
      <TextColorPluginView disabled={props.disabled} />
      <BackgroundColorPluginView disabled={props.disabled} />

      <Separator orientation="vertical" className="mx-1 h-5" />

      <AlignPluginView disabled={props.disabled} />
      <BulletedListPluginView disabled={props.disabled} />
      <NumberedListPluginView disabled={props.disabled} />
    </div>
  );
}
