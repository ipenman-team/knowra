import { ERROR_CODES, type ErrorCode } from '@knowra/shared';

import type { AppLocale } from './locale.constants';

type LocalizedError = {
  message: string;
  errorCode?: string;
};

const exactMessageMap: Record<
  string,
  { errorCode: ErrorCode; zh: string; en: string }
> = {
  unauthorized: {
    errorCode: ERROR_CODES.UNAUTHORIZED,
    zh: '未授权访问',
    en: 'Unauthorized',
  },
  forbidden: {
    errorCode: ERROR_CODES.FORBIDDEN,
    zh: '无权限访问',
    en: 'Forbidden',
  },
  'not found': {
    errorCode: ERROR_CODES.NOT_FOUND,
    zh: '资源不存在',
    en: 'Not found',
  },
  'bad request': {
    errorCode: ERROR_CODES.BAD_REQUEST,
    zh: '请求参数错误',
    en: 'Bad request',
  },
  'format not supported': {
    errorCode: ERROR_CODES.FORMAT_NOT_SUPPORTED,
    zh: '格式不支持',
    en: 'Format not supported',
  },
  'file content is empty': {
    errorCode: ERROR_CODES.FILE_CONTENT_EMPTY,
    zh: '文件内容为空',
    en: 'File content is empty',
  },
  'invalid pdf': {
    errorCode: ERROR_CODES.INVALID_PDF,
    zh: 'PDF 文件无效',
    en: 'Invalid PDF',
  },
  'invalid docx': {
    errorCode: ERROR_CODES.INVALID_DOCX,
    zh: 'DOCX 文件无效',
    en: 'Invalid DOCX',
  },
  'stream error': {
    errorCode: ERROR_CODES.STREAM_ERROR,
    zh: '流式响应异常',
    en: 'Stream error',
  },
  'conversation not found': {
    errorCode: ERROR_CODES.CONVERSATION_NOT_FOUND,
    zh: '会话不存在',
    en: 'Conversation not found',
  },
  'share not found': {
    errorCode: ERROR_CODES.SHARE_NOT_FOUND,
    zh: '分享不存在',
    en: 'Share not found',
  },
  'space not found': {
    errorCode: ERROR_CODES.SPACE_NOT_FOUND,
    zh: '空间不存在',
    en: 'Space not found',
  },
  'page not found': {
    errorCode: ERROR_CODES.PAGE_NOT_FOUND,
    zh: '页面不存在',
    en: 'Page not found',
  },
  'version not found': {
    errorCode: ERROR_CODES.VERSION_NOT_FOUND,
    zh: '版本不存在',
    en: 'Version not found',
  },
  'task not found': {
    errorCode: ERROR_CODES.TASK_NOT_FOUND,
    zh: '任务不存在',
    en: 'Task not found',
  },
  'daily copy not found': {
    errorCode: ERROR_CODES.DAILY_COPY_NOT_FOUND,
    zh: '每日一句不存在',
    en: 'Daily copy not found',
  },
  'attachment indexing is not configured': {
    errorCode: ERROR_CODES.ATTACHMENT_INDEXING_NOT_CONFIGURED,
    zh: '附件索引功能未配置',
    en: 'Attachment indexing is not configured',
  },
  'attachment search is not configured': {
    errorCode: ERROR_CODES.ATTACHMENT_SEARCH_NOT_CONFIGURED,
    zh: '附件搜索功能未配置',
    en: 'Attachment search is not configured',
  },
};

function toErrorCodeToken(input: string): string {
  return input
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();
}

export function localizeErrorMessage(
  message: string,
  locale: AppLocale,
): LocalizedError {
  const raw = message.trim();
  if (!raw) return { message };
  const lowered = raw.toLowerCase();

  const exact = exactMessageMap[lowered];
  if (exact) {
    return {
      message: locale === 'zh-CN' ? exact.zh : exact.en,
      errorCode: exact.errorCode,
    };
  }

  const requiredMatch = raw.match(/^(.+?)\s+is required$/i);
  if (requiredMatch) {
    const field = requiredMatch[1].trim();
    const codeToken = toErrorCodeToken(field) || 'FIELD';
    return {
      message:
        locale === 'zh-CN' ? `${field} 为必填项` : `${field} is required`,
      errorCode: `${codeToken}_REQUIRED`,
    };
  }

  const booleanMatch = raw.match(/^(.+?)\s+must be boolean$/i);
  if (booleanMatch) {
    const field = booleanMatch[1].trim();
    const codeToken = toErrorCodeToken(field) || 'FIELD';
    return {
      message:
        locale === 'zh-CN'
          ? `${field} 必须是布尔值`
          : `${field} must be boolean`,
      errorCode: `${codeToken}_MUST_BE_BOOLEAN`,
    };
  }

  const isoDateMatch = raw.match(/^(.+?)\s+must be ISO date \(YYYY-MM-DD\)$/i);
  if (isoDateMatch) {
    const field = isoDateMatch[1].trim();
    const codeToken = toErrorCodeToken(field) || 'FIELD';
    return {
      message:
        locale === 'zh-CN'
          ? `${field} 必须是 ISO 日期（YYYY-MM-DD）`
          : `${field} must be ISO date (YYYY-MM-DD)`,
      errorCode: `${codeToken}_MUST_BE_ISO_DATE`,
    };
  }

  const invalidMatch = raw.match(/^(.+?)\s+invalid$/i);
  if (invalidMatch) {
    const field = invalidMatch[1].trim();
    const codeToken = toErrorCodeToken(field) || 'FIELD';
    return {
      message: locale === 'zh-CN' ? `${field} 无效` : `${field} invalid`,
      errorCode: `${codeToken}_INVALID`,
    };
  }

  return { message: raw };
}
