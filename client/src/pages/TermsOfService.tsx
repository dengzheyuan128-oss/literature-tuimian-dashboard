import { Link } from "wouter";
import { ArrowLeft, Scale, ShieldAlert, FileText, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const rules = [
  "本网站提供的是信息检索与辅助判断服务，不保证所有通知都实时、完整或绝对无误。",
  "在使用前，请以院校官网、学院通知或正式公告为准；如本页内容与官方信息冲突，官方信息优先。",
  "你提交的反馈、补充链接和说明应当真实、合法，不得恶意刷屏、提交无关内容或冒充他人。",
  "未经授权，不得批量抓取、重新分发或用于违法用途；如需合作或授权，请通过反馈入口联系维护者。",
];

export default function TermsOfService() {
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
            <Scale className="h-3.5 w-3.5" />
            使用条款
          </Badge>
        </div>

        <Card className="border-0 bg-white/90 shadow-lg backdrop-blur">
          <CardHeader>
            <CardTitle className="text-3xl">服务条款</CardTitle>
            <CardDescription>
              适用于你访问、检索、收藏、提醒、反馈和提交通知线索等行为。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <section className="space-y-3">
              <h2 className="text-xl font-semibold">使用规则</h2>
              <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
                {rules.map((rule) => (
                  <li key={rule} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </section>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border bg-muted/30 p-4">
                <div className="mb-2 flex items-center gap-2 font-medium">
                  <ShieldAlert className="h-4 w-4" />
                  责任边界
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  你应自行核验院校官方通知后再做申请决策。本网站用于辅助整理和筛选，不替代官方公告与个人判断。
                </p>
              </div>
              <div className="rounded-xl border bg-muted/30 p-4">
                <div className="mb-2 flex items-center gap-2 font-medium">
                  <FileText className="h-4 w-4" />
                  条款变更
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  若服务范围、数据处理方式或功能入口变化，我们会更新本页。继续使用即表示你同意更新后的条款。
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
              <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
                <ExternalLink className="h-4 w-4" />
                相关页面
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/privacy">
                  <Button variant="outline" size="sm">隐私政策</Button>
                </Link>
                <Link href="/data-sources">
                  <Button variant="outline" size="sm">数据来源与免责声明</Button>
                </Link>
                <Link href="/feedback">
                  <Button variant="outline" size="sm">反馈与联系</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
