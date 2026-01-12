"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Modal(props: {
  open: boolean;
  title: string;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onConfirm?: () => void;
  confirmText?: string;
  confirmDisabled?: boolean;
  onCancel?: () => void;
  cancelText?: string;
  className?: string;
}) {
  const {
    open,
    title,
    onOpenChange,
    children,
    footer,
    onConfirm,
    confirmText = "确定",
    confirmDisabled,
    onCancel,
    cancelText = "取消",
    className,
  } = props;

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      onOpenChange(false);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onPointerDown={() => onOpenChange(false)}
    >
      <div className="absolute inset-0 bg-foreground/20" />

      <div
        className={cn(
          "relative w-[720px] max-w-[calc(100vw-2rem)] rounded-xl border bg-card text-card-foreground shadow-sm",
          className,
        )}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div className="text-sm font-medium">{title}</div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 px-0"
            aria-label="关闭"
            onClick={() => onOpenChange(false)}
          >
            ×
          </Button>
        </div>

        <div className="px-5 py-5">{children}</div>

        {footer === undefined ? (
          <div className="flex items-center justify-end gap-2 border-t px-5 py-4">
            <Button type="button" variant="outline" onClick={handleCancel}>
              {cancelText}
            </Button>
            <Button
              type="button"
              variant="default"
              disabled={confirmDisabled}
              onClick={onConfirm}
            >
              {confirmText}
            </Button>
          </div>
        ) : footer ? (
          <div className="flex items-center justify-end gap-2 border-t px-5 py-4">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
