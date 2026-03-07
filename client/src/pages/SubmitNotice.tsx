import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, ExternalLink, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/contexts/AuthContext';
import { getOwnSubmissions, submitLinkSubmission, type SubmissionQueueItem } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

export default function SubmitNotice() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<SubmissionQueueItem[]>([]);

  useEffect(() => {
    async function load() {
      if (!user) return;
      setLoading(true);
      const nextItems = await getOwnSubmissions(user.id);
      setItems(nextItems);
      setLoading(false);
    }

    void load();
  }, [user]);

  if (!user) return null;

  const handleSubmit = async () => {
    if (!url.trim()) return;

    setSubmitting(true);
    const success = await submitLinkSubmission(user.id, {
      submitted_url: url.trim(),
      submission_note: note.trim(),
      extract_status: 'pending_extract',
      review_status: 'pending_review',
    });
    setSubmitting(false);

    if (!success) {
      toast.error('提交失败，请稍后重试');
      return;
    }

    toast.success('已提交到待审核队列');
    setUrl('');
    setNote('');
    const nextItems = await getOwnSubmissions(user.id);
    setItems(nextItems);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-14 items-center gap-4 px-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
          <span className="font-medium">补充公告链接</span>
        </div>
      </header>

      <main className="container mx-auto grid max-w-5xl gap-6 px-4 py-8 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>提交新公告</CardTitle>
            <CardDescription>
              先提交链接进入待审核区。管理员会提取结构化信息并审核发布。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notice-url">公告链接</Label>
              <Input
                id="notice-url"
                placeholder="https://example.edu.cn/notice/..."
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notice-note">备注</Label>
              <Textarea
                id="notice-note"
                placeholder="可补充院校、项目、年份等线索，便于管理员更快归卡。"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                disabled={submitting}
                rows={5}
              />
            </div>

            <Button onClick={handleSubmit} disabled={submitting || !url.trim()} className="w-full">
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  提交中
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  提交到审核队列
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>我的提交</CardTitle>
            <CardDescription>这里只显示你自己的链接提交记录。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                加载中
              </div>
            ) : items.length === 0 ? (
              <p className="text-sm text-muted-foreground">还没有提交记录。</p>
            ) : (
              items.map((item) => (
                <div key={item.id} className="rounded-lg border p-3">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <a
                      href={item.submitted_url}
                      target="_blank"
                      rel="noreferrer"
                      className="line-clamp-2 text-sm font-medium text-primary hover:underline"
                    >
                      {item.submitted_url}
                    </a>
                    <Button variant="ghost" size="icon" asChild>
                      <a href={item.submitted_url} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                  <div className="mb-2 flex flex-wrap gap-2">
                    <Badge variant="secondary">{item.extract_status}</Badge>
                    <Badge variant="outline">{item.review_status}</Badge>
                  </div>
                  {item.submission_note ? (
                    <p className="text-sm text-muted-foreground">{item.submission_note}</p>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
