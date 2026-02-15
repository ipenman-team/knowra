'use client';

import { useSlate } from 'slate-react';

import { ToolbarButton } from '../toolbar-button';
import type { ToolbarPluginProps } from '../types';
import { isBulletedListActive, runBulletedList } from './logic';
import { LogsIcon } from 'lucide-react';

export function BulletedListPluginView(props: ToolbarPluginProps) {
  const editor = useSlate();

  return (
    <ToolbarButton
      label="•"
      icon={<LogsIcon />}
      tooltip="无序列表"
      active={isBulletedListActive(editor)}
      disabled={props.disabled}
      onMouseDown={(e) => {
        e.preventDefault();
        runBulletedList(editor);
      }}
    />
  );
}
