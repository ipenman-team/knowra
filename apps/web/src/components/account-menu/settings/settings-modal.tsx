"use client";

import { memo, useState } from "react";
import { Modal } from "@/components/ui/modal";
import type { MeProfile } from "@/stores";
import { SettingsModalSidebar } from "./settings-modal-sidebar";
import { SettingsModalMain } from "./settings-modal-main";
import type { SettingsSection, SettingsSectionId } from "./settings-modal.types";

type SettingsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: MeProfile | null | undefined;
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
}: SettingsModalProps) {
  const [activeId, setActiveId] = useState<SettingsSectionId>("account");

  return (
    <Modal
      open={open}
      title="设置"
      onOpenChange={onOpenChange}
      footer={null}
      className="w-[920px]"
    >
      <div className="flex min-h-[520px] gap-0 overflow-hidden rounded-lg bg-background">
        <SettingsModalSidebar
          sections={sections}
          activeId={activeId}
          onSelect={setActiveId}
        />
        <SettingsModalMain
          profile={profile}
        />
      </div>
    </Modal>
  );
});
