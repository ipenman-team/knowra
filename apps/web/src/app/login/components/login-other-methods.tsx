export function LoginOtherMethods() {
  return (
    <div className="mt-6 text-center text-xs text-muted-foreground">
      其他登录方式（敬请期待）
      <div className="mt-3 flex justify-center gap-3">
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full border bg-muted/30 text-xs"
          aria-label="微信扫码登录（敬请期待）"
          title="微信扫码登录（敬请期待）"
          disabled
        >
          微
        </button>
        {Array.from({ length: 3 }).map((_, i) => (
          <button
            key={i}
            type="button"
            className="h-9 w-9 rounded-full border bg-muted/30"
            aria-label="其他登录方式（敬请期待）"
            disabled
          />
        ))}
      </div>
    </div>
  );
}
