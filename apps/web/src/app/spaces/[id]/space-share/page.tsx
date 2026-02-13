'use client';

import { useParams } from 'next/navigation';
import { ShareBasicSettingsCard } from './components/share-basic-settings-card';
import { SiteBuilderSettingsCard } from './components/site-builder-settings-card';
import { SiteBuilderConfigModal } from './components/site-builder-config-modal';
import { SiteBuilderPagePickerDialog } from './components/site-builder-page-picker-dialog';
import { SiteBuilderPageListConfigDialog } from './components/site-builder-page-list-config-dialog';
import { useSpaceSharePageState } from './hooks/use-space-share-page-state';

export default function SpaceSharePage() {
  const params = useParams();
  const spaceId = params.id as string;

  const {
    loading,
    submitting,
    share,
    accessMode,
    setAccessMode,
    expirePreset,
    setExpirePreset,
    passwordInput,
    setPasswordInput,
    shareUrl,
    handleToggleShare,
    handleCopyLink,
    handleOpenLink,
    siteBuilderLoading,
    siteBuilderModalOpen,
    setSiteBuilderModalOpen,
    siteBuilderSaving,
    siteBuilderPublishing,
    siteBuilderAutosaving,
    siteBuilderAutosaveError,
    siteBuilderConfig,
    handleTemplateChange,
    siteBuilderShareUrl,
    siteBuilderPublishedAt,
    handleSaveSiteBuilderDraft,
    handlePublishSiteBuilder,
    handleUnpublishSiteBuilder,
    handleCopySiteBuilderLink,
    handleOpenSiteBuilderLink,
    logoInputRef,
    handleLogoFileChange,
    handleOpenLogoPicker,
    activeSiteBuilderMenuId,
    setActiveSiteBuilderMenuId,
    activeSiteBuilderMenu,
    activeSiteBuilderPage,
    activeSiteBuilderPageListPages,
    activeSiteBuilderPageCoverMap,
    menuSettingsOpen,
    setMenuSettingsOpen,
    handleAddCustomMenu,
    canDeleteActiveMenu,
    handleDeleteActiveMenu,
    handleUpdateActiveMenuLabel,
    handleUpdateActiveMenuType,
    handleReplaceActiveMenuPage,
    handleClearActiveMenuPage,
    setPageListConfigOpen,
    handleReorderActivePageList,
    handleUpdateActivePageCover,
    handleUploadPageCoverFile,
    pagePickerOpen,
    handlePagePickerOpenChange,
    sortedSiteBuilderPages,
    handleSelectPageForMenu,
    pageListConfigOpen,
    handleApplyPageListConfig,
    siteBuilderActionBusy,
  } = useSpaceSharePageState(spaceId);

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex h-14 shrink-0 items-center border-b px-6">
        <h1 className="text-lg font-semibold">空间共享</h1>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          <ShareBasicSettingsCard
            loading={loading}
            submitting={submitting}
            share={share}
            accessMode={accessMode}
            expirePreset={expirePreset}
            passwordInput={passwordInput}
            shareUrl={shareUrl}
            onToggleShare={(checked) => {
              void handleToggleShare(checked);
            }}
            onAccessModeChange={setAccessMode}
            onExpirePresetChange={setExpirePreset}
            onPasswordInputChange={setPasswordInput}
            onCopyLink={() => {
              void handleCopyLink();
            }}
            onOpenLink={handleOpenLink}
          />

          {share ? (
            <SiteBuilderSettingsCard
              loading={siteBuilderLoading}
              actionBusy={siteBuilderActionBusy}
              saving={siteBuilderSaving}
              publishing={siteBuilderPublishing}
              autosaving={siteBuilderAutosaving}
              autosaveError={siteBuilderAutosaveError}
              template={siteBuilderConfig.template}
              siteBuilderShareUrl={siteBuilderShareUrl}
              publishedAt={siteBuilderPublishedAt}
              onTemplateChange={handleTemplateChange}
              onOpenConfig={() => setSiteBuilderModalOpen(true)}
              onSaveDraft={() => {
                void handleSaveSiteBuilderDraft();
              }}
              onPublish={() => {
                void handlePublishSiteBuilder();
              }}
              onUnpublish={() => {
                void handleUnpublishSiteBuilder();
              }}
              onCopySiteBuilderLink={() => {
                void handleCopySiteBuilderLink();
              }}
              onOpenSiteBuilderLink={handleOpenSiteBuilderLink}
            />
          ) : null}
        </div>

        <SiteBuilderConfigModal
          open={siteBuilderModalOpen}
          onOpenChange={setSiteBuilderModalOpen}
          loading={siteBuilderLoading}
          logoInputRef={logoInputRef}
          onLogoFileChange={handleLogoFileChange}
          onOpenLogoPicker={handleOpenLogoPicker}
          config={siteBuilderConfig}
          activeMenuId={activeSiteBuilderMenuId}
          activeMenu={activeSiteBuilderMenu}
          activePage={activeSiteBuilderPage}
          activePageListPages={activeSiteBuilderPageListPages}
          activePageCoverMap={activeSiteBuilderPageCoverMap}
          actionBusy={siteBuilderActionBusy}
          menuSettingsOpen={menuSettingsOpen}
          onMenuSettingsOpenChange={setMenuSettingsOpen}
          onSelectMenu={(menuId) => setActiveSiteBuilderMenuId(menuId)}
          onAddMenu={handleAddCustomMenu}
          canDeleteMenu={canDeleteActiveMenu}
          onDeleteMenu={handleDeleteActiveMenu}
          onMenuLabelChange={handleUpdateActiveMenuLabel}
          onMenuTypeChange={handleUpdateActiveMenuType}
          onReplacePage={handleReplaceActiveMenuPage}
          onClearPage={handleClearActiveMenuPage}
          onOpenPageListConfig={() => setPageListConfigOpen(true)}
          onReorderPageList={handleReorderActivePageList}
          onUpdatePageCover={handleUpdateActivePageCover}
          onUploadPageCoverFile={handleUploadPageCoverFile}
        />

        <SiteBuilderPagePickerDialog
          open={pagePickerOpen}
          onOpenChange={handlePagePickerOpenChange}
          pages={sortedSiteBuilderPages}
          onSelectPage={(pageId) => {
            void handleSelectPageForMenu(pageId);
          }}
        />

        <SiteBuilderPageListConfigDialog
          open={pageListConfigOpen}
          onOpenChange={setPageListConfigOpen}
          pages={sortedSiteBuilderPages}
          initialConfig={{
            style: activeSiteBuilderMenu?.style ?? 'card',
            pageIds: activeSiteBuilderMenu?.pageIds ?? [],
            pageCovers: activeSiteBuilderMenu?.pageCovers ?? {},
          }}
          onSubmit={(nextConfig) => {
            void handleApplyPageListConfig(nextConfig);
          }}
        />
      </div>
    </div>
  );
}
