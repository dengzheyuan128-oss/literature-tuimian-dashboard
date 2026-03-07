import { useState } from 'react';
import { useLocation } from 'wouter';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/contexts/AuthContext';
import { isAdmin } from '@/lib/adminUtils';
import { extractNoticeInfo, type ExtractedNotice, isGlmConfigured } from '@/lib/glmApi';
import { fetchUrlAsMarkdown } from '@/lib/jinaReader';
import { useProgramCards } from '@/lib/programCards';
import { submitLinkSubmission } from '@/lib/supabase';
import {
  buildSubmissionExtractedPayload,
  findBestProgramCardMatch,
} from '@/lib/submissionWorkflow';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export default function AdminExtract() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { universities } = useProgramCards();

  const [url, setUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExtractedNotice | null>(null);

  if (!user || !isAdmin(user.email)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>无权限访问</CardTitle>
            <CardDescription>此页面仅管理员可用。</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation('/dashboard')}>返回首页</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleExtract = async () => {
    if (!url.trim()) return;

    setIsExtracting(true);
    setError(null);
    setResult(null);

    toast.info('正在抓取网页内容');
    const markdownResult = await fetchUrlAsMarkdown(url.trim());
    if (!markdownResult.success) {
      setError(markdownResult.error || '网页抓取失败');
      setIsExtracting(false);
      return;
    }

    toast.info('正在提取结构化字段');
    const extractResult = await extractNoticeInfo(markdownResult.content);
    if (!extractResult.success || !extractResult.data) {
      setError(extractResult.error || 'AI 提取失败');
      setIsExtracting(false);
      return;
    }

    setResult(extractResult.data);
    setIsExtracting(false);
    toast.success('提取完成');
  };

  const handleCopyJson = async () => {
    if (!result) return;

    await navigator.clipboard.writeText(
      JSON.stringify(
        {
          ...result,
          url: url.trim(),
          year: new Date().getFullYear(),
        },
        null,
        2,
      ),
    );
    toast.success('提取结果已复制');
  };

  const handleSaveToQueue = async () => {
    if (!result) return;

    setIsSaving(true);
    const payload = buildSubmissionExtractedPayload(result);
    const matchedCard = findBestProgramCardMatch(payload, universities);
    const success = await submitLinkSubmission(user.id, {
      submitted_url: url.trim(),
      submission_note: '管理员提取后提交',
      extract_status: 'pending_review',
      review_status: 'pending_review',
      extracted_payload: payload as unknown as Record<string, unknown>,
      matched_program_card_id: matchedCard?.sourceCardId || null,
    });
    setIsSaving(false);

    if (!success) {
      toast.error('写入待审核队列失败');
      return;
    }

    toast.success('已写入待审核队列');
    setLocation('/admin/review');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-14 items-center gap-4 px-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <span className="font-medium">AI 公告提取</span>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-4 py-8">
        {!isGlmConfigured() ? (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>未配置 `VITE_GLM_API_KEY`，当前无法执行 AI 提取。</AlertDescription>
          </Alert>
        ) : null}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              输入公告链接
            </CardTitle>
            <CardDescription>
              这里用于管理员手动抓取新链接，并直接写入待审核队列。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="https://example.edu.cn/notice/..."
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                disabled={isExtracting}
              />
              <Button
                onClick={handleExtract}
                disabled={isExtracting || !url.trim() || !isGlmConfigured()}
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    提取中
                  </>
                ) : (
                  '开始提取'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {error ? (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {result ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                提取结果
              </CardTitle>
              <CardDescription>确认字段无误后，可直接送入管理员审核队列。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <ReadonlyField label="学校" value={result.name} />
                <ReadonlyField label="项目" value={result.specialty} />
                <ReadonlyField label="学位类型" value={result.degreeType} />
                <ReadonlyField label="通知类型" value={result.noticeType} />
                <ReadonlyField label="申请时间" value={result.applicationPeriod} />
                <ReadonlyField label="截止日期" value={result.deadline} />
                <ReadonlyField label="考核形式" value={result.examForm} />
                <ReadonlyField label="英语要求" value={result.englishRequirement} />
              </div>

              <Separator />

              <div className="flex flex-wrap gap-3">
                <Button onClick={handleCopyJson} className="gap-2">
                  <Copy className="h-4 w-4" />
                  复制 JSON
                </Button>
                <Button onClick={handleSaveToQueue} disabled={isSaving} className="gap-2">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  写入待审核队列
                </Button>
                <Button variant="outline" asChild>
                  <a href={url} target="_blank" rel="noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    查看原链接
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </main>
    </div>
  );
}

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input value={value} readOnly />
    </div>
  );
}
