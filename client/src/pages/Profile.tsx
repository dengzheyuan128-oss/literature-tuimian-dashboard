/**
 * 个人资料页面
 * 用户可以查看和编辑个人信息
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { updateUserProfile } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Loader2, Save, User, Mail, GraduationCap, Building2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const GRADES = ['大一', '大二', '大三', '大四', '研一', '研二', '研三', '已毕业', '其他'];

export default function Profile() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const [, setLocation] = useLocation();

  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // 表单状态
  const [nickname, setNickname] = useState('');
  const [university, setUniversity] = useState('');
  const [major, setMajor] = useState('');
  const [grade, setGrade] = useState('');

  // 初始化表单数据
  useEffect(() => {
    if (profile) {
      setNickname(profile.nickname || '');
      setUniversity(profile.university || '');
      setMajor(profile.major || '');
      setGrade(profile.grade || '');
    }
  }, [profile]);

  // 未登录跳转
  if (!loading && !user) {
    setLocation('/login');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const displayName = profile?.nickname || user?.email?.split('@')[0] || '用户';
  const initials = displayName.slice(0, 2).toUpperCase();

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    setSaved(false);

    const success = await updateUserProfile(user.id, {
      nickname: nickname || null,
      university: university || null,
      major: major || null,
      grade: grade || null,
    });

    if (success) {
      await refreshProfile();
      setSaved(true);
      toast.success('个人资料已保存');
      setTimeout(() => setSaved(false), 3000);
    } else {
      toast.error('保存失败，请重试');
    }

    setIsSaving(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-14 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <span className="font-medium">个人资料</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* 头像卡片 */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <Avatar className="w-20 h-20">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-xl font-bold">{displayName}</h2>
                <p className="text-muted-foreground">{user?.email}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  注册于 {new Date(user?.created_at || '').toLocaleDateString('zh-CN')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 基本信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              基本信息
            </CardTitle>
            <CardDescription>
              完善个人信息，获得更精准的院校推荐
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 昵称 */}
            <div className="space-y-2">
              <Label htmlFor="nickname">昵称</Label>
              <Input
                id="nickname"
                placeholder="你希望被如何称呼"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </div>

            {/* 邮箱（只读） */}
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className="pl-10 bg-muted"
                />
              </div>
              <p className="text-xs text-muted-foreground">邮箱不可修改</p>
            </div>

            <Separator />

            {/* 学校 */}
            <div className="space-y-2">
              <Label htmlFor="university">本科院校</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="university"
                  placeholder="例如：北京大学"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* 专业 */}
            <div className="space-y-2">
              <Label htmlFor="major">专业</Label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="major"
                  placeholder="例如：汉语言文学"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* 年级 */}
            <div className="space-y-2">
              <Label htmlFor="grade">当前年级</Label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger>
                  <SelectValue placeholder="选择年级" />
                </SelectTrigger>
                <SelectContent>
                  {GRADES.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 保存按钮 */}
            <div className="flex items-center gap-4 pt-4">
              <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : saved ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isSaving ? '保存中...' : saved ? '已保存' : '保存更改'}
              </Button>
              {saved && (
                <span className="text-sm text-green-600">更改已保存</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 账号安全 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>账号安全</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                如需修改密码，请使用「忘记密码」功能通过邮箱重置。
              </AlertDescription>
            </Alert>
            <Button variant="outline" disabled>
              修改密码（开发中）
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
