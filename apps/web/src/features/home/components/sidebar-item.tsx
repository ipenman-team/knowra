import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SidebarItem(props: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      className={cn(
        "h-9 w-full justify-start gap-2 px-2",
        props.active && "bg-accent text-accent-foreground",
      )}
      onClick={props.onClick}
    >
      <span className="truncate">{props.label}</span>
    </Button>
  );
}
