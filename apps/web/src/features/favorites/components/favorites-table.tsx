'use client';

import { format, parseISO } from 'date-fns';
import { useNavigation } from '@/lib/navigation';
import { Empty } from '@/components/empty';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type {
  FavoriteListState,
  FavoritePageItem,
  FavoriteSection,
  FavoriteSpaceItem,
} from '../types';

type FavoritesTableProps = {
  section: FavoriteSection;
  state: FavoriteListState;
  spaceItems: FavoriteSpaceItem[];
  pageItems: FavoritePageItem[];
};

function formatFavoriteTime(value: string): string {
  const parsed = parseISO(value);
  if (Number.isNaN(parsed.getTime())) return '--';
  return format(parsed, 'yyyy-MM-dd HH:mm');
}

function CellLink(props: {
  text: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  if (props.disabled) {
    return <span className="text-muted-foreground">{props.text}</span>;
  }

  return (
    <button
      type="button"
      onClick={props.onClick}
      className="max-w-full truncate text-left font-medium text-foreground hover:text-primary"
      title={props.text}
    >
      {props.text}
    </button>
  );
}

function SpaceRows(props: {
  items: FavoriteSpaceItem[];
  loading: boolean;
  error: string | null;
}) {
  const { navigateToSpace } = useNavigation();

  if (props.loading) {
    return (
      <TableRow>
        <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
          加载中…
        </TableCell>
      </TableRow>
    );
  }

  if (props.error) {
    return (
      <TableRow>
        <TableCell colSpan={3} className="h-24 text-center text-destructive">
          {props.error}
        </TableCell>
      </TableRow>
    );
  }

  if (props.items.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={3} className="h-24 p-0">
          <Empty text="暂无空间收藏" className="border-0" />
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {props.items.map((item) => (
        <TableRow key={item.favoriteId}>
          <TableCell className="font-medium">
            <CellLink text={item.name} onClick={() => navigateToSpace(item.targetId)} />
          </TableCell>
          <TableCell className="text-muted-foreground">
            {item.identifier || '--'}
          </TableCell>
          <TableCell className="whitespace-nowrap text-muted-foreground">
            {formatFavoriteTime(item.favoritedAt)}
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

function PageRows(props: {
  items: FavoritePageItem[];
  loading: boolean;
  error: string | null;
}) {
  const { navigateToPage } = useNavigation();

  if (props.loading) {
    return (
      <TableRow>
        <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
          加载中…
        </TableCell>
      </TableRow>
    );
  }

  if (props.error) {
    return (
      <TableRow>
        <TableCell colSpan={3} className="h-24 text-center text-destructive">
          {props.error}
        </TableCell>
      </TableRow>
    );
  }

  if (props.items.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={3} className="h-24 p-0">
          <Empty text="暂无页面收藏" className="border-0" />
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {props.items.map((item) => {
        const spaceText = item.spaceName
          ? item.spaceIdentifier
            ? `${item.spaceName} (${item.spaceIdentifier})`
            : item.spaceName
          : '--';

        return (
          <TableRow key={item.favoriteId}>
            <TableCell className="font-medium">
              <CellLink
                text={item.name}
                disabled={!item.spaceId}
                onClick={() => {
                  if (!item.spaceId) return;
                  navigateToPage(item.spaceId, item.targetId);
                }}
              />
            </TableCell>
            <TableCell className="text-muted-foreground" title={spaceText}>
              <span className="line-clamp-1">{spaceText}</span>
            </TableCell>
            <TableCell className="whitespace-nowrap text-muted-foreground">
              {formatFavoriteTime(item.favoritedAt)}
            </TableCell>
          </TableRow>
        );
      })}
    </>
  );
}

export function FavoritesTable(props: FavoritesTableProps) {
  const loading = props.state.loading;
  const error = props.state.error;

  return (
    <div className="min-h-0 flex-1 overflow-auto rounded-md border">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-background">
          <TableRow>
            <TableHead className="w-[35%]">名称</TableHead>
            <TableHead className="w-[35%]">
              {props.section === 'SPACE' ? '标识' : '所属空间'}
            </TableHead>
            <TableHead className="w-[30%]">收藏时间</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {props.section === 'SPACE' ? (
            <SpaceRows items={props.spaceItems} loading={loading} error={error} />
          ) : (
            <PageRows items={props.pageItems} loading={loading} error={error} />
          )}
        </TableBody>
      </Table>
    </div>
  );
}
