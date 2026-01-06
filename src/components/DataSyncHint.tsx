import { Info, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DataSyncHintProps {
  className?: string;
  variant?: 'default' | 'success';
  message?: string;
}

export function DataSyncHint({ className, variant = 'default', message }: DataSyncHintProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg px-3 py-2 text-xs',
        variant === 'default' 
          ? 'bg-primary/5 text-primary border border-primary/20' 
          : 'bg-success/5 text-success border border-success/20',
        className
      )}
    >
      {variant === 'default' ? (
        <Info className="h-3.5 w-3.5 shrink-0" />
      ) : (
        <Zap className="h-3.5 w-3.5 shrink-0" />
      )}
      <span>
        {message || '※ 입력된 세션 데이터가 분석 및 리포트에 즉시 반영됩니다.'}
      </span>
    </div>
  );
}
