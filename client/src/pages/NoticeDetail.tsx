/**
 * 通知原文详情页
 * 展示提取的通知完整内容
 */

import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { universities } from '@/lib/dataLoader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowLeft,
  ExternalLink,
  Calendar,
  GraduationCap,
  Clock,
  FileText,
  Loader2,
} from 'lucide-react';

export default function NoticeDetail() {
  const [, params] = useRoute('/notice/:id');
  const [, setLocation] = useLocation();
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const universityId = params?.id ? parseInt(params.id) : null;
  const university = universityId ? universities.find(u => u.id === universityId) : null;

  useEffect(() => {
    if (!universityId) return;

    // 尝试加载通知原文
    const loadContent = async () => {
      try {
        // 动态导入通知内容文件
        const response = await fetch(`/data/notices/${universityId}.md`);
        if (response.ok) {
          const text = await response.text();
          // 移除 frontmatter
          const contentWithoutFrontmatter = text.replace(/^---[\s\S]*?---\n*/, '');
          setContent(contentWithoutFrontmatter);
        } else {
          setError('暂无通知原文');
        }
      } catch (err) {
        setError('加载失败');
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [universityId]);

  if (!university) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>未找到院校</CardTitle>
            <CardDescription>请检查链接是否正确</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation('/dashboard')}>返回首页</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-14 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <span className="font-medium">{university.name}</span>
          <Badge variant="outline">{university.tier}</Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 院校信息卡片 */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <GraduationCap className="w-6 h-6" />
                  {university.name}
                </CardTitle>
                <CardDescription className="mt-2">
                  {university.specialty}
                </CardDescription>
              </div>
              {university.url && (
                <Button variant="outline" size="sm" asChild>
                  <a href={university.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    查看原始链接
                  </a>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">截止日期：</span>
                <span className="font-medium">{university.deadline}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">申请时间：</span>
                <span className="font-medium">{university.applicationPeriod}</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">考核形式：</span>
                <span className="font-medium">{university.examForm}</span>
              </div>
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">学位类型：</span>
                <span className="font-medium">{university.degreeType}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 通知原文 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              通知原文
            </CardTitle>
            <CardDescription>
              以下内容由 AI 从官方通知页面提取，仅供参考，请以官方原文为准
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{error}</p>
                <p className="text-sm mt-2">请点击上方"查看原始链接"查看官方通知</p>
              </div>
            ) : (
              <ScrollArea className="h-[600px] pr-4">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {content}
                  </pre>
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
