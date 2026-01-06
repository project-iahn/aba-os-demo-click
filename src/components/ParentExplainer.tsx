import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ParentExplainerProps {
  title: string;
  description: string;
  className?: string;
}

export function ParentExplainer({ title, description, className }: ParentExplainerProps) {
  return (
    <div
      className={cn(
        'rounded-lg bg-accent/5 border border-accent/20 p-4',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10">
          <HelpCircle className="h-4 w-4 text-accent" />
        </div>
        <div>
          <h4 className="font-medium text-foreground">{title}</h4>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
