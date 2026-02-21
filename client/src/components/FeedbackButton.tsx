/**
 * 用户反馈悬浮按钮组件
 * 点击后弹出反馈表单
 */

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { submitFeedback, FeedbackType } from '@/lib/supabase';
import { universities } from '@/lib/dataLoader';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MessageSquarePlus, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const FEEDBACK_TYPES: { value: FeedbackType; label: string; description: string }[] = [
  { value: 'link_invalid', label: '链接失效', description: '链接无法打开或404' },
  { value: 'info_outdated', label: '信息过期', description: '信息已不是最新的' },
  { value: 'info_wrong', label: '信息错误', description: '信息内容有误' },
];

export default function FeedbackButton() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // 表单状态
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('link_invalid');
  const [universityId, setUniversityId] = useState<string>('');
  const [description, setDescription] = useState('');

  const resetForm = () => {
    setFeedbackType('link_invalid');
    setUniversityId('');
    setDescription('');
    setSubmitted(false);
  };

  const handleSubmit = async () => {
    if (!user || !description.trim()) return;

    setIsSubmitting(true);

    const selectedUniversity = universityId
      ? universities.find((u) => u.id === parseInt(universityId))
      : null;

    const success = await submitFeedback(user.id, {
      feedback_type: feedbackType,
      university_id: selectedUniversity?.id,
      university_name: selectedUniversity?.name,
      description: description.trim(),
      page_url: window.location.href,
    });

    setIsSubmitting(false);

    if (success) {
      setSubmitted(true);
      toast.success('感谢您的反馈！');
      setTimeout(() => {
        setOpen(false);
        resetForm();
      }, 1500);
    } else {
      toast.error('提交失败，请重试');
    }
  };

  // 未登录不显示
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          className="fixed bottom-20 right-4 z-50 h-12 w-12 rounded-full shadow-lg"
        >
          <MessageSquarePlus className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>反馈问题</DialogTitle>
          <DialogDescription>
            发现数据问题？请告诉我们，帮助我们改进。
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="flex flex-col items-center py-8 gap-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <p className="text-lg font-medium">感谢您的反馈！</p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* 反馈类型 */}
            <div className="space-y-2">
              <Label>问题类型</Label>
              <RadioGroup
                value={feedbackType}
                onValueChange={(v) => setFeedbackType(v as FeedbackType)}
              >
                {FEEDBACK_TYPES.map((type) => (
                  <div key={type.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={type.value} id={type.value} />
                    <Label htmlFor={type.value} className="flex-1 cursor-pointer">
                      <span className="font-medium">{type.label}</span>
                      <span className="text-muted-foreground text-sm ml-2">
                        {type.description}
                      </span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* 院校选择（可选） */}
            <div className="space-y-2">
              <Label>相关院校（可选）</Label>
              <Select value={universityId} onValueChange={setUniversityId}>
                <SelectTrigger>
                  <SelectValue placeholder="选择院校..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="">不选择</SelectItem>
                  {universities.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 问题描述 */}
            <div className="space-y-2">
              <Label>问题描述</Label>
              <Textarea
                placeholder="请详细描述您发现的问题..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            {/* 提交按钮 */}
            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={isSubmitting || !description.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  提交中...
                </>
              ) : (
                '提交反馈'
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
