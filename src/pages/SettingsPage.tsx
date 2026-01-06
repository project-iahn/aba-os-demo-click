import { useState } from 'react';
import { Building2, Users, Bell, Save } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { centerProfile, therapists, role } = useApp();
  const { toast } = useToast();
  const [profile, setProfile] = useState(centerProfile);
  const [notifications, setNotifications] = useState({
    sessionReminder: true,
    reportDue: true,
    lowAdherence: true,
    emailDigest: false,
  });

  const handleSave = () => {
    toast({
      title: '저장 완료',
      description: '설정이 저장되었습니다. (데모)',
    });
  };

  const isReadOnly = role === 'parent';

  return (
    <div className="animate-fade-in space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">설정</h1>
        <p className="text-muted-foreground">센터 정보 및 알림 설정을 관리하세요</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Center Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              센터 정보
            </CardTitle>
            <CardDescription>센터의 기본 정보를 관리합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="centerName">센터명</Label>
              <Input
                id="centerName"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                disabled={isReadOnly}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">주소</Label>
              <Input
                id="location"
                value={profile.location}
                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                disabled={isReadOnly}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">연락처</Label>
                <Input
                  id="phone"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  disabled={isReadOnly}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  disabled={isReadOnly}
                />
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
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">세션 리마인더</p>
                <p className="text-sm text-muted-foreground">예정된 세션 1시간 전 알림</p>
              </div>
              <Switch
                checked={notifications.sessionReminder}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, sessionReminder: checked })
                }
                disabled={isReadOnly}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">리포트 마감 알림</p>
                <p className="text-sm text-muted-foreground">월간 리포트 마감 3일 전 알림</p>
              </div>
              <Switch
                checked={notifications.reportDue}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, reportDue: checked })
                }
                disabled={isReadOnly}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">저조한 진전 알림</p>
                <p className="text-sm text-muted-foreground">성공률이 급격히 감소한 경우 알림</p>
              </div>
              <Switch
                checked={notifications.lowAdherence}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, lowAdherence: checked })
                }
                disabled={isReadOnly}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">이메일 일간 요약</p>
                <p className="text-sm text-muted-foreground">매일 저녁 8시 요약 이메일 발송</p>
              </div>
              <Switch
                checked={notifications.emailDigest}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, emailDigest: checked })
                }
                disabled={isReadOnly}
              />
            </div>
          </CardContent>
        </Card>

        {/* Therapists List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              치료사 목록
            </CardTitle>
            <CardDescription>등록된 치료사 정보를 확인합니다</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {therapists.map((therapist) => (
                <div
                  key={therapist.id}
                  className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/30"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {therapist.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{therapist.name}</p>
                      <p className="text-sm text-muted-foreground">{therapist.specialization}</p>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">{therapist.email}</p>
                    <p className="text-muted-foreground">{therapist.phone}</p>
                  </div>
                  <div className="mt-3">
                    <Badge variant="secondary">{therapist.caseCount} 케이스</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
