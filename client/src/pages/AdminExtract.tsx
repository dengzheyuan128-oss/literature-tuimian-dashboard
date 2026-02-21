/**
 * 管理员 AI 提取页面
 * 从 URL 自动提取院校通知信息
 */

import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { isAdmin } from '@/lib/adminUtils';
import { fetchUrlAsMarkdown } from '@/lib/jinaReader';
import { extractNoticeInfo, ExtractedNotice, isGlmConfigured } from '@/lib/glmApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminExtract() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const [url, setUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExtractedNotice | null>(null);

  // 权限检查
  if (!user || !isAdmin(user.email)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>无权限访问</CardTitle>
            <CardDescription>此页面仅限管理员使用</CardDescription>
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

    // Step 1: 获取网页内容
    toast.info('正在获取网页内容...');
    const jinaResult = await fetchUrlAsMarkdown(url);

    if (!jinaResult.success) {
      setError(`获取网页失败: ${jinaResult.error}`);
      setIsExtracting(false);
      return;
    }

    // Step 2: 调用 GLM 提取
    toast.info('正在 AI 提取信息...');
    const glmResult = await extractNoticeInfo(jinaResult.content);

    if (!glmResult.success || !glmResult.data) {
      setError(`AI 提取失败: ${glmResult.error}`);
      setIsExtracting(false);
      return;
    }

    setResult(glmResult.data);
    setIsExtracting(false);
    toast.success('提取成功！');
  };

  const handleCopyJson = () => {
    if (!result) return;

    const json = JSON.stringify(
      {
        ...result,
        url: url,
        linkGrade: 'A',
        yearStatus: 'verified',
        year: new Date().getFullYear(),
      },
      null,
      2
    );

    navigator.clipboard.writeText(json);
    toast.success('JSON 已复制到剪贴板');
  };

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
          <span className="font-medium">AI 通知提取</span>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
            管理员工具
          </span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* API 配置检查 */}
        {!isGlmConfigured() && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              GLM API Key 未配置。请在环境变量中设置 VITE_GLM_API_KEY
            </AlertDescription>
          </Alert>
        )}

        {/* URL 输入 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              输入通知 URL
            </CardTitle>
            <CardDescription>
              输入高校推免通知页面的 URL，AI 将自动提取结构化信息
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="https://example.edu.cn/notice/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
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
                  '提取'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 错误提示 */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 提取结果 */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                提取结果
              </CardTitle>
              <CardDescription>
                请核对以下信息，如有错误可手动修改后复制
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>院校名称</Label>
                  <Input value={result.name} readOnly />
                </div>
                <div>
                  <Label>专业方向</Label>
                  <Input value={result.specialty} readOnly />
                </div>
                <div>
                  <Label>学位类型</Label>
                  <Input value={result.degreeType} readOnly />
                </div>
                <div>
                  <Label>通知类型</Label>
                  <Input value={result.noticeType} readOnly />
                </div>
                <div>
                  <Label>申请时间</Label>
                  <Input value={result.applicationPeriod} readOnly />
                </div>
                <div>
                  <Label>截止日期</Label>
                  <Input value={result.deadline} readOnly />
                </div>
                <div>
                  <Label>考核形式</Label>
                  <Input value={result.examForm} readOnly />
                </div>
                <div>
                  <Label>英语要求</Label>
                  <Input value={result.englishRequirement} readOnly />
                </div>
              </div>

              <Separator />

              <div className="flex gap-3">
                <Button onClick={handleCopyJson} className="gap-2">
                  <Copy className="w-4 h-4" />
                  复制 JSON
                </Button>
                <Button variant="outline" asChild>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    查看原始链接
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
