import { apiClient } from './client';

export type UploadFileResult = {
  url: string;
  date?: string;
};

export const filesApi = {
  async upload(input: { file: File; from: string }) {
    const formData = new FormData();
    formData.set('file', input.file, input.file.name);
    formData.set('from', input.from);
    const res = await apiClient.post<UploadFileResult>('/files/upload', formData);
    return res.data;
  },
};
