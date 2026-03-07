import { useState } from 'react';
import { Github, Loader2, Lock, LogIn, Mail, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AuthDialogProps {
  trigger?: React.ReactNode;
}

export default function AuthDialog({ trigger }: AuthDialogProps) {
  const {
    signInWithEmail,
    signUpWithEmail,
    signInWithOAuth,
    isConfigured,
    authIssue,
    authReachable,
  } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleEmailSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email || !password) {
      toast.error('请填写邮箱和密码');
      return;
    }

    setLoading(true);
    const { error } = await signInWithEmail(email, password);
    setLoading(false);

    if (error) {
      toast.error(error);
      return;
    }

    toast.success('登录成功');
    setOpen(false);
    setEmail('');
    setPassword('');
  };

  const handleEmailSignUp = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email || !password) {
      toast.error('请填写邮箱和密码');
      return;
    }

    if (password.length < 6) {
      toast.error('密码至少需要 6 位');
      return;
    }

    setLoading(true);
    const { error } = await signUpWithEmail(email, password);
    setLoading(false);

    if (error) {
      toast.error(error);
      return;
    }

    toast.success('注册成功，请查收验证邮件');
    setOpen(false);
    setEmail('');
    setPassword('');
  };

  const handleOAuthSignIn = async (provider: 'github' | 'google') => {
    setLoading(true);
    const { error } = await signInWithOAuth(provider);
    setLoading(false);

    if (error) {
      toast.error(error);
    }
  };

  if (!isConfigured) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" size="sm">
              <LogIn className="mr-2 h-4 w-4" />
              登录
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>认证功能未配置</DialogTitle>
            <DialogDescription>
              当前环境缺少 Supabase 配置，登录和注册暂不可用。
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <LogIn className="mr-2 h-4 w-4" />
            登录
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>欢迎使用推免指南</DialogTitle>
          <DialogDescription>登录后可同步收藏、提醒和提交通知链接。</DialogDescription>
        </DialogHeader>

        {authIssue ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {authIssue}
          </div>
        ) : null}

        <Tabs defaultValue="signin" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">登录</TabsTrigger>
            <TabsTrigger value="signup">注册</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="请输入密码"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading || authReachable === false}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                登录
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleEmailSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email">邮箱</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">密码</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="至少 6 位"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading || authReachable === false}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                注册
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="mt-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">第三方登录</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2">
            <Button
              variant="outline"
              onClick={() => handleOAuthSignIn('github')}
              disabled={loading || authReachable === false}
            >
              <Github className="mr-2 h-4 w-4" />
              GitHub 登录
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
