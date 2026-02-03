import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { InputGroupButton } from '@/components/ui/input-group';
import { Switch } from '@/components/ui/switch';
import { Check, Settings2 } from 'lucide-react';

function normalizeSpaceIds(spaceIds: string[]): string[] {
  const uniq = new Set<string>();
  for (const raw of spaceIds) {
    const v = String(raw ?? '').trim();
    if (!v) continue;
    uniq.add(v);
  }
  return Array.from(uniq);
}

export function ContextaAiSourcesMenu(props: {
  spaces: Array<{ id: string; name: string }>;

  internetEnabled: boolean;
  spaceEnabled: boolean;
  selectedSpaceIds: string[];

  onInternetEnabledChange: (enabled: boolean) => void;
  onSpaceEnabledChange: (enabled: boolean) => void;
  onSelectedSpaceIdsChange: (spaceIds: string[]) => void;
}) {
  const selectedSpaceIds = normalizeSpaceIds(props.selectedSpaceIds);

  function toggleSpaceId(spaceId: string) {
    const next = new Set(selectedSpaceIds);
    if (next.has(spaceId)) next.delete(spaceId);
    else next.add(spaceId);
    props.onSelectedSpaceIdsChange(Array.from(next));
  }

  const isAllSpaces = selectedSpaceIds.length === 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <InputGroupButton
          variant="ghost"
          size="icon-sm"
          aria-label="信息源设置"
        >
          <Settings2 className="h-4 w-4" />
        </InputGroupButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side="top"
        align="start"
        className="[--radius:0.95rem]"
      >
        <DropdownMenuItem
          className="flex items-center justify-between gap-3"
          onSelect={(e) => {
            // Keep menu open while toggling.
            e.preventDefault();
            props.onInternetEnabledChange(!props.internetEnabled);
          }}
        >
          <span>互联网</span>
          <Switch
            checked={props.internetEnabled}
            onCheckedChange={(v) => props.onInternetEnabledChange(Boolean(v))}
          />
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuSub>
          <DropdownMenuSubTrigger
            onSelect={(e) => {
              // Keep menu open; submenu still opens on hover.
              e.preventDefault();
            }}
          >
            <span className="inline-flex w-full items-center justify-between gap-3">
              <span>空间</span>
              <span className="inline-flex items-center gap-2">
                <Switch
                  checked={props.spaceEnabled}
                  onCheckedChange={(v) =>
                    props.onSpaceEnabledChange(Boolean(v))
                  }
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                />
              </span>
            </span>
          </DropdownMenuSubTrigger>

          <DropdownMenuSubContent className="min-w-56">
            <DropdownMenuCheckboxItem
              disabled={!props.spaceEnabled}
              checked={isAllSpaces}
              onCheckedChange={(v) => {
                if (!props.spaceEnabled) return;
                if (Boolean(v)) props.onSelectedSpaceIdsChange([]);
              }}
            >
              全部
            </DropdownMenuCheckboxItem>

            <DropdownMenuSeparator />

            <div className="max-h-60 overflow-y-auto">
              {props.spaces.length === 0 ? (
                <DropdownMenuCheckboxItem disabled checked={false}>
                  暂无空间
                </DropdownMenuCheckboxItem>
              ) : (
                props.spaces.map((s) => (
                  <DropdownMenuCheckboxItem
                    key={s.id}
                    disabled={!props.spaceEnabled}
                    checked={selectedSpaceIds.includes(s.id)}
                    onCheckedChange={() => {
                      if (!props.spaceEnabled) return;
                      toggleSpaceId(s.id);
                    }}
                  >
                    {s.name}
                  </DropdownMenuCheckboxItem>
                ))
              )}
            </div>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
