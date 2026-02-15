'use client';

import { useSlate } from 'slate-react';

import { ToolbarButton } from '../toolbar-button';
import type { ToolbarPluginProps } from '../types';
import { insertCodeBlock, isCodeBlockActive } from './logic';
import { CodeXml } from 'lucide-react';

export function CodeBlockPluginView(props: ToolbarPluginProps) {
  const editor = useSlate();

  return (
    <ToolbarButton
      label="</>"
      icon={<CodeXml />}
      tooltip="代码块"
      active={isCodeBlockActive(editor)}
      disabled={props.disabled}
      onMouseDown={(event) => {
        event.preventDefault();
        insertCodeBlock(editor);
      }}
    />
  );
}
