'use client';

import { useSlate } from 'slate-react';

import { ToolbarButton } from '../toolbar-button';
import type { ToolbarPluginProps } from '../types';
import { runUndo } from './logic';
import { Undo2Icon } from 'lucide-react';

export function UndoPluginView(props: ToolbarPluginProps) {
  const editor = useSlate();

  return (
    <ToolbarButton
      label="↶"
      icon={<Undo2Icon />}
      tooltip="撤销"
      disabled={props.disabled}
      onMouseDown={(e) => {
        e.preventDefault();
        runUndo(editor);
      }}
    />
  );
}
