/**
 * 落地页/介绍页
 * 展示平台功能和特色，引导用户登录
 */

import { Link } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  BookOpen,
  Search,
  Bell,
  BarChart3,
  Scale,
  Users,
  CheckCircle,
  ArrowRight,
  GraduationCap,
  Building2,
  Calendar,
} from 'lucide-react';

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* 导航栏 */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            <span className="font-bold text-lg">钝学推免指南</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition">
              功能特色
            </a>
            <a href="#stats" className="text-sm text-muted-foreground hover:text-foreground transition">
              数据概览
            </a>
            <a href="#about" className="text-sm text-muted-foreground hover:text-foreground transition">
              关于我们
            </a>
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <Link href="/dashboard">
                <Button>进入平台</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">登录</Button>
                </Link>
                <Link href="/login">
                  <Button>免费注册</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero 区域 */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm mb-6">
            <GraduationCap className="w-4 h-4" />
            <span>2026年推免信息持续更新中</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            985/211 高校
            <br />
            <span className="text-primary">中国语言文学</span>
            <br />
            推免信息平台
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            汇聚 62 所顶尖高校的夏令营与预推免通知，智能匹配、对比分析、申请提醒，
            助你高效规划保研之路。
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href={user ? "/dashboard" : "/login"}>
              <Button size="lg" className="gap-2">
                {user ? "进入平台" : "立即开始"}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline">
                了解更多
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* 数据统计 */}
      <section id="stats" className="border-y bg-muted/30">
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">62</div>
              <div className="text-muted-foreground">收录院校</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">130+</div>
              <div className="text-muted-foreground">推免通知</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">100%</div>
              <div className="text-muted-foreground">数据健康度</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">24h</div>
              <div className="text-muted-foreground">更新频率</div>
            </div>
          </div>
        </div>
      </section>

      {/* 功能特色 */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">核心功能</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            从信息搜集到申请管理，一站式解决推免信息焦虑
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Search className="w-6 h-6" />}
            title="智能搜索"
            description="按院校、专业、地区快速筛选，支持多维度组合查询"
          />
          <FeatureCard
            icon={<Scale className="w-6 h-6" />}
            title="院校对比"
            description="最多4所院校并排对比，申请条件、考核形式一目了然"
          />
          <FeatureCard
            icon={<Bell className="w-6 h-6" />}
            title="申请提醒"
            description="设置截止日期提醒，再也不会错过重要时间节点"
          />
          <FeatureCard
            icon={<BarChart3 className="w-6 h-6" />}
            title="数据分析"
            description="院校层级分布、申请难度分析，科学定位目标院校"
          />
          <FeatureCard
            icon={<Users className="w-6 h-6" />}
            title="智能匹配"
            description="输入你的背景条件，AI 推荐最适合的目标院校"
          />
          <FeatureCard
            icon={<CheckCircle className="w-6 h-6" />}
            title="数据可靠"
            description="链接直达官方通知，人工核验确保信息准确"
          />
        </div>
      </section>

      {/* 院校层级说明 */}
      <section className="border-y bg-muted/30">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">收录院校</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              基于教育部第四轮学科评估，覆盖中国语言文学学科各层级优秀院校
            </p>
          </div>
          <div className="grid md:grid-cols-5 gap-4">
            <TierCard tier="985" count={26} color="bg-red-500" />
            <TierCard tier="211" count={35} color="bg-orange-500" />
            <TierCard tier="双一流" count={2} color="bg-blue-500" />
            <TierCard tier="四非" count={5} color="bg-green-500" />
            <TierCard tier="省属重点师范" count={13} color="bg-purple-500" />
          </div>
        </div>
      </section>

      {/* 关于我们 */}
      <section id="about" className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">关于钝学推免指南</h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            「钝学」取自「钝学累功」之意，意在鼓励脚踏实地、持之以恒的学习态度。
            我们深知推免信息搜集之繁琐，因此创建了这个平台，希望能帮助文学专业的同学们
            更高效地获取信息、规划申请，将更多精力投入到学术研究中。
          </p>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            平台数据均来自各高校官方网站，经人工核验后发布。如发现信息有误或遗漏，
            欢迎通过反馈功能告知我们，共同维护这份推免指南。
          </p>
          <Link href={user ? "/dashboard" : "/login"}>
            <Button size="lg" className="gap-2">
              开始使用
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* 页脚 */}
      <footer className="border-t">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <span className="font-semibold">钝学推免指南</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 钝学推免指南. 仅供学习参考，请以各高校官方通知为准。
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
          {icon}
        </div>
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </CardContent>
    </Card>
  );
}

function TierCard({ tier, count, color }: { tier: string; count: number; color: string }) {
  return (
    <Card className="text-center">
      <CardContent className="p-4">
        <div className={`w-3 h-3 rounded-full ${color} mx-auto mb-2`} />
        <div className="font-bold text-lg">{tier}</div>
        <div className="text-2xl font-bold text-primary">{count}</div>
        <div className="text-xs text-muted-foreground">所院校</div>
      </CardContent>
    </Card>
  );
}
