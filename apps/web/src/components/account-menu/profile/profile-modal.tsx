"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { UploadIcon } from "lucide-react";
import { useMeStore } from "@/stores";
import { apiClient } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";

export const ProfileModal = memo(function ProfileModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const profile = useMeStore((s) => s.profile);
  const ensureMeLoaded = useMeStore((s) => s.ensureLoaded);
  const updateProfile = useMeStore((s) => s.updateProfile);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const formRef = useRef<HTMLFormElement | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const draftTouchedRef = useRef(false);

  const [draftNickname, setDraftNickname] = useState("");
  const [draftAvatarUrl, setDraftAvatarUrl] = useState("");
  const [draftBio, setDraftBio] = useState("");

  const nickname = profile?.nickname?.trim() || "";
  const avatarUrl = profile?.avatarUrl || undefined;
  const profilePhone = profile?.phone?.trim() || "";

  const syncDraft = useCallback(() => {
    setProfileError(null);
    setDraftNickname(nickname);
    setDraftAvatarUrl(profile?.avatarUrl ?? "");
    setDraftBio(profile?.bio ?? "");
  }, [nickname, profile?.avatarUrl, profile?.bio]);

  useEffect(() => {
    if (!open) return;
    void ensureMeLoaded();
  }, [ensureMeLoaded, open]);

  useEffect(() => {
    if (!open) return;
    if (draftTouchedRef.current) return;
    syncDraft();
  }, [open, syncDraft]);

  const handleUploadAvatar = useCallback(
    async (file: File) => {
      if (uploadingAvatar) return;
      setProfileError(null);
      setUploadingAvatar(true);
      try {
        const fd = new FormData();
        fd.set("file", file);
        fd.set("from", "avatar");
        const { data: res } = await apiClient.post("/files/upload", fd);

        const data = res.data;
        if (!data || typeof data !== "object") {
          setProfileError("上传失败");
          return;
        }
        const url = data?.url;
        if (typeof url !== "string" || !url.trim()) {
          setProfileError("上传失败");
          return;
        }
        setDraftAvatarUrl(url.trim());
        draftTouchedRef.current = true;
      } finally {
        setUploadingAvatar(false);
      }
    },
    [uploadingAvatar],
  );

  const handleSaveProfile = useCallback(async () => {
    if (savingProfile || uploadingAvatar) return;
    setProfileError(null);

    const nextNickname = draftNickname.trim();
    if (!nextNickname) {
      setProfileError("请输入昵称");
      return;
    }

    const nextAvatarUrlRaw = draftAvatarUrl.trim();
    const nextBioRaw = draftBio.trim();

    setSavingProfile(true);
    try {
      const result = await updateProfile({
        nickname: nextNickname,
        avatarUrl: nextAvatarUrlRaw ? nextAvatarUrlRaw : null,
        bio: nextBioRaw ? nextBioRaw : null,
      });
      if (!result.ok) {
        setProfileError(result.message || "更新失败");
        return;
      }
      onOpenChange(false);
    } finally {
      setSavingProfile(false);
    }
  }, [
    draftAvatarUrl,
    draftBio,
    draftNickname,
    onOpenChange,
    savingProfile,
    updateProfile,
    uploadingAvatar,
  ]);

  return (
    <Modal
      open={open}
      title="个人资料"
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          draftTouchedRef.current = false;
          syncDraft();
        }
        setProfileError(null);
        onOpenChange(nextOpen);
      }}
      onConfirm={() => {
        formRef.current?.requestSubmit();
      }}
      confirmText={savingProfile ? "更新中…" : "更新信息"}
      confirmDisabled={savingProfile || uploadingAvatar}
      cancelText="取消"
      className="w-[640px]"
    >
      <form
        ref={formRef}
        onSubmit={(e) => {
          e.preventDefault();
          void handleSaveProfile();
        }}
      >
        <div className="flex w-full shrink-0 flex-col items-center">
          <Avatar className="h-16 w-16">
            <AvatarImage src={draftAvatarUrl.trim() || avatarUrl} />
            <AvatarFallback>
              {(draftNickname.trim() || nickname || "CN").slice(0, 1)}
            </AvatarFallback>
          </Avatar>

          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              void handleUploadAvatar(file);
            }}
            disabled={savingProfile || uploadingAvatar}
          />
          <div className="mt-2">
            <Button
              variant="ghost"
              disabled={savingProfile || uploadingAvatar}
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                avatarInputRef.current?.click();
              }}
            >
              <UploadIcon className="h-4 w-4 text-gray-600" />
              <span className="text-gray-600">
                {uploadingAvatar ? "上传中…" : "更新头像"}
              </span>
            </Button>
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">
              昵称 <span className="text-destructive">*</span>
            </div>
            <input
              className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
              value={draftNickname}
              onChange={(e) => {
                draftTouchedRef.current = true;
                setDraftNickname(e.target.value);
              }}
              placeholder="请输入昵称"
              required
              disabled={savingProfile || uploadingAvatar}
            />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">个人简介</div>
            <textarea
              className="min-h-24 w-full resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
              value={draftBio}
              onChange={(e) => {
                draftTouchedRef.current = true;
                setDraftBio(e.target.value);
              }}
              placeholder="一句话介绍你自己"
              disabled={savingProfile || uploadingAvatar}
            />
          </div>

          {profilePhone ? (
            <div className="space-y-2">
              <div className="text-sm font-medium">手机号</div>
              <input
                className="h-9 w-full rounded-md border bg-muted px-3 text-sm text-muted-foreground outline-none"
                value={profilePhone}
                disabled
              />
            </div>
          ) : null}

          {profileError ? (
            <div className="text-sm text-destructive">{profileError}</div>
          ) : null}
        </div>
      </form>
    </Modal>
  );
});
