"use client";

import { memo, useState } from "react";
import { Modal } from "@/components/ui/dialog";
import type { MeProfile, MeVerification } from "@/stores";
import { SettingsModalSidebar } from "./settings-modal-sidebar";
import { SettingsModalMain } from "./settings-modal-main";
import type { SettingsSection, SettingsSectionId } from "./settings-modal.types";

type SettingsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: MeProfile | null | undefined;
  verification: MeVerification | null | undefined;
};

const sections: SettingsSection[] = [
  {
    id: "account",
    label: "账户管理",
  },
];

export const SettingsModal = memo(function SettingsModal({
  open,
  onOpenChange,
  profile,
  verification,
}: SettingsModalProps) {
  const [activeId, setActiveId] = useState<SettingsSectionId>("account");

  return (
    <Modal
      open={open}
      title="设置"
      onOpenChange={onOpenChange}
      footer={null}
      className="w-[calc(100vw-1rem)] max-w-[920px] max-h-[calc(100dvh-1rem)] gap-3 overflow-hidden p-3 sm:gap-6 sm:p-6 md:p-8"
    >
      <div className="flex min-h-0 flex-col gap-0 overflow-hidden rounded-lg bg-background md:min-h-[520px] md:flex-row">
        <div className="hidden md:block">
          <SettingsModalSidebar
            sections={sections}
            activeId={activeId}
            onSelect={setActiveId}
          />
        </div>
        <SettingsModalMain
          profile={profile}
          verification={verification}
        />
      </div>
    </Modal>
  );
});
