import { Link } from "wouter";
import {
  ArrowRight,
  Bell,
  BookOpen,
  CheckCircle,
  GraduationCap,
  Scale,
  Search,
  ShieldCheck,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const FEATURES = [
  {
    icon: Search,
    title: "快速筛选",
    description: "按学校、项目、截止时间和来源状态快速定位与你相关的机会。",
  },
  {
    icon: Scale,
    title: "项目对比",
    description: "把多个项目放到同一屏里比较，减少来回切换和遗漏。",
  },
  {
    icon: Bell,
    title: "截止提醒",
    description: "围绕关键节点设置提醒，降低错过通知的风险。",
  },
  {
    icon: ShieldCheck,
    title: "来源可追溯",
    description: "优先展示官方来源、核验状态和下一步行动建议。",
  },
];

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="font-semibold">推免信息指南</span>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/privacy">
              <Button variant="ghost" size="sm">
                隐私政策
              </Button>
            </Link>
            <Link href={user ? "/dashboard" : "/login"}>
              <Button size="sm">{user ? "进入平台" : "登录使用"}</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 md:py-24">
        <section className="mx-auto max-w-5xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm text-primary">
            <GraduationCap className="h-4 w-4" />
            面向中文及相关方向的推免信息整理与决策辅助
          </div>
          <h1 className="mx-auto max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">
            先找到机会，再判断是否适合你
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-muted-foreground md:text-lg">
            这个网站的目标不是堆更多通知，而是把学校、项目、截止时间、官方来源和下一步行动整理成可直接判断的项目卡。
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href={user ? "/dashboard" : "/login"}>
              <Button size="lg" className="gap-2">
                {user ? "进入机会大厅" : "开始使用"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/data-sources">
              <Button size="lg" variant="outline">
                查看数据来源说明
              </Button>
            </Link>
          </div>
        </section>

        <section className="mt-16 grid gap-4 md:grid-cols-4">
          <StatCard value="1" label="稳定公共读模型" />
          <StatCard value="4" label="公开合规页面" />
          <StatCard value="3" label="核心判断问题" />
          <StatCard value="24h" label="建议更新节奏" />
        </section>

        <section className="mt-16 grid gap-6 md:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <Card key={title} className="border-border/60 shadow-sm">
              <CardContent className="flex gap-4 p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg font-medium">{title}</h2>
                  <p className="text-sm leading-6 text-muted-foreground">{description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="mt-16 rounded-3xl border border-border/60 bg-card p-8 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">上线前最重要的不是再加功能</h2>
              <p className="text-sm leading-7 text-muted-foreground">
                真正重要的是让用户在 10 秒内回答三个问题：这条机会和我有没有关系、什么时候截止、下一步该做什么。现在整个产品都在围绕这个目标收束。
              </p>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-3">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>前台优先消费 public_program_cards，而不是拼接原始层数据。</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>项目卡默认展示截止时间、来源状态、核验状态和下一步行动。</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>隐私政策、用户协议、数据来源说明和反馈入口已作为公开页面接入。</span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-border/60 bg-muted/40 p-6">
              <p className="text-sm font-medium text-foreground">公开入口</p>
              <div className="mt-4 grid gap-3">
                <Link href="/privacy">
                  <Button variant="outline" className="w-full justify-start">
                    隐私政策
                  </Button>
                </Link>
                <Link href="/terms">
                  <Button variant="outline" className="w-full justify-start">
                    用户协议
                  </Button>
                </Link>
                <Link href="/data-sources">
                  <Button variant="outline" className="w-full justify-start">
                    数据来源说明
                  </Button>
                </Link>
                <Link href="/feedback">
                  <Button variant="outline" className="w-full justify-start">
                    反馈与联系
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-3xl border border-border/60 bg-card p-6 text-center shadow-sm">
      <div className="text-3xl font-semibold text-foreground">{value}</div>
      <div className="mt-2 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}
