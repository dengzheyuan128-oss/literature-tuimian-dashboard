import { Link } from "wouter";
import { ShieldCheck, ArrowLeft, Lock, Eye, Database } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const sections = [
  {
    title: "我们会收集什么",
    items: [
      "注册或登录所需的基础账号信息，例如邮箱地址或第三方登录标识。",
      "你在收藏、提醒、匹配、反馈和补充提交通知时主动提供的内容。",
      "为保障服务稳定性而记录的基础访问日志、错误信息和使用统计。",
    ],
  },
  {
    title: "我们如何使用这些信息",
    items: [
      "提供、维护和改进推免信息查询、收藏、提醒和反馈功能。",
      "处理你提交的数据问题、链接失效、错漏信息和新增通知线索。",
      "识别异常请求、滥用行为和重复提交，保障系统安全。",
    ],
  },
  {
    title: "我们如何共享",
    items: [
      "除非为提供服务所必需、法律要求或你明确授权，否则不会出售你的个人信息。",
      "可能会与提供基础设施、存储或日志服务的供应商共享最小必要数据。",
      "如果发生组织调整或服务迁移，我们会继续按本政策处理相关信息。",
    ],
  },
];

export default function PrivacyPolicy() {
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
            <ShieldCheck className="h-3.5 w-3.5" />
            合规说明
          </Badge>
        </div>

        <Card className="border-0 bg-white/90 shadow-lg backdrop-blur">
          <CardHeader>
            <CardTitle className="text-3xl">隐私政策</CardTitle>
            <CardDescription>
              这是当前网站面向公开用户的最小隐私说明，适用于账号、收藏、提醒、反馈和通知补充等功能。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {sections.map((section) => (
              <section key={section.title} className="space-y-3">
                <h2 className="text-xl font-semibold">{section.title}</h2>
                <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
                  {section.items.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}

            <section className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border bg-muted/30 p-4">
                <div className="mb-2 flex items-center gap-2 font-medium">
                  <Lock className="h-4 w-4" />
                  数据保留与删除
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  我们会在实现服务目的所需的期限内保留必要数据。若你希望删除账号或相关内容，请通过反馈入口提交请求，并说明具体页面或记录。
                </p>
              </div>
              <div className="rounded-xl border bg-muted/30 p-4">
                <div className="mb-2 flex items-center gap-2 font-medium">
                  <Eye className="h-4 w-4" />
                  说明
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  本页是上线前的公开说明，不构成法律意见。若后续增加新的数据处理方式，我们会同步更新本页内容。
                </p>
              </div>
            </section>

            <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
              <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
                <Database className="h-4 w-4" />
                相关入口
              </div>
              <div className="flex flex-wrap gap-2">
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
