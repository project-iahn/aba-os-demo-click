import { useState } from 'react';
import { User, Bell, Save, StickyNote, Archive, Building2, Plus, Trash2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Memo {
  id: string;
  content: string;
  createdAt: string;
}

interface ArchiveItem {
  id: string;
  title: string;
  type: string;
  createdAt: string;
}

export default function SettingsPage() {
  const { centerProfile, therapists, role } = useApp();
  const { toast } = useToast();
  const [profile, setProfile] = useState(centerProfile);
  const [userName, setUserName] = useState(role === 'admin' ? '관리자' : role === 'therapist' ? '김민지' : '김영희');
  const [userEmail, setUserEmail] = useState(role === 'admin' ? 'admin@haeoreum.kr' : role === 'therapist' ? 'minji@abaos.kr' : 'guardian@email.com');
  const [userPhone, setUserPhone] = useState('010-0000-0000');

  const [notifications, setNotifications] = useState({
    sessionReminder: true,
    reportDue: true,
    lowAdherence: true,
    emailDigest: false,
  });

  // Private memos
  const [memos, setMemos] = useState<Memo[]>([
    { id: '1', content: '다음 주 하늘이 부모 상담 일정 확인 필요', createdAt: new Date().toISOString() },
  ]);
  const [newMemo, setNewMemo] = useState('');

  // Archive
  const [archives, setArchives] = useState<ArchiveItem[]>([
    { id: '1', title: '2024년 연간 보고서 초안', type: '문서', createdAt: '2024-12-15' },
    { id: '2', title: '치료 전략 노트 - 감각통합', type: '노트', createdAt: '2024-11-20' },
  ]);

  const handleSave = () => {
    toast({ title: '저장 완료', description: '설정이 저장되었습니다. (데모)' });
  };

  const addMemo = () => {
    if (!newMemo.trim()) return;
    setMemos(prev => [{ id: `m${Date.now()}`, content: newMemo, createdAt: new Date().toISOString() }, ...prev]);
    setNewMemo('');
    toast({ title: '메모 추가', description: '프라이빗 메모가 저장되었습니다.' });
  };

  const deleteMemo = (id: string) => {
    setMemos(prev => prev.filter(m => m.id !== id));
  };

  const isReadOnly = role === 'parent';

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">설정</h1>
        <p className="text-muted-foreground">계정 정보 및 알림 설정을 관리하세요</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              계정 정보
            </CardTitle>
            <CardDescription>가입자 정보를 관리합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>성명</Label>
              <Input value={userName} onChange={(e) => setUserName(e.target.value)} disabled={isReadOnly} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>이메일</Label>
                <Input value={userEmail} onChange={(e) => setUserEmail(e.target.value)} disabled={isReadOnly} />
              </div>
              <div className="space-y-2">
                <Label>연락처</Label>
                <Input value={userPhone} onChange={(e) => setUserPhone(e.target.value)} disabled={isReadOnly} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>역할</Label>
              <div>
                <Badge variant="secondary">
                  {role === 'admin' ? '센터 관리자' : role === 'therapist' ? '치료사' : '보호자'}
                </Badge>
              </div>
            </div>

            {/* Registered Center Info */}
            <div className="border-t border-border pt-4 mt-4 space-y-3">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                등록된 센터 정보
              </p>
              <div className="space-y-2">
                <Label>센터명</Label>
                <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} disabled={isReadOnly} />
              </div>
              <div className="space-y-2">
                <Label>주소</Label>
                <Input value={profile.location} onChange={(e) => setProfile({ ...profile, location: e.target.value })} disabled={isReadOnly} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>센터 연락처</Label>
                  <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} disabled={isReadOnly} />
                </div>
                <div className="space-y-2">
                  <Label>센터 이메일</Label>
                  <Input value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} disabled={isReadOnly} />
                </div>
              </div>
            </div>

            {!isReadOnly && (
              <Button onClick={handleSave} className="w-full gap-2">
                <Save className="h-4 w-4" />
                저장
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-muted-foreground" />
              알림 설정
            </CardTitle>
            <CardDescription>알림 수신 설정을 관리합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {[
              { key: 'sessionReminder' as const, title: '세션 리마인더', desc: '예정된 세션 1시간 전 알림' },
              { key: 'reportDue' as const, title: '리포트 마감 알림', desc: '월간 리포트 마감 3일 전 알림' },
              { key: 'lowAdherence' as const, title: '저조한 진전 알림', desc: '성공률이 급격히 감소한 경우 알림' },
              { key: 'emailDigest' as const, title: '이메일 일간 요약', desc: '매일 저녁 8시 요약 이메일 발송' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
                <Switch
                  checked={notifications[item.key]}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, [item.key]: checked })}
                  disabled={isReadOnly}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Private Memo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StickyNote className="h-5 w-5 text-muted-foreground" />
              프라이빗 메모
            </CardTitle>
            <CardDescription>개인 메모를 작성하고 관리합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Textarea
                value={newMemo}
                onChange={(e) => setNewMemo(e.target.value)}
                placeholder="메모를 입력하세요..."
                rows={2}
                className="flex-1"
              />
              <Button size="sm" onClick={addMemo} className="self-end">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {memos.map(memo => (
                <div key={memo.id} className="flex items-start justify-between gap-2 rounded-lg border border-border p-3">
                  <div className="flex-1">
                    <p className="text-sm">{memo.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(memo.createdAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => deleteMemo(memo.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {memos.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">메모가 없습니다</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Personal Archive */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5 text-muted-foreground" />
              개인 자료 아카이빙
            </CardTitle>
            <CardDescription>개인 자료를 아카이빙합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {archives.map(item => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/30 transition-colors">
                <div>
                  <p className="font-medium text-sm">{item.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">{item.type}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString('ko-KR')}</span>
                  </div>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full gap-2" onClick={() => toast({ title: '업로드', description: '파일 업로드 기능은 추후 지원됩니다. (데모)' })}>
              <Plus className="h-4 w-4" />
              자료 추가
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
