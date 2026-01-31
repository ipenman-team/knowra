import { CardTitle } from '@/components/ui/card';

type LoginHeaderProps = {
  subtitle: string;
};

export function LoginHeader({ subtitle }: LoginHeaderProps) {
  return (
    <>
      <div className="mb-2 flex items-center gap-3">
        <div className="h-8 w-8 rounded bg-primary" aria-hidden="true" />
        <span className="text-lg font-semibold">Contexta</span>
      </div>
      <CardTitle className="text-2xl">欢迎使用 Contexta</CardTitle>
      <div className="text-sm text-muted-foreground">{subtitle}</div>
    </>
  );
}
