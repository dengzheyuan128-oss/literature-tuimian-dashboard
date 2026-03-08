import { useState, useMemo, useEffect } from 'react';
import { Command } from 'cmdk';
import { Search, ExternalLink, GraduationCap, Calendar, BookOpen, Sparkles } from 'lucide-react';
import { University } from '@/types/university';
import { useProgramCards } from '@/lib/programCards';
import { cleanUserInput } from '@/lib/security';
import { getSimplifiedTier, getTierBadgeClassName } from '@/lib/tierUtils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface SearchCommandProps {
  onSelect?: (university: University) => void;
}

export default function SearchCommand({ onSelect }: SearchCommandProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { universities, loading, source, error } = useProgramCards({ search, limit: search.trim() ? 20 : 12 });

  // 搜索结果
  const results = useMemo(() => {
    if (!search.trim()) {
      // 显示热门推荐（985高校）
      return universities.filter(uni => uni.tier === '985').slice(0, 6);
    }

    const cleanSearch = cleanUserInput(search.trim().toLowerCase());

    return universities.filter((uni) => {
      const nameMatch = uni.name.toLowerCase().includes(cleanSearch);
      const specialtyMatch = uni.specialty.toLowerCase().includes(cleanSearch);
      const tierMatch = uni.tier.toLowerCase().includes(cleanSearch);
      const simplifiedTierMatch = getSimplifiedTier(uni.tier).toLowerCase().includes(cleanSearch);

      return nameMatch || specialtyMatch || tierMatch || simplifiedTierMatch;
    }).slice(0, 10);
  }, [search, universities]);

  const handleSelect = (uni: University) => {
    setOpen(false);
    setSearch('');
    if (onSelect) {
      onSelect(uni);
    }
  };

  // 全局键盘监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="group flex items-center gap-3 w-full h-12 px-5 rounded-lg border border-border/50 hover:border-primary/50 bg-card/50 hover:bg-card transition-all text-left"
        >
          <Search className="w-4 h-4 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="flex-1 text-sm text-muted-foreground group-hover:text-foreground transition-colors truncate">
            搜索高校、专业...
          </span>
          <kbd className="shrink-0 px-2 py-1 rounded bg-muted text-[10px] font-mono text-muted-foreground">
            {navigator.platform.includes('Mac') ? '⌘K' : 'Ctrl+K'}
          </kbd>
        </button>
      </DialogTrigger>

      <DialogContent className="p-0 max-w-2xl overflow-hidden border-border/50 shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>搜索高校</DialogTitle>
          <DialogDescription>
            使用快捷键 ⌘K 打开搜索，搜索高校和专业
          </DialogDescription>
        </DialogHeader>

        <Command className="rounded-lg border-0">
          {/* 搜索输入区域 */}
          <div className="flex items-center border-b border-border/50 px-4 bg-gradient-to-r from-muted/30 to-muted/10">
            <Search className="mr-3 h-5 w-5 shrink-0 text-primary" />
            <Command.Input
              placeholder="输入高校名称、专业方向或分类..."
              value={search}
              onValueChange={setSearch}
              className="flex h-14 w-full rounded-md bg-transparent py-3 text-base outline-none placeholder:text-muted-foreground/70 disabled:cursor-not-allowed disabled:opacity-50"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="ml-2 p-1 rounded-md hover:bg-muted transition-colors"
              >
                <span className="text-xs text-muted-foreground">清除</span>
              </button>
            )}
          </div>

          <Command.List className="max-h-[400px] overflow-y-auto p-3">
            {loading && source === 'supabase-loading' && (
              <div className="px-2 py-10 text-center text-sm text-muted-foreground">
                正在加载可检索卡片...
              </div>
            )}

            {source === 'supabase-error' && (
              <div className="px-2 py-10 text-center text-sm text-destructive">
                {error || '搜索数据加载失败'}
              </div>
            )}

            {!loading && source !== 'supabase-error' && results.length === 0 && search && (
              <Command.Empty className="py-12 text-center">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                    <Search className="h-8 w-8 opacity-40" />
                  </div>
                  <div>
                    <p className="font-medium">未找到相关高校</p>
                    <p className="text-sm mt-1">尝试其他关键词</p>
                  </div>
                </div>
              </Command.Empty>
            )}

            <Command.Group
              heading={
                <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  <Sparkles className="w-3.5 h-3.5" />
                  {search ? '搜索结果' : '热门推荐'}
                </div>
              }
            >
              {!loading && source !== 'supabase-error' && results.map((uni) => (
                <Command.Item
                  key={uni.id}
                  value={uni.name}
                  onSelect={() => handleSelect(uni)}
                  className="group flex items-center gap-4 px-3 py-3 rounded-lg cursor-pointer hover:bg-accent/50 aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 transition-all my-1"
                >
                  {/* 院校图标 */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 group-hover:bg-primary/20 group-aria-selected:bg-primary/20 flex items-center justify-center transition-colors">
                    <GraduationCap className="h-5 w-5 text-primary" />
                  </div>

                  {/* 院校信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm truncate">
                        {cleanUserInput(uni.name)}
                      </span>
                      <Badge className={`${getTierBadgeClassName(uni.tier)} text-[10px] px-1.5 py-0 shrink-0`}>
                        {getSimplifiedTier(uni.tier)}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1 min-w-0">
                        <BookOpen className="h-3 w-3 shrink-0" />
                        <span className="truncate max-w-[150px]">{cleanUserInput(uni.specialty)}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Calendar className="h-3 w-3" />
                        <span>{cleanUserInput(uni.deadline)}</span>
                      </div>
                    </div>
                  </div>

                  {/* 外链按钮 */}
                  {uni.url && uni.url !== '' && (
                    <a
                      href={cleanUserInput(uni.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex-shrink-0 p-2 rounded-lg hover:bg-primary/10 transition-colors opacity-0 group-hover:opacity-100"
                      title="查看官方通知"
                    >
                      <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary" />
                    </a>
                  )}
                </Command.Item>
              ))}
            </Command.Group>

            {/* 底部提示 */}
            <div className="border-t border-border/30 mt-2 pt-3 px-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">↑↓</kbd>
                    <span>选择</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">Enter</kbd>
                    <span>打开</span>
                  </span>
                </div>
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">Esc</kbd>
                  <span>关闭</span>
                </span>
              </div>
            </div>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
