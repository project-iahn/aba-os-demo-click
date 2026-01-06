import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, FileSpreadsheet, FileImage, FileText, 
  ArrowRight, ArrowLeft, Check, AlertTriangle, 
  Loader2, Download, Sparkles, X
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { sampleImportData } from '@/data/mockData';
import type { Child, Goal, Session, SessionTrial } from '@/data/mockData';

type SourceType = 'excel' | 'photo' | 'document' | null;
type Step = 1 | 2 | 3;
type DuplicateOption = 'overwrite' | 'add' | 'skip';

interface ImportRow {
  child_name: string;
  birth_year: string;
  concern: string;
  goal_title: string;
  session_date: string;
  trials: number;
  success: number;
  prompt_level: number;
  problem_count: number;
  session_note: string;
  isValid: boolean;
  warnings: string[];
}

interface FieldMapping {
  child_name: string;
  goal_title: string;
  session_date: string;
  trials: string;
  success: string;
  prompt_level: string;
  problem_count: string;
  session_note: string;
}

const SYSTEM_FIELDS = [
  { key: 'child_name', label: '아동 이름', required: true },
  { key: 'goal_title', label: '목표 제목', required: true },
  { key: 'session_date', label: '세션 날짜', required: true },
  { key: 'trials', label: '시행 횟수', required: true },
  { key: 'success', label: '성공 횟수', required: true },
  { key: 'prompt_level', label: '촉진 수준 (0-3)', required: true },
  { key: 'problem_count', label: '문제행동 횟수', required: false },
  { key: 'session_note', label: '세션 메모', required: false },
];

const SOURCE_COLUMNS = [
  'child_name', 'birth_year', 'concern', 'goal_title', 
  'session_date', 'trials', 'success', 'prompt_level', 
  'problem_count', 'session_note'
];

