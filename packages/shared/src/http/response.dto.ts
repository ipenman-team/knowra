export class Response<TData, TReferences = unknown> {
  data: TData;
  references?: TReferences;

  constructor(data: TData, references?: TReferences) {
    this.data = data;
    this.references = references;
  }
}

export class ListResponse<TData, TReferences = unknown> {
  data: TData[];
  references?: TReferences;
  meta?: unknown;

  constructor(data: TData[], references?: TReferences, meta?: unknown) {
    this.data = data;
    this.references = references;
    this.meta = meta;
  }
}

export class ErrorResponse {
  errorCode: number | string;
  message: string;

  constructor(errorCode: number | string, message: string) {
    this.errorCode = errorCode;
    this.message = message;
  }
}
