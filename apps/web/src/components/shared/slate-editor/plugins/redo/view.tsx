'use client';

import { useSlate } from 'slate-react';

import { ToolbarButton } from '../toolbar-button';
import type { ToolbarPluginProps } from '../types';
import { runRedo } from './logic';
import { Redo2Icon } from 'lucide-react';

export function RedoPluginView(props: ToolbarPluginProps) {
  const editor = useSlate();

  return (
    <ToolbarButton
      label="↷"
      icon={<Redo2Icon />}
      tooltip="重做"
      disabled={props.disabled}
      onMouseDown={(e) => {
        e.preventDefault();
        runRedo(editor);
      }}
    />
  );
}
