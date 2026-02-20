/**
 * 登录/注册对话框组件
 */

import { useState } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { LogIn, UserPlus, Mail, Lock, Github, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AuthDialogProps {
  trigger?: React.ReactNode;
}

export default function AuthDialog({ trigger }: AuthDialogProps) {
  const { signInWithEmail, signUpWithEmail, signInWithOAuth, isConfigured } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 邮箱登录
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('请填写邮箱和密码');
      return;
    }

    setLoading(true);
    const { error } = await signInWithEmail(email, password);
    setLoading(false);

    if (error) {
      toast.error(error);
    } else {
      toast.success('登录成功');
      setOpen(false);
      setEmail('');
      setPassword('');
    }
  };

  // 邮箱注册
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('请填写邮箱和密码');
      return;
    }

    if (password.length < 6) {
      toast.error('密码至少需要6位');
      return;
    }

    setLoading(true);
    const { error } = await signUpWithEmail(email, password);
    setLoading(false);

    if (error) {
      toast.error(error);
    } else {
      toast.success('注册成功，请查收验证邮件');
      setOpen(false);
      setEmail('');
      setPassword('');
    }
  };

  // OAuth 登录
  const handleOAuthSignIn = async (provider: 'github' | 'google') => {
    setLoading(true);
    const { error } = await signInWithOAuth(provider);
    setLoading(false);

    if (error) {
      toast.error(error);
    }
  };

  // 未配置时显示提示
  if (!isConfigured) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" size="sm">
              <LogIn className="w-4 h-4 mr-2" />
              登录
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>功能开发中</DialogTitle>
            <DialogDescription>
              用户系统正在开发中，敬请期待。目前数据保存在浏览器本地。
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
            <LogIn className="w-4 h-4 mr-2" />
            登录
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>欢迎使用推免指南</DialogTitle>
          <DialogDescription>
            登录后可云端同步收藏、提醒等数据
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="signin" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">登录</TabsTrigger>
            <TabsTrigger value="signup">注册</TabsTrigger>
          </TabsList>

          {/* 登录 */}
          <TabsContent value="signin">
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4 mr-2" />
                )}
                登录
              </Button>
            </form>
          </TabsContent>

          {/* 注册 */}
          <TabsContent value="signup">
            <form onSubmit={handleEmailSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email">邮箱</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">密码</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="至少6位"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-2" />
                )}
                注册
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        {/* OAuth 登录 */}
        <div className="mt-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                或使用第三方登录
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => handleOAuthSignIn('github')}
              disabled={loading}
            >
              <Github className="w-4 h-4 mr-2" />
              GitHub 登录
            </Button>
            {/* 微信登录需要在 Supabase 配置后启用 */}
            {/* <Button
              variant="outline"
              onClick={() => handleOAuthSignIn('wechat')}
              disabled={loading}
            >
              微信登录
            </Button> */}
          </div>
        </div>

        <p className="text-xs text-center text-muted-foreground mt-4">
          登录即表示同意我们的服务条款和隐私政策
        </p>
      </DialogContent>
    </Dialog>
  );
}
