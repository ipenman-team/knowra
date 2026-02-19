import { PageActivityAction } from '../page/constant';
import { SpaceActivityAction } from '../space/constant';

type ActivityLike = {
  action: string;
  subjectType: string;
  subjectId: string;
  metadata?: unknown | null;
};

const SPACE_CHANGE_LABELS: Record<string, string> = {
  name: '名称',
  description: '描述',
  icon: '图标',
  color: '颜色',
  identifier: '标识',
  type: '类型',
  metadata: '扩展信息',
};

const SPACE_TYPE_LABELS: Record<string, string> = {
  PERSONAL: '个人',
  ORG: '组织',
};

const MAX_VALUE_LENGTH = 80;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    return truncate(trimmed);
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.length ? `(${value.length}项)` : '空';
  }
  if (isRecord(value)) {
    return '已更新';
  }
  return truncate(String(value));
}

function truncate(value: string, limit = MAX_VALUE_LENGTH) {
  if (value.length <= limit) return value;
  return `${value.slice(0, limit)}…`;
}

function formatFromTo(from: string | null, to: string | null) {
  if (!from && !to) return '';
  if (!from) return to ?? '';
  if (!to) return `${from} → 无`;
  if (from === to) return to;
  return `${from} → ${to}`;
}

function readString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function formatSpaceUpdateContent(metadata: unknown): string | null {
  const meta = isRecord(metadata) ? metadata : null;
  const changesRaw = meta?.changes;
  const changes = isRecord(changesRaw) ? changesRaw : null;
  if (!changes) return null;

  const parts: string[] = [];
  for (const [key, rawChange] of Object.entries(changes)) {
    const change = isRecord(rawChange) ? rawChange : null;
    if (!change) continue;

    if (key === 'metadata') {
      parts.push(`${SPACE_CHANGE_LABELS[key] ?? key}：已更新`);
      continue;
    }

    const label = SPACE_CHANGE_LABELS[key] ?? key;
    const fromValue =
      key === 'type' && typeof change.from === 'string'
        ? SPACE_TYPE_LABELS[change.from] ?? change.from
        : toText(change.from);
    const toValue =
      key === 'type' && typeof change.to === 'string'
        ? SPACE_TYPE_LABELS[change.to] ?? change.to
        : toText(change.to);
    const text = formatFromTo(fromValue, toValue);
    if (!text) continue;
    parts.push(`${label}：${text}`);
  }

  if (parts.length) return parts.join('；');
  return '已更新';
}

function formatSpaceRenameContent(metadata: unknown): string | null {
  const meta = isRecord(metadata) ? metadata : null;
  const fromName = readString(isRecord(meta?.from) ? meta?.from?.name : null);
  const toName = readString(isRecord(meta?.to) ? meta?.to?.name : null);
  const text = formatFromTo(fromName, toName);
  return text ? `名称：${text}` : null;
}

function formatPageRenameContent(metadata: unknown): string | null {
  const meta = isRecord(metadata) ? metadata : null;
  const fromTitle = readString(meta?.fromTitle);
  const toTitle = readString(meta?.toTitle);
  const text = formatFromTo(fromTitle, toTitle);
  return text ? `标题：${text}` : null;
}

function pickMetadataTitle(metadata: unknown): string | null {
  const meta = isRecord(metadata) ? metadata : null;
  if (!meta) return null;
  return (
    readString(meta.title) ??
    readString(meta.name) ??
    readString(meta.filename) ??
    readString(meta.fileName) ??
    readString(meta.identifier)
  );
}

export function formatActivityContent(activity: ActivityLike): string | null {
  const { action, metadata } = activity;

  switch (action) {
    case SpaceActivityAction.Update:
      return formatSpaceUpdateContent(metadata);
    case SpaceActivityAction.Rename:
      return formatSpaceRenameContent(metadata);
    case SpaceActivityAction.Create:
    case SpaceActivityAction.Favorite:
    case SpaceActivityAction.Unfavorite:
    case SpaceActivityAction.Delete: {
      const meta = isRecord(metadata) ? metadata : null;
      return readString(meta?.name) ?? readString(meta?.identifier) ?? null;
    }
    case PageActivityAction.Rename:
      return formatPageRenameContent(metadata);
    case PageActivityAction.Create:
    case PageActivityAction.Publish:
    case PageActivityAction.Like:
    case PageActivityAction.Unlike:
    case PageActivityAction.Delete:
    case PageActivityAction.Restore:
    case PageActivityAction.Purge: {
      const meta = isRecord(metadata) ? metadata : null;
      return readString(meta?.title) ?? null;
    }
    default:
      return pickMetadataTitle(metadata);
  }
}
