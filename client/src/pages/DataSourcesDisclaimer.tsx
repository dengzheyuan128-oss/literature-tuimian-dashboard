import { Link } from "wouter";
import { ArrowLeft, Database, AlertTriangle, CheckCircle2, Link2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const sources = [
  "高校官网、学院官网、通知公告页、招生简章等公开官方来源。",
  "用户通过反馈或提交通知入口提供的线索，经人工或程序化清洗后进入待审核或已发布流程。",
  "站内的归纳、摘要、标签和可用状态是面向检索的整理结果，不等同于原始公告全文。",
];

export default function DataSourcesDisclaimer() {
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
            <Database className="h-3.5 w-3.5" />
            数据来源说明
          </Badge>
        </div>

        <Card className="border-0 bg-white/90 shadow-lg backdrop-blur">
          <CardHeader>
            <CardTitle className="text-3xl">数据来源与免责声明</CardTitle>
            <CardDescription>
              说明本站数据来自哪里、如何整理，以及你在使用时需要注意什么。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <section className="space-y-3">
              <h2 className="text-xl font-semibold">主要来源</h2>
              <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
                {sources.map((source) => (
                  <li key={source} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>{source}</span>
                  </li>
                ))}
              </ul>
            </section>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border bg-muted/30 p-4">
                <div className="mb-2 flex items-center gap-2 font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  使用提示
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  请始终以官方页面为最终依据，尤其是截止时间、材料要求、申请资格和面试安排。
                </p>
              </div>
              <div className="rounded-xl border bg-muted/30 p-4">
                <div className="mb-2 flex items-center gap-2 font-medium">
                  <AlertTriangle className="h-4 w-4" />
                  免责声明
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  如果站内摘要、标签或可用状态与原始公告不一致，请以原始来源为准，并通过反馈入口帮助我们修正。
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
              <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
                <Link2 className="h-4 w-4" />
                快速入口
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/feedback">
                  <Button variant="outline" size="sm">提交数据问题</Button>
                </Link>
                <Link href="/terms">
                  <Button variant="outline" size="sm">服务条款</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
