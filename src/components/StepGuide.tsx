import { Check, Users, Target, Calendar, FileText, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepGuideProps {
  className?: string;
}

const steps = [
  { step: 1, label: '케이스 생성', icon: Users, description: '아동 정보 등록' },
  { step: 2, label: '목표 설정', icon: Target, description: '치료 목표 정의' },
  { step: 3, label: '세션 기록', icon: Calendar, description: '치료 데이터 입력' },
  { step: 4, label: '리포트 생성', icon: FileText, description: '진행 보고서 작성' },
  { step: 5, label: '보호자 공유', icon: Share2, description: '리포트 전달' },
];

export function StepGuide({ className }: StepGuideProps) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-4', className)}>
      <p className="mb-3 text-sm font-medium text-muted-foreground">
        ABA OS 워크플로우
      </p>
      <div className="flex items-center justify-between gap-2">
        {steps.map((step, index) => (
          <div key={step.step} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <step.icon className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium">{step.label}</span>
              <span className="text-[10px] text-muted-foreground hidden lg:block">{step.description}</span>
            </div>
            {index < steps.length - 1 && (
              <div className="h-[1px] w-8 bg-border hidden sm:block" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
