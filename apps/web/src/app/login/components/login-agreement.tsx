type LoginAgreementProps = {
  agreed: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  error?: string | null;
};

export function LoginAgreement({
  agreed,
  onChange,
  disabled,
  error,
}: LoginAgreementProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 h-4 w-4"
          disabled={disabled}
        />
        <div className="text-sm text-muted-foreground">
          我已阅读并同意 Knowra{' '}
          <a className="text-foreground underline" href="#">
            服务协议
          </a>{' '}
          和{' '}
          <a className="text-foreground underline" href="#">
            隐私权政策
          </a>
        </div>
      </div>
      {error ? <div className="text-xs text-destructive">{error}</div> : null}
    </div>
  );
}
