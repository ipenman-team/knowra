"use client";

import type { ComponentType, PointerEventHandler } from "react";
import { GripVertical, Trash2 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type BlockHandleMenuAction = {
  key: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  disabled?: boolean;
  destructive?: boolean;
  onSelect: () => void;
};

type BlockElementHandleMenuProps = {
  active?: boolean;
  className?: string;
  handleClassName?: string;
  actions?: BlockHandleMenuAction[];
  onDelete: () => void;
  deleteDisabled?: boolean;
  deleteLabel?: string;
  onDragHandlePointerDown?: PointerEventHandler<HTMLButtonElement>;
};

export function BlockElementHandleMenu(props: BlockElementHandleMenuProps) {
  const actions = props.actions ?? [];

  return (
    <div
      contentEditable={false}
      className={cn(
        "pointer-events-none absolute -left-10 top-2 z-50 opacity-0 transition-opacity",
        "group-hover/block:opacity-100 group-focus-within/block:opacity-100",
        props.active && "opacity-100",
        props.className,
      )}
    >
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            data-block-handle
            draggable={false}
            className={cn(
              "pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background/95 text-muted-foreground shadow-sm transition-colors",
              "hover:bg-accent hover:text-accent-foreground",
              props.handleClassName,
            )}
            onMouseDown={(event) => {
              event.stopPropagation();
            }}
            onPointerDown={props.onDragHandlePointerDown}
            aria-label="块操作菜单"
            title="块操作"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" side="right" className="w-44">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <DropdownMenuItem
                key={action.key}
                disabled={action.disabled}
                className={cn(action.destructive && "text-red-500 focus:bg-red-50 focus:text-red-600")}
                onSelect={() => {
                  action.onSelect();
                }}
              >
                {Icon ? <Icon className="h-4 w-4" /> : null}
                {action.label}
              </DropdownMenuItem>
            );
          })}

          {actions.length > 0 ? <DropdownMenuSeparator /> : null}

          <DropdownMenuItem
            disabled={props.deleteDisabled}
            className="text-red-500 focus:bg-red-50 focus:text-red-600"
            onSelect={props.onDelete}
          >
            <Trash2 className="h-4 w-4" />
            {props.deleteLabel ?? "删除"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
