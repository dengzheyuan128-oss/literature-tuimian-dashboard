import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare } from "lucide-react";

export default function FeedbackDialog() {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (feedback.trim()) {
      // In a real app, this would send the feedback to a server
      console.log("Feedback submitted:", feedback);
      setSubmitted(true);
      setTimeout(() => {
        setOpen(false);
        setFeedback("");
        setSubmitted(false);
      }, 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <MessageSquare className="h-4 w-4" />
          反馈
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>意见反馈</DialogTitle>
          <DialogDescription>
            您的反馈将帮助我们改进网站。感谢您的宝贵意见！
          </DialogDescription>
        </DialogHeader>
        {submitted ? (
          <div className="py-8 text-center text-green-600">
            感谢您的反馈！
          </div>
        ) : (
          <>
            <Textarea
              placeholder="请输入您的反馈意见..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="min-h-[120px]"
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSubmit} disabled={!feedback.trim()}>
                提交反馈
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
