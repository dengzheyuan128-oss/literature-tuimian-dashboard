import { useState, useMemo } from 'react';
import { Command } from 'cmdk';
import { Search, ExternalLink, GraduationCap, Calendar, BookOpen, GraduationCap as GraduationCapIcon } from 'lucide-react';
import { University } from '@/types/university';
import { universities } from '@/lib/dataLoader';
import { cleanUserInput } from '@/lib/security';
import { useLocation } from 'wouter';
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
  const [, setLocation] = useLocation();

  // 搜索结果
  const results = useMemo(() => {
    if (!search.trim()) {
      return [];
    }

    const cleanSearch = cleanUserInput(search.trim().toLowerCase());

    return universities.filter((uni) => {
      const nameMatch = uni.name.toLowerCase().includes(cleanSearch);
      const specialtyMatch = uni.specialty.toLowerCase().includes(cleanSearch);
      const tierMatch = uni.tier.toLowerCase().includes(cleanSearch);

      return nameMatch || specialtyMatch || tierMatch;
    }).slice(0, 10); // 限制显示前10条结果
  }, [search]);

  const handleSelect = (uni: University) => {
    setOpen(false);
    setSearch('');
    if (onSelect) {
      onSelect(uni);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setOpen((prev) => !prev);
    }
  };

  // 添加全局键盘监听
  useState(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border/50 hover:border-primary/50 bg-card/50 hover:bg-card transition-all text-left text-sm text-muted-foreground"
        >
          <Search className="w-4 h-4" />
          <span className="flex-1">搜索高校、专业...</span>
          <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">
            ⌘K
          </kbd>
        </button>
      </DialogTrigger>
      <DialogContent className="p-0 max-w-2xl">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="sr-only">搜索高校</DialogTitle>
          <DialogDescription className="sr-only">
            使用快捷键 ⌘K 打开搜索，搜索高校和专业
          </DialogDescription>
        </DialogHeader>

        <Command className="rounded-lg border-0 shadow-lg">
          <div className="flex items-center border-b px-3" cmdk-input-wrapper>
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              placeholder="搜索高校名称、专业方向、梯队..."
              value={search}
              onValueChange={setSearch}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <Command.List className="max-h-[300px] overflow-y-auto p-2">
            {results.length === 0 && (
              <Command.Empty className="py-6 text-center text-sm">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Search className="h-8 w-8 opacity-50" />
                  <p>未找到相关高校</p>
                </div>
              </Command.Empty>
            )}

            <Command.Group heading="搜索结果">
              {results.map((uni) => (
                <Command.Item
                  key={uni.id}
                  value={uni.name}
                  onSelect={() => handleSelect(uni)}
                  className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-accent aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 transition-all"
                >
                  <div className="flex-shrink-0">
                    <GraduationCapIcon className="h-5 w-5 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-sm truncate">
                        {cleanUserInput(uni.name)}
                      </span>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {uni.tier}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        <span className="truncate">{cleanUserInput(uni.specialty)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{cleanUserInput(uni.deadline)}</span>
                      </div>
                    </div>
                  </div>

                  {uni.url && uni.url !== '' && (
                    <a
                      href={cleanUserInput(uni.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex-shrink-0 p-1 rounded hover:bg-accent transition-colors"
                    >
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </a>
                  )}
                </Command.Item>
              ))}
            </Command.Group>

            <div className="border-t px-3 py-2 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>提示：使用 <kbd className="px-1 rounded bg-muted">↑↓</kbd> 选择，<kbd className="px-1 rounded bg-muted">Enter</kbd> 打开</span>
                <span>按 <kbd className="px-1 rounded bg-muted">Esc</kbd> 关闭</span>
              </div>
            </div>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
