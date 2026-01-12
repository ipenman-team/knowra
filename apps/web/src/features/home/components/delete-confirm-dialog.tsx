import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function DeleteConfirmDialog(props: {
  target: { id: string; title: string } | null;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!props.target) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-6"
      role="dialog"
      aria-modal="true"
      aria-label="删除确认"
      onPointerDown={() => {
        if (props.deleting) return;
        props.onCancel();
      }}
    >
      <div onPointerDown={(e) => e.stopPropagation()} className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle>确认删除？</CardTitle>
            <CardDescription>将删除“{props.target.title}”，此操作无法撤销。</CardDescription>
          </CardHeader>

          <div className="flex items-center justify-end gap-2 px-6 pb-6">
            <Button type="button" variant="outline" disabled={props.deleting} onClick={props.onCancel}>
              取消
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              disabled={props.deleting}
              onClick={props.onConfirm}
            >
              删除
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
