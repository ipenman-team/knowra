import { Button } from '@/components/ui/button';
import type { Step } from './types';

type FooterActionsProps = {
  step: Step;
  creating: boolean;
  canGoNext: boolean;
  isCollaborativeSpace: boolean;
  hasPendingInvites: boolean;
  onCancel: () => void;
  onNext: () => void;
  onBack: () => void;
  onCreateOnly: () => void;
  onCreateWithInvites: () => void;
};

export function FooterActions(props: FooterActionsProps) {
  const {
    step,
    creating,
    canGoNext,
    isCollaborativeSpace,
    hasPendingInvites,
    onCancel,
    onNext,
    onBack,
    onCreateOnly,
    onCreateWithInvites,
  } = props;

  return (
    <div className="flex justify-end gap-3">
      {step === 1 ? (
        <>
          <Button type="button" variant="outline" disabled={creating} onClick={onCancel}>
            取消
          </Button>
          <Button type="button" disabled={!canGoNext} onClick={onNext}>
            下一步
          </Button>
        </>
      ) : (
        <>
          <Button type="button" variant="outline" disabled={creating} onClick={onBack}>
            上一步
          </Button>
          {isCollaborativeSpace ? (
            <>
              <Button type="button" variant="outline" disabled={creating} onClick={onCreateOnly}>
                跳过，创建空间
              </Button>
              <Button
                type="button"
                disabled={creating || !hasPendingInvites}
                onClick={onCreateWithInvites}
              >
                创建并发送邀请
              </Button>
            </>
          ) : (
            <Button type="button" disabled={creating} onClick={onCreateOnly}>
              创建空间
            </Button>
          )}
        </>
      )}
    </div>
  );
}
