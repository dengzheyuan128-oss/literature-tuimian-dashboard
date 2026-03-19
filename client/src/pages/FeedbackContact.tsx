import { Link } from "wouter";
import { ArrowLeft, MessageSquareText, Send, FilePlus2, MailQuestion, BellRing } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const entryPoints = [
  {
    title: "数据问题反馈",
    description: "发现链接失效、信息过期、标签错误或页面内容不一致时，请通过右下角反馈入口提交。",
  },
  {
    title: "新增通知提交",
    description: "如果你发现新的推免通知或补充线索，请尽量提供原始链接和必要说明。",
  },
  {
    title: "账号与信息请求",
    description: "如果你要咨询账号、删除或更正与个人相关的信息，请在反馈中写清页面地址和具体请求。",
  },
];

export default function FeedbackContact() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link href="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              返回首页
            </Button>
          </Link>
          <Badge variant="secondary" className="gap-1">
            <MessageSquareText className="h-3.5 w-3.5" />
            反馈与联系
          </Badge>
        </div>

        <Card className="border-0 bg-white/90 shadow-lg backdrop-blur">
          <CardHeader>
            <CardTitle className="text-3xl">反馈与联系</CardTitle>
            <CardDescription>
              这里是提交问题、补充线索和联系维护者的最小入口。优先写清页面链接、问题类型和复现方式。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <section className="grid gap-4 md:grid-cols-3">
              {entryPoints.map((entry) => (
                <div key={entry.title} className="rounded-xl border bg-muted/30 p-4">
                  <h2 className="mb-2 font-semibold">{entry.title}</h2>
                  <p className="text-sm leading-6 text-muted-foreground">{entry.description}</p>
                </div>
              ))}
            </section>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border bg-muted/30 p-4">
                <div className="mb-2 flex items-center gap-2 font-medium">
                  <Send className="h-4 w-4" />
                  最快反馈方式
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  在任意页面点击右下角反馈按钮，选择“链接失效”“信息过期”或“信息错误”，并补充描述。
                </p>
              </div>
              <div className="rounded-xl border bg-muted/30 p-4">
                <div className="mb-2 flex items-center gap-2 font-medium">
                  <BellRing className="h-4 w-4" />
                  新通知提交
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  如果你希望提交新的院校通知，请前往“补充公告链接”页面，并尽量提供原始链接和必要备注。
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
              <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
                <MailQuestion className="h-4 w-4" />
                相关页面
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/data-sources">
                  <Button variant="outline" size="sm">数据来源与免责声明</Button>
                </Link>
                <Link href="/privacy">
                  <Button variant="outline" size="sm">隐私政策</Button>
                </Link>
                <Link href="/submit-notice">
                  <Button variant="outline" size="sm">
                    <FilePlus2 className="mr-2 h-4 w-4" />
                    补充公告链接
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
