import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/contexts/AuthContext';
import { isAdmin } from '@/lib/adminUtils';
import { extractNoticeInfo, isGlmConfigured } from '@/lib/glmApi';
import { fetchUrlAsMarkdown } from '@/lib/jinaReader';
import { useProgramCards } from '@/lib/programCards';
import {
  approveSubmissionNotice,
  listSubmissionQueue,
  rejectSubmissionNotice,
  updateSubmissionDraft,
  type SubmissionQueueItem,
} from '@/lib/supabase';
import {
  buildApprovedNoticeInsert,
  buildSubmissionExtractedPayload,
  findBestProgramCardMatch,
  type SubmissionExtractedPayload,
} from '@/lib/submissionWorkflow';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type EditablePayload = SubmissionExtractedPayload & {
  matchedProgramCardId: string;
};

const EMPTY_PAYLOAD: EditablePayload = {
  institutionName: '未注明',
  programName: '未注明',
  degreeType: '未注明',
  applicationPeriod: '未注明',
  deadline: '未注明',
  examForm: '未注明',
  englishRequirement: '未注明',
  noticeType: '未注明',
  matchedProgramCardId: '',
};

export default function AdminNoticeReview() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { universities } = useProgramCards();
  const [items, setItems] = useState<SubmissionQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>('');
  const [working, setWorking] = useState(false);
  const [reviewNote, setReviewNote] = useState('');
  const [editablePayload, setEditablePayload] = useState<EditablePayload>(EMPTY_PAYLOAD);

  const userIsAdmin = isAdmin(user?.email);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const nextItems = await listSubmissionQueue();
      setItems(nextItems);
      setLoading(false);
      if (!selectedId && nextItems[0]?.id) {
        setSelectedId(nextItems[0].id);
      }
    }

    if (userIsAdmin) {
      void load();
    }
  }, [userIsAdmin]);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  );

  useEffect(() => {
    if (!selectedItem) {
      setEditablePayload(EMPTY_PAYLOAD);
      return;
    }

    const basePayload = selectedItem.extracted_payload as Partial<SubmissionExtractedPayload>;
    const nextPayload: EditablePayload = {
      institutionName: String(basePayload.institutionName || '未注明'),
      programName: String(basePayload.programName || '未注明'),
      degreeType: String(basePayload.degreeType || '未注明'),
      applicationPeriod: String(basePayload.applicationPeriod || '未注明'),
      deadline: String(basePayload.deadline || '未注明'),
      examForm: String(basePayload.examForm || '未注明'),
      englishRequirement: String(basePayload.englishRequirement || '未注明'),
      noticeType: String(basePayload.noticeType || '未注明'),
      matchedProgramCardId: selectedItem.matched_program_card_id || '',
    };

    if (!nextPayload.matchedProgramCardId && selectedItem.extract_status === 'pending_review') {
      const match = findBestProgramCardMatch(nextPayload, universities);
      nextPayload.matchedProgramCardId = match?.sourceCardId || '';
    }

    setEditablePayload(nextPayload);
    setReviewNote(selectedItem.submission_note || '');
  }, [selectedItem, universities]);

  if (!userIsAdmin) {
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

  const refreshQueue = async () => {
    const nextItems = await listSubmissionQueue();
    setItems(nextItems);
    if (selectedId && !nextItems.some((item) => item.id === selectedId)) {
      setSelectedId(nextItems[0]?.id || '');
    }
  };

  const handleExtract = async () => {
    if (!selectedItem) return;

    setWorking(true);
    const markdownResult = await fetchUrlAsMarkdown(selectedItem.submitted_url);
    if (!markdownResult.success) {
      setWorking(false);
      toast.error(markdownResult.error || '网页抓取失败');
      await updateSubmissionDraft(selectedItem.id, {
        extract_status: 'extract_failed',
        raw_content: '',
      });
      await refreshQueue();
      return;
    }

    const extractResult = await extractNoticeInfo(markdownResult.content);
    if (!extractResult.success || !extractResult.data) {
      setWorking(false);
      toast.error(extractResult.error || 'AI 提取失败');
      await updateSubmissionDraft(selectedItem.id, {
        extract_status: 'extract_failed',
        raw_content: markdownResult.content,
      });
      await refreshQueue();
      return;
    }

    const payload = buildSubmissionExtractedPayload(extractResult.data);
    const matchedCard = findBestProgramCardMatch(payload, universities);
    const success = await updateSubmissionDraft(selectedItem.id, {
      extract_status: 'pending_review',
      review_status: 'pending_review',
      raw_content: markdownResult.content,
      extracted_payload: payload as unknown as Record<string, unknown>,
      matched_program_card_id: matchedCard?.sourceCardId || null,
    });

    setWorking(false);
    if (!success) {
      toast.error('提取结果写入失败');
      return;
    }

    toast.success('已生成待审核草稿');
    await refreshQueue();
  };

  const handleApprove = async () => {
    if (!selectedItem || !user) return;
    if (!editablePayload.matchedProgramCardId) {
      toast.error('请先选择归属卡片');
      return;
    }

    setWorking(true);
    const success = await approveSubmissionNotice(selectedItem, user.id, {
      program_card_id: editablePayload.matchedProgramCardId,
      notice: buildApprovedNoticeInsert(editablePayload, selectedItem.submitted_url),
    });

    if (success) {
      await updateSubmissionDraft(selectedItem.id, {
        extracted_payload: {
          ...editablePayload,
        },
      });
    }

    setWorking(false);
    if (!success) {
      toast.error('审核发布失败');
      return;
    }

    toast.success('已发布到正式公告库');
    await refreshQueue();
  };

  const handleReject = async () => {
    if (!selectedItem || !user) return;

    setWorking(true);
    const success = await rejectSubmissionNotice(
      selectedItem.id,
      user.id,
      reviewNote,
      selectedItem.extracted_payload as Record<string, unknown>,
    );
    setWorking(false);

    if (!success) {
      toast.error('驳回失败');
      return;
    }

    toast.success('已驳回该条提交');
    await refreshQueue();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-14 items-center gap-4 px-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
          <span className="font-medium">新公告审核</span>
        </div>
      </header>

      <main className="container mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[340px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>待审核队列</CardTitle>
            <CardDescription>按“新公告”粒度审核和发布。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                加载中
              </div>
            ) : items.length === 0 ? (
              <p className="text-sm text-muted-foreground">当前没有待处理记录。</p>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full rounded-lg border p-3 text-left transition ${
                    item.id === selectedId ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="mb-2 flex flex-wrap gap-2">
                    <Badge variant="secondary">{item.extract_status}</Badge>
                    <Badge variant="outline">{item.review_status}</Badge>
                  </div>
                  <p className="line-clamp-2 text-sm font-medium">{item.submitted_url}</p>
                  {item.submission_note ? (
                    <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                      {item.submission_note}
                    </p>
                  ) : null}
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>审核详情</CardTitle>
            <CardDescription>
              先提取结构化字段，再选择目标卡片，最后审核发布。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isGlmConfigured() ? (
              <Alert>
                <AlertDescription>
                  未配置 GLM API Key。管理员提取按钮暂不可用，但你仍可查看已有草稿。
                </AlertDescription>
              </Alert>
            ) : null}

            {!selectedItem ? (
              <p className="text-sm text-muted-foreground">请先从左侧选择一条提交记录。</p>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href={selectedItem.submitted_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    查看原链接
                  </a>
                  <Button variant="ghost" size="icon" asChild>
                    <a href={selectedItem.submitted_url} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                  <Badge variant="secondary">{selectedItem.extract_status}</Badge>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field
                    label="学校"
                    value={editablePayload.institutionName}
                    onChange={(value) => setEditablePayload((current) => ({ ...current, institutionName: value }))}
                  />
                  <Field
                    label="项目"
                    value={editablePayload.programName}
                    onChange={(value) => setEditablePayload((current) => ({ ...current, programName: value }))}
                  />
                  <Field
                    label="学位类型"
                    value={editablePayload.degreeType}
                    onChange={(value) => setEditablePayload((current) => ({ ...current, degreeType: value }))}
                  />
                  <Field
                    label="通知类型"
                    value={editablePayload.noticeType}
                    onChange={(value) => setEditablePayload((current) => ({ ...current, noticeType: value }))}
                  />
                  <Field
                    label="申请时间"
                    value={editablePayload.applicationPeriod}
                    onChange={(value) => setEditablePayload((current) => ({ ...current, applicationPeriod: value }))}
                  />
                  <Field
                    label="截止日期"
                    value={editablePayload.deadline}
                    onChange={(value) => setEditablePayload((current) => ({ ...current, deadline: value }))}
                  />
                  <Field
                    label="考核形式"
                    value={editablePayload.examForm}
                    onChange={(value) => setEditablePayload((current) => ({ ...current, examForm: value }))}
                  />
                  <Field
                    label="英语要求"
                    value={editablePayload.englishRequirement}
                    onChange={(value) =>
                      setEditablePayload((current) => ({ ...current, englishRequirement: value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>归属卡片</Label>
                  <Select
                    value={editablePayload.matchedProgramCardId}
                    onValueChange={(value) =>
                      setEditablePayload((current) => ({ ...current, matchedProgramCardId: value }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="选择要挂载的卡片" />
                    </SelectTrigger>
                    <SelectContent>
                      {universities.map((university) => (
                        <SelectItem
                          key={university.sourceCardId ?? String(university.id)}
                          value={university.sourceCardId ?? String(university.id)}
                        >
                          {university.name} / {university.specialty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="review-note">审核备注</Label>
                  <Textarea
                    id="review-note"
                    rows={4}
                    value={reviewNote}
                    onChange={(event) => setReviewNote(event.target.value)}
                    placeholder="可记录修订原因或驳回原因。"
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={handleExtract}
                    disabled={working || !isGlmConfigured()}
                  >
                    {working ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    重新提取
                  </Button>
                  <Button onClick={handleApprove} disabled={working || selectedItem.extract_status === 'pending_extract'}>
                    {working ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                    )}
                    审核通过并发布
                  </Button>
                  <Button variant="destructive" onClick={handleReject} disabled={working}>
                    {working ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="mr-2 h-4 w-4" />
                    )}
                    驳回
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
