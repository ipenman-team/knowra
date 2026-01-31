import { cn } from '@/lib/utils';

type LoginTabsProps = {
  value: 'code' | 'password';
  onChange: (value: 'code' | 'password') => void;
};

export function LoginTabs({ value, onChange }: LoginTabsProps) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-1 text-sm">
      <button
        type="button"
        onClick={() => onChange('code')}
        className={cn(
          'rounded-md px-3 py-2 font-medium transition',
          value === 'code'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        邮箱验证码
      </button>
      <button
        type="button"
        onClick={() => onChange('password')}
        className={cn(
          'rounded-md px-3 py-2 font-medium transition',
          value === 'password'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        账号密码
      </button>
    </div>
  );
}
