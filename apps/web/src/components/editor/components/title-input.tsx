import { memo, useCallback } from 'react';
import { cn } from '@/lib/utils';

export const EditorTitleInput = memo(function EditorTitleInput({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value),
    [onChange]
  );

  return (
    <input
      className={cn(
        'w-full bg-transparent text-5xl font-bold tracking-tight',
        'placeholder:text-muted-foreground/40',
        'focus-visible:outline-none'
      )}
      placeholder="请输入标题"
      value={value}
      disabled={disabled}
      onChange={handleChange}
    />
  );
});
