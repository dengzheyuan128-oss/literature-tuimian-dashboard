import { useEffect, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  ExternalLink,
  FileText,
  GraduationCap,
  Loader2,
} from 'lucide-react';

import type { PublicProgramCard } from '@/types/publicProgramCard';
import { getPublicProgramCardById } from '@/lib/publicProgramCards';
import { getTierBadgeClassName } from '@/lib/tierUtils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function NoticeDetail() {
  const [, params] = useRoute('/notice/:id');
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [card, setCard] = useState<PublicProgramCard | null>(null);

  const universityId = params?.id ?? null;

  useEffect(() => {
    if (!universityId) return;

    const loadData = async () => {
      try {
        const loadedCard = await getPublicProgramCardById(universityId);
        if (!loadedCard) {
          setError('未找到卡片详情');
        } else {
          setCard(loadedCard);
        }
      } catch {
        setError('加载详情失败');
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [universityId]);

  if (!loading && !card) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>未找到院校</CardTitle>
            <CardDescription>{error || '请检查链接是否正确'}</CardDescription>
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
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-14 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <span className="font-medium">{card?.institutionName ?? '卡片详情'}</span>
          <div className="flex flex-wrap gap-2">
            {card?.institutionTags.map((tag) => (
              <Badge key={`header-${tag}`} className={getTierBadgeClassName(tag)}>
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <GraduationCap className="w-6 h-6" />
                  {card?.institutionName ?? '加载中'}
                </CardTitle>
                <CardDescription className="mt-2">
                  {card?.programName || '待补充'}
                </CardDescription>
              </div>
              {card?.url ? (
                <Button variant="outline" size="sm" asChild>
                  <a href={card.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    官方通知
                  </a>
                </Button>
              ) : null}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">截止时间</span>
                <span className="font-medium">{card?.deadline || '待补充'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">申请时间</span>
                <span className="font-medium">{card?.applicationPeriod || '待补充'}</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">考核方式</span>
                <span className="font-medium">{card?.examForm || '待补充'}</span>
              </div>
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">学位类型</span>
                <span className="font-medium">{card?.degreeType || '待补充'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              结构化详情
            </CardTitle>
            <CardDescription>
              当前页面展示的是数据库中的结构化字段，具体要求仍请以官方通知原文为准。
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                加载中...
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{error}</p>
                </div>
              </div>
            ) : card ? (
              <div className="space-y-6 text-sm font-sans">
                <Field label="院校" value={card.institutionName} />
                <Field label="项目/专业" value={card.programName} />
                <Field label="院校层次" value={card.institutionTags.join(' / ') || card.tier || '其他'} />
                <Field label="地区" value={card.location || '待补充'} />
                <Field label="英语要求" value={card.englishRequirement || '待补充'} />
                <Field label="申请时间" value={card.applicationPeriod || '待补充'} />
                <Field label="截止时间" value={card.deadline || '待补充'} />
                <Field label="考核方式" value={card.examForm || '待补充'} />
                {card.url ? (
                  <div className="pt-2">
                    <Button asChild>
                      <a href={card.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        打开官方通知链接
                      </a>
                    </Button>
                  </div>
                ) : (
                  <div className="text-muted-foreground">当前卡片未提取到可用官网链接</div>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-muted-foreground mb-1">{label}</div>
      <div className="text-base">{value}</div>
    </div>
  );
}
