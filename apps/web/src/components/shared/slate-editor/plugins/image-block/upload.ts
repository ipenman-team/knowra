import { filesApi } from "@/lib/api";

export async function uploadEditorImage(file: File, from = "editor/image") {
  if (!file.type.startsWith("image/")) {
    throw new Error("仅支持图片文件");
  }

  const result = await filesApi.upload({ file, from });

  if (!result.url?.trim()) {
    throw new Error("上传成功但未返回图片地址");
  }

  return result.url.trim();
}
