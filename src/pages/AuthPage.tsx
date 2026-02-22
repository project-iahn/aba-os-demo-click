import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Building2, UserRound, ShieldCheck, ArrowLeft, ArrowRight } from 'lucide-react';

type SelectedRole = 'admin' | 'therapist' | 'parent';
type Step = 'mode' | 'role' | 'center-form' | 'therapist-form' | 'parent-form' | 'credentials';

interface CenterData {
  name: string;
  address: string;
  representativeName: string;
  phone: string;
  email: string;
  businessNumber: string;
  description: string;
}

interface TherapistData {
  displayName: string;
  phone: string;
  specialization: string;
  centerId: string;
}

interface Center {
  id: string;
  name: string;
  address: string;
}

export default function AuthPage() {
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('mode');
  const [selectedRole, setSelectedRole] = useState<SelectedRole>('therapist');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [centers, setCenters] = useState<Center[]>([]);
  const { toast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    if (session && !authLoading) {
      navigate('/dashboard', { replace: true });
    }
  }, [session, authLoading, navigate]);

  const [centerData, setCenterData] = useState<CenterData>({
    name: '', address: '', representativeName: '', phone: '', email: '', businessNumber: '', description: '',
  });

  const [therapistData, setTherapistData] = useState<TherapistData>({
    displayName: '', phone: '', specialization: '', centerId: '',
  });

  // Fetch centers for therapist signup
  useEffect(() => {
    if (step === 'therapist-form') {
      fetchCenters();
    }
  }, [step]);

  const fetchCenters = async () => {
    const { data } = await supabase.from('centers').select('id, name, address');
    if (data) setCenters(data);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error: any) {
      toast({ title: '로그인 오류', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const displayName = selectedRole === 'admin' ? centerData.representativeName : therapistData.displayName;
      
      const { data: authData, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName, role: selectedRole },
          emailRedirectTo: window.location.origin,
        },
      });
      if (signupError) throw signupError;

      if (authData.user) {
        // Update the default role to selected role
        await supabase.from('user_roles')
          .update({ role: selectedRole })
          .eq('user_id', authData.user.id);

        if (selectedRole === 'admin') {
          // Create center
          await supabase.from('centers').insert({
            name: centerData.name,
            address: centerData.address,
            representative_name: centerData.representativeName,
            phone: centerData.phone,
            email: centerData.email,
            business_number: centerData.businessNumber || null,
            description: centerData.description || null,
            owner_id: authData.user.id,
          } as any);

          // Get the created center
          const { data: createdCenter } = await supabase
            .from('centers')
            .select('id')
            .eq('owner_id', authData.user.id)
            .single();

          if (createdCenter) {
            await supabase.from('profiles')
              .update({
                display_name: centerData.representativeName,
                phone: centerData.phone,
                center_id: createdCenter.id,
                is_approved: true,
              } as any)
              .eq('user_id', authData.user.id);
          }
        } else if (selectedRole === 'therapist') {
          await supabase.from('profiles')
            .update({
              display_name: therapistData.displayName,
              phone: therapistData.phone,
              specialization: therapistData.specialization,
              center_id: therapistData.centerId || null,
              is_approved: false,
            } as any)
            .eq('user_id', authData.user.id);
        }
      }

      toast({
        title: '회원가입 완료',
        description: selectedRole === 'therapist'
          ? '이메일 인증 후 센터장 승인이 필요합니다.'
          : '이메일 인증 링크를 확인해주세요.',
      });
      setStep('mode');
    } catch (error: any) {
      toast({ title: '회원가입 오류', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const roleCards = [
    { role: 'admin' as const, icon: ShieldCheck, title: '센터장', desc: '센터를 등록하고 관리합니다' },
    { role: 'therapist' as const, icon: UserRound, title: '치료사', desc: '등록된 센터에 소속됩니다' },
    { role: 'parent' as const, icon: Building2, title: '보호자', desc: '아동의 진행 상황을 확인합니다', disabled: true },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-foreground">
            Dear One
          </CardTitle>
          <CardDescription>
            {step === 'mode' && '계정에 로그인하거나 새 계정을 만드세요'}
            {step === 'role' && '가입 유형을 선택해주세요'}
            {step === 'center-form' && '센터 정보를 입력해주세요'}
            {step === 'therapist-form' && '치료사 정보를 입력해주세요'}
            {step === 'credentials' && '로그인 정보를 입력해주세요'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Login / Signup mode selection */}
          {step === 'mode' && (
            <div>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">이메일</Label>
                  <Input id="login-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">비밀번호</Label>
                  <Input id="login-password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="6자 이상" required minLength={6} />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? '처리 중...' : '로그인'}
                </Button>
              </form>
              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">또는</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <Button variant="outline" className="w-full" onClick={() => setStep('role')}>
                새 계정 만들기
              </Button>
            </div>
          )}

          {/* Role selection */}
          {step === 'role' && (
            <div className="space-y-4">
              <div className="grid gap-3">
                {roleCards.map(({ role, icon: Icon, title, desc, disabled }) => (
                  <button
                    key={role}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      setSelectedRole(role);
                      setStep(role === 'admin' ? 'center-form' : role === 'therapist' ? 'therapist-form' : 'credentials');
                    }}
                    className={`flex items-center gap-4 rounded-lg border p-4 text-left transition-colors hover:bg-accent/10 disabled:opacity-50 disabled:cursor-not-allowed ${
                      disabled ? '' : 'cursor-pointer'
                    }`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{title}</p>
                      <p className="text-sm text-muted-foreground">{desc}</p>
                      {disabled && <p className="text-xs text-muted-foreground mt-1">(추후 지원 예정)</p>}
                    </div>
                  </button>
                ))}
              </div>
              <Button variant="ghost" className="w-full" onClick={() => setStep('mode')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> 돌아가기
              </Button>
            </div>
          )}

          {/* Center registration form (admin) */}
          {step === 'center-form' && (
            <div className="space-y-4">
              <div className="grid gap-3">
                <div className="space-y-2">
                  <Label>센터명 <span className="text-destructive">*</span></Label>
                  <Input value={centerData.name} onChange={e => setCenterData(d => ({ ...d, name: e.target.value }))} placeholder="예: 아이랑 ABA 행동발달연구소" required />
                </div>
                <div className="space-y-2">
                  <Label>주소 <span className="text-destructive">*</span></Label>
                  <Input value={centerData.address} onChange={e => setCenterData(d => ({ ...d, address: e.target.value }))} placeholder="센터 주소" required />
                </div>
                <div className="space-y-2">
                  <Label>대표자 성명 <span className="text-destructive">*</span></Label>
                  <Input value={centerData.representativeName} onChange={e => setCenterData(d => ({ ...d, representativeName: e.target.value }))} placeholder="대표자 이름" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>연락처 <span className="text-destructive">*</span></Label>
                    <Input value={centerData.phone} onChange={e => setCenterData(d => ({ ...d, phone: e.target.value }))} placeholder="02-1234-5678" required />
                  </div>
                  <div className="space-y-2">
                    <Label>이메일 <span className="text-destructive">*</span></Label>
                    <Input type="email" value={centerData.email} onChange={e => setCenterData(d => ({ ...d, email: e.target.value }))} placeholder="center@email.com" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>사업자등록번호</Label>
                  <Input value={centerData.businessNumber} onChange={e => setCenterData(d => ({ ...d, businessNumber: e.target.value }))} placeholder="000-00-00000" />
                </div>
                <div className="space-y-2">
                  <Label>센터 소개</Label>
                  <Textarea value={centerData.description} onChange={e => setCenterData(d => ({ ...d, description: e.target.value }))} placeholder="센터 소개를 입력하세요" rows={3} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" className="flex-1" onClick={() => setStep('role')}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> 이전
                </Button>
                <Button
                  className="flex-1"
                  disabled={!centerData.name || !centerData.address || !centerData.representativeName || !centerData.phone || !centerData.email}
                  onClick={() => setStep('credentials')}
                >
                  다음 <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Therapist form */}
          {step === 'therapist-form' && (
            <div className="space-y-4">
              <div className="grid gap-3">
                <div className="space-y-2">
                  <Label>이름 <span className="text-destructive">*</span></Label>
                  <Input value={therapistData.displayName} onChange={e => setTherapistData(d => ({ ...d, displayName: e.target.value }))} placeholder="홍길동" required />
                </div>
                <div className="space-y-2">
                  <Label>연락처 <span className="text-destructive">*</span></Label>
                  <Input value={therapistData.phone} onChange={e => setTherapistData(d => ({ ...d, phone: e.target.value }))} placeholder="010-1234-5678" required />
                </div>
                <div className="space-y-2">
                  <Label>전문 분야</Label>
                  <Input value={therapistData.specialization} onChange={e => setTherapistData(d => ({ ...d, specialization: e.target.value }))} placeholder="예: 언어/의사소통" />
                </div>
                <div className="space-y-2">
                  <Label>소속 센터 <span className="text-destructive">*</span></Label>
                  <Select value={therapistData.centerId} onValueChange={v => setTherapistData(d => ({ ...d, centerId: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="센터를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {centers.length === 0 ? (
                        <SelectItem value="none" disabled>등록된 센터가 없습니다</SelectItem>
                      ) : (
                        centers.map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name} ({c.address})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">가입 후 센터장의 승인이 필요합니다</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" className="flex-1" onClick={() => setStep('role')}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> 이전
                </Button>
                <Button
                  className="flex-1"
                  disabled={!therapistData.displayName || !therapistData.phone || !therapistData.centerId}
                  onClick={() => setStep('credentials')}
                >
                  다음 <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Credentials (final step) */}
          {step === 'credentials' && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-3 mb-2">
                <p className="text-sm text-muted-foreground">
                  가입 유형: <span className="font-medium text-foreground">
                    {selectedRole === 'admin' ? '센터장' : selectedRole === 'therapist' ? '치료사' : '보호자'}
                  </span>
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">이메일 <span className="text-destructive">*</span></Label>
                <Input id="signup-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">비밀번호 <span className="text-destructive">*</span></Label>
                <Input id="signup-password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="6자 이상" required minLength={6} />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" className="flex-1" onClick={() => setStep(selectedRole === 'admin' ? 'center-form' : 'therapist-form')}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> 이전
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? '처리 중...' : '회원가입'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
