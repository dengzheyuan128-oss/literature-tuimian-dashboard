/**
 * 用户菜单组件
 * 显示已登录用户的头像和下拉菜单
 */

import { useAuth } from '@/contexts/AuthContext';
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
import { User, LogOut, Settings, Heart, Bell, Cloud, CloudOff } from 'lucide-react';
import { toast } from 'sonner';

export default function UserMenu() {
  const { user, profile, loading, signOut, isConfigured } = useAuth();

  // 加载中
  if (loading) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
      </Button>
    );
  }

  // 未登录：显示登录按钮
  if (!user) {
    return <AuthDialog />;
  }

  // 已登录：显示用户菜单
  const displayName = profile?.nickname || user.email?.split('@')[0] || '用户';
  const avatarUrl = profile?.avatar_url || undefined;
  const initials = displayName.slice(0, 2).toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    toast.success('已退出登录');
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
          {/* 云同步状态指示 */}
          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-background flex items-center justify-center">
            {isConfigured ? (
              <Cloud className="w-2.5 h-2.5 text-green-500" />
            ) : (
              <CloudOff className="w-2.5 h-2.5 text-muted-foreground" />
            )}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" />
          <span>个人资料</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Heart className="mr-2 h-4 w-4" />
          <span>我的收藏</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Bell className="mr-2 h-4 w-4" />
          <span>我的提醒</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          <span>设置</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>退出登录</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
