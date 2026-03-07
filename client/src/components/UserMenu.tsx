import { useLocation } from 'wouter';
import {
  Bell,
  Cloud,
  CloudOff,
  Heart,
  Inbox,
  LayoutDashboard,
  Link2,
  LogOut,
  Sparkles,
  User,
} from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/contexts/AuthContext';
import { isAdmin } from '@/lib/adminUtils';
import AuthDialog from './AuthDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export default function UserMenu() {
  const { user, profile, loading, signOut, isConfigured } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
      </Button>
    );
  }

  if (!user) {
    return <AuthDialog />;
  }

  const displayName = profile?.nickname || user.email?.split('@')[0] || '用户';
  const avatarUrl = profile?.avatar_url || undefined;
  const initials = displayName.slice(0, 2).toUpperCase();
  const userIsAdmin = isAdmin(user.email);

  const handleSignOut = async () => {
    await signOut();
    toast.success('已退出登录');
    setLocation('/');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-background">
            {isConfigured ? (
              <Cloud className="h-2.5 w-2.5 text-green-500" />
            ) : (
              <CloudOff className="h-2.5 w-2.5 text-muted-foreground" />
            )}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setLocation('/dashboard')}>
          <LayoutDashboard className="mr-2 h-4 w-4" />
          <span>院校列表</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLocation('/profile')}>
          <User className="mr-2 h-4 w-4" />
          <span>个人资料</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setLocation('/compare')}>
          <Heart className="mr-2 h-4 w-4" />
          <span>院校对比</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLocation('/reminders')}>
          <Bell className="mr-2 h-4 w-4" />
          <span>申请提醒</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLocation('/submit-notice')}>
          <Link2 className="mr-2 h-4 w-4" />
          <span>补充链接</span>
        </DropdownMenuItem>
        {userIsAdmin ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setLocation('/admin/extract')}>
              <Sparkles className="mr-2 h-4 w-4" />
              <span>AI 提取</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLocation('/admin/review')}>
              <Inbox className="mr-2 h-4 w-4" />
              <span>审核队列</span>
            </DropdownMenuItem>
          </>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>退出登录</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
