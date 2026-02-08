import { EmptyIcon } from '../icon/empty';
import { Empty as EmptyRaw, EmptyContent } from '../ui/empty';

export const Empty = (props: { className?: string; text?: string }) => {
  return (
    <EmptyRaw className="border-0 p-4">
      <EmptyContent>
        <EmptyIcon className="h-10 w-10" />
        <div className="text-muted-foreground">{props.text || '暂无数据'}</div>
      </EmptyContent>
    </EmptyRaw>
  );
};