export default function MigrationPage() {
  const { role, bulkImport, therapists } = useApp();
  const navigate = useNavigate();
  
  const [step, setStep] = useState<Step>(1);
  const [sourceType, setSourceType] = useState<SourceType>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [fieldMapping, setFieldMapping] = useState<FieldMapping>({
    child_name: 'child_name',
    goal_title: 'goal_title',
    session_date: 'session_date',
    trials: 'trials',
    success: 'success',
    prompt_level: 'prompt_level',
    problem_count: 'problem_count',
    session_note: 'session_note',
  });
  const [duplicateOption, setDuplicateOption] = useState<DuplicateOption>('add');
  const [importResult, setImportResult] = useState<{
    children: number;
    goals: number;
    sessions: number;
    warnings: number;
    skipped: number;
  } | null>(null);

  // Only admin can access
  if (role !== 'admin') {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Card className="max-w-md text-center p-6">
          <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">접근 권한 없음</h2>
          <p className="text-muted-foreground">
            데이터 마이그레이션은 센터 관리자만 이용할 수 있습니다.
          </p>
        </Card>
      </div>
    );
  }

  const validateRow = (row: typeof sampleImportData[0]): ImportRow => {
    const warnings: string[] = [];
    let isValid = true;

    if (!row.child_name) {
      warnings.push('아동 이름 누락');
      isValid = false;
    }
    if (!row.session_date) {
      warnings.push('날짜 누락');
      isValid = false;
    }
    if (row.success > row.trials) {
      warnings.push('성공 > 시행 횟수');
      isValid = false;
    }
    if (row.prompt_level < 0 || row.prompt_level > 3) {
      warnings.push('촉진 수준 범위 오류 (0-3)');
      isValid = false;
    }

    return {
      ...row,
      isValid,
      warnings,
    };
  };

  const handleSourceSelect = (source: SourceType) => {
    setSourceType(source);
  };

  const handleStartExtraction = () => {
    if (sourceType === 'photo' || sourceType === 'document') {
      // Simulate AI extraction with a loader
      setIsExtracting(true);
      setTimeout(() => {
        const validatedRows = sampleImportData.map(validateRow);
        setImportRows(validatedRows);
        setIsExtracting(false);
        setStep(2);
      }, 2500);
    } else {
      // Direct load for Excel/CSV
      const validatedRows = sampleImportData.map(validateRow);
      setImportRows(validatedRows);
      setStep(2);
    }
  };

  const handleImport = () => {
    // Group by child
    const childMap = new Map<string, { child: Partial<Child>; goals: Map<string, Goal>; sessions: Session[] }>();
    
    importRows.filter(row => row.isValid).forEach((row) => {
      if (!childMap.has(row.child_name)) {
        childMap.set(row.child_name, {
          child: {
            name: row.child_name,
            age: new Date().getFullYear() - parseInt(row.birth_year || '2020'),
            birthDate: `${row.birth_year || '2020'}-01-01`,
            concern: row.concern || '',
            diagnosis: '',
            guardianName: '',
            guardianPhone: '',
            guardianRelation: '',
            status: 'active',
            startDate: row.session_date,
            therapistId: therapists[0]?.id || 'th1',
            lastSessionDate: row.session_date,
            trend: 'stable',
            notes: '',
          },
          goals: new Map(),
          sessions: [],
        });
      }

      const childData = childMap.get(row.child_name)!;
      
      // Add goal if not exists
      if (!childData.goals.has(row.goal_title)) {
        const goalId = `g_import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        childData.goals.set(row.goal_title, {
          id: goalId,
          childId: '', // Will be set later
          title: row.goal_title,
          description: '',
          category: '일반',
          targetCriteria: '',
          createdAt: row.session_date,
          status: 'active',
        });
      }

      // Update last session date
      if (row.session_date > (childData.child.lastSessionDate || '')) {
        childData.child.lastSessionDate = row.session_date;
      }
    });

    // Convert to final format
    const newChildren: Child[] = [];
    const newGoals: Goal[] = [];
    const newSessions: Session[] = [];
    const sessionMap = new Map<string, Session>();

    childMap.forEach((data, childName) => {
      const childId = `c_import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      newChildren.push({
        ...(data.child as Child),
        id: childId,
      });

      data.goals.forEach((goal, goalTitle) => {
        const updatedGoal = { ...goal, childId };
        newGoals.push(updatedGoal);
        data.goals.set(goalTitle, updatedGoal);
      });
    });

    // Create sessions
    importRows.filter(row => row.isValid).forEach((row) => {
      const childData = childMap.get(row.child_name)!;
      const child = newChildren.find(c => c.name === row.child_name)!;
      const goal = [...childData.goals.values()].find(g => g.title === row.goal_title)!;
      
      const sessionKey = `${child.id}_${row.session_date}`;
      
      if (!sessionMap.has(sessionKey)) {
        const session: Session = {
          id: `s_import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          childId: child.id,
          therapistId: therapists[0]?.id || 'th1',
          date: row.session_date,
          duration: 50,
          notes: row.session_note || '',
          trials: [],
          createdAt: new Date().toISOString(),
        };
        sessionMap.set(sessionKey, session);
      }

      const session = sessionMap.get(sessionKey)!;
      session.trials.push({
        goalId: goal.id,
        trials: row.trials,
        successes: row.success,
        promptLevel: row.prompt_level,
        problemBehaviorCount: row.problem_count,
      });

      if (row.session_note && !session.notes.includes(row.session_note)) {
        session.notes = session.notes ? `${session.notes}; ${row.session_note}` : row.session_note;
      }
    });

    sessionMap.forEach(session => newSessions.push(session));

    // Perform import
    bulkImport({
      children: newChildren,
      goals: newGoals,
      sessions: newSessions,
    });

    setImportResult({
      children: newChildren.length,
      goals: newGoals.length,
      sessions: newSessions.length,
      warnings: importRows.filter(r => r.warnings.length > 0 && r.isValid).length,
      skipped: importRows.filter(r => !r.isValid).length,
    });

    setStep(3);
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-xl font-semibold mb-2">데이터 소스 선택</h2>
        <p className="text-muted-foreground">
          기존 데이터를 어떤 형태로 가져올지 선택하세요
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${sourceType === 'excel' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => handleSourceSelect('excel')}
        >
          <CardContent className="pt-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <FileSpreadsheet className="h-8 w-8 text-success" />
            </div>
            <h3 className="font-semibold mb-1">Excel / CSV 업로드</h3>
            <p className="text-sm text-muted-foreground">
              스프레드시트 파일에서 직접 데이터를 가져옵니다
            </p>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${sourceType === 'photo' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => handleSourceSelect('photo')}
        >
          <CardContent className="pt-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
              <FileImage className="h-8 w-8 text-accent" />
            </div>
            <div className="flex items-center justify-center gap-2 mb-1">
              <h3 className="font-semibold">수기 기록 사진</h3>
              <Badge variant="secondary" className="text-xs">AI 추출</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              손으로 작성한 기록 사진에서 AI가 데이터를 추출합니다
            </p>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${sourceType === 'document' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => handleSourceSelect('document')}
        >
          <CardContent className="pt-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-chart-4/10">
              <FileText className="h-8 w-8 text-chart-4" />
            </div>
            <div className="flex items-center justify-center gap-2 mb-1">
              <h3 className="font-semibold">기존 리포트/문서</h3>
              <Badge variant="secondary" className="text-xs">AI 추출</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              PDF, Word 문서에서 AI가 데이터를 추출합니다
            </p>
          </CardContent>
        </Card>
      </div>

      {sourceType === 'excel' && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">템플릿 다운로드</CardTitle>
            <CardDescription>
              올바른 형식으로 데이터를 준비하려면 템플릿을 사용하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              CSV 템플릿 다운로드
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              컬럼: child_name, birth_year, concern, goal_title, session_date, trials, success, prompt_level, problem_count, session_note
            </p>
          </CardContent>
        </Card>
      )}

      {sourceType && (
        <div className="flex justify-end">
          <Button onClick={handleStartExtraction} className="gap-2">
            {sourceType === 'photo' || sourceType === 'document' ? (
              <>
                <Sparkles className="h-4 w-4" />
                AI로 데이터 추출
              </>
            ) : (
              <>
                샘플 데이터 불러오기
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}

      {isExtracting && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div>
                <p className="font-medium">텍스트 추출 중...</p>
                <p className="text-sm text-muted-foreground">
                  AI가 문서에서 세션 데이터를 분석하고 있습니다
                </p>
              </div>
            </div>
            <Progress value={66} className="mt-4" />
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold mb-1">필드 매핑 & 미리보기</h2>
          <p className="text-muted-foreground">
            추출된 데이터를 확인하고 필드를 매핑하세요
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {importRows.length}개 행 추출됨
        </Badge>
      </div>

      {/* Field Mapping */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">필드 매핑</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {SYSTEM_FIELDS.map((field) => (
              <div key={field.key} className="space-y-1">
                <Label className="text-sm">
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </Label>
                <Select
                  value={fieldMapping[field.key as keyof FieldMapping]}
                  onValueChange={(value) => 
                    setFieldMapping(prev => ({ ...prev, [field.key]: value }))
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCE_COLUMNS.map((col) => (
                      <SelectItem key={col} value={col}>{col}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            데이터 미리보기
            {importRows.some(r => !r.isValid) && (
              <Badge variant="destructive">
                {importRows.filter(r => !r.isValid).length}개 오류
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[400px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="table-header">
                  <TableHead className="w-10"></TableHead>
                  <TableHead>아동</TableHead>
                  <TableHead>목표</TableHead>
                  <TableHead>날짜</TableHead>
                  <TableHead>시행</TableHead>
                  <TableHead>성공</TableHead>
                  <TableHead>촉진</TableHead>
                  <TableHead>문제행동</TableHead>
                  <TableHead>상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {importRows.map((row, idx) => (
                  <TableRow key={idx} className={!row.isValid ? 'bg-destructive/5' : ''}>
                    <TableCell className="text-center text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="font-medium">{row.child_name}</TableCell>
                    <TableCell>{row.goal_title}</TableCell>
                    <TableCell>{row.session_date}</TableCell>
                    <TableCell>{row.trials}</TableCell>
                    <TableCell>{row.success}</TableCell>
                    <TableCell>{row.prompt_level}</TableCell>
                    <TableCell>{row.problem_count}</TableCell>
                    <TableCell>
                      {row.isValid ? (
                        <Badge variant="secondary" className="gap-1">
                          <Check className="h-3 w-3" />
                          유효
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1">
                          <X className="h-3 w-3" />
                          {row.warnings[0]}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Duplicate Handling */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">중복 처리 옵션</CardTitle>
          <CardDescription>
            동일 날짜/동일 목표의 데이터가 이미 있을 경우 어떻게 처리할까요?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={duplicateOption} onValueChange={(v) => setDuplicateOption(v as DuplicateOption)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="overwrite" id="overwrite" />
              <Label htmlFor="overwrite">덮어쓰기</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="add" id="add" />
              <Label htmlFor="add">새로 추가</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="skip" id="skip" />
              <Label htmlFor="skip">무시</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          이전
        </Button>
        <Button 
          onClick={handleImport} 
          disabled={importRows.filter(r => r.isValid).length === 0}
          className="gap-2"
        >
          데이터 가져오기
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
          <Check className="h-8 w-8 text-success" />
        </div>
        <h2 className="text-xl font-semibold mb-2">데이터 가져오기 완료!</h2>
        <p className="text-muted-foreground">
          모든 데이터가 성공적으로 시스템에 추가되었습니다
        </p>
      </div>

      {importResult && (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-base">가져오기 결과</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 rounded-lg bg-primary/5">
                <p className="text-2xl font-bold text-primary">{importResult.children}</p>
                <p className="text-sm text-muted-foreground">새 케이스</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-accent/5">
                <p className="text-2xl font-bold text-accent">{importResult.goals}</p>
                <p className="text-sm text-muted-foreground">새 목표</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-success/5">
                <p className="text-2xl font-bold text-success">{importResult.sessions}</p>
                <p className="text-sm text-muted-foreground">새 세션</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted">
                <p className="text-2xl font-bold">{importResult.skipped}</p>
                <p className="text-sm text-muted-foreground">스킵됨</p>
              </div>
            </div>
            {importResult.warnings > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-warning/10 text-warning text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {importResult.warnings}개 행에 경고가 있었지만 가져오기되었습니다
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={() => {
          setStep(1);
          setSourceType(null);
          setImportRows([]);
          setImportResult(null);
        }}>
          추가 데이터 가져오기
        </Button>
        <Button onClick={() => navigate('/cases')} className="gap-2">
          케이스 목록 보기
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">데이터 마이그레이션</h1>
        <p className="text-muted-foreground">
          기존 Excel, 수기 기록, 문서에서 데이터를 가져와 시스템에 등록하세요
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
              step >= s 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground'
            }`}>
              {step > s ? <Check className="h-4 w-4" /> : s}
            </div>
            <span className={`text-sm ${step >= s ? 'font-medium' : 'text-muted-foreground'}`}>
              {s === 1 ? '소스 선택' : s === 2 ? '매핑 & 미리보기' : '완료'}
            </span>
            {s < 3 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card className="p-6">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </Card>
    </div>
  );
}