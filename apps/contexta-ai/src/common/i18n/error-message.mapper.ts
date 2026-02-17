import type { AppLocale } from './locale.constants';

type LocalizedError = {
  message: string;
  errorCode?: string;
};

const exactMessageMap: Record<
  string,
  { errorCode: string; zh: string; en: string }
> = {
  'bad request': {
    errorCode: 'BAD_REQUEST',
    zh: '请求参数错误',
    en: 'Bad request',
  },
  'format not supported': {
    errorCode: 'FORMAT_NOT_SUPPORTED',
    zh: '格式不支持',
    en: 'Format not supported',
  },
  'file content is empty': {
    errorCode: 'FILE_CONTENT_EMPTY',
    zh: '文件内容为空',
    en: 'File content is empty',
  },
  'invalid pdf': {
    errorCode: 'INVALID_PDF',
    zh: 'PDF 文件无效',
    en: 'Invalid PDF',
  },
  'invalid docx': {
    errorCode: 'INVALID_DOCX',
    zh: 'DOCX 文件无效',
    en: 'Invalid DOCX',
  },
  'stream error': {
    errorCode: 'STREAM_ERROR',
    zh: '流式响应异常',
    en: 'Stream error',
  },
  'conversation not found': {
    errorCode: 'CONVERSATION_NOT_FOUND',
    zh: '会话不存在',
    en: 'Conversation not found',
  },
};

function toErrorCodeToken(input: string): string {
  return input
    .trim()
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
    return {
      message:
        locale === 'zh-CN' ? `${field} 为必填项` : `${field} is required`,
      errorCode: `${toErrorCodeToken(field)}_REQUIRED`,
    };
  }

  const booleanMatch = raw.match(/^(.+?)\s+must be boolean$/i);
  if (booleanMatch) {
    const field = booleanMatch[1].trim();
    return {
      message:
        locale === 'zh-CN'
          ? `${field} 必须是布尔值`
          : `${field} must be boolean`,
      errorCode: `${toErrorCodeToken(field)}_MUST_BE_BOOLEAN`,
    };
  }

  const invalidMatch = raw.match(/^(.+?)\s+invalid$/i);
  if (invalidMatch) {
    const field = invalidMatch[1].trim();
    return {
      message: locale === 'zh-CN' ? `${field} 无效` : `${field} invalid`,
      errorCode: `${toErrorCodeToken(field)}_INVALID`,
    };
  }

  return { message: raw };
}
