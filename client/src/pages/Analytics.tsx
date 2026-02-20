import { useMemo } from "react";
import { universities, getCoverageStats } from "@/lib/dataLoader";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  BarChart3,
  PieChart,
  Database,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  School,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  getSimplifiedTier,
  TIER_CONFIGS,
  SimplifiedTier,
  SIMPLIFIED_TIERS,
} from "@/lib/tierUtils";

// 计算各层级院校数量
function getTierDistribution(): Map<SimplifiedTier, number> {
  const distribution = new Map<SimplifiedTier, number>();
  SIMPLIFIED_TIERS.forEach((tier) => distribution.set(tier, 0));

  universities.forEach((uni) => {
    const tier = getSimplifiedTier(uni.tier);
    distribution.set(tier, (distribution.get(tier) || 0) + 1);
  });

  return distribution;
}

// 简单的饼图组件
function SimplePieChart({
  data,
}: {
  data: { label: string; value: number; color: string }[];
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;

  const slices = data.map((item) => {
    const angle = (item.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    // 计算SVG弧形路径
    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;
    const largeArc = angle > 180 ? 1 : 0;

    const x1 = 100 + 80 * Math.cos(startRad);
    const y1 = 100 + 80 * Math.sin(startRad);
    const x2 = 100 + 80 * Math.cos(endRad);
    const y2 = 100 + 80 * Math.sin(endRad);

    const pathData =
      item.value === total
        ? `M 100 20 A 80 80 0 1 1 99.99 20 Z` // 完整圆
        : `M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`;

    return {
      ...item,
      path: pathData,
      percentage: ((item.value / total) * 100).toFixed(1),
    };
  });

  return (
    <div className="flex flex-col md:flex-row items-center gap-8">
      {/* 饼图 */}
      <svg viewBox="0 0 200 200" className="w-48 h-48 shrink-0">
        {slices.map((slice, index) => (
          <motion.path
            key={slice.label}
            d={slice.path}
            fill={slice.color}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="hover:opacity-80 transition-opacity cursor-pointer"
          />
        ))}
        {/* 中心白色圆 */}
        <circle cx="100" cy="100" r="40" fill="white" className="dark:fill-gray-900" />
        <text
          x="100"
          y="95"
          textAnchor="middle"
          className="fill-foreground text-lg font-bold"
        >
          {total}
        </text>
        <text
          x="100"
          y="115"
          textAnchor="middle"
          className="fill-muted-foreground text-xs"
        >
          所院校
        </text>
      </svg>

      {/* 图例 */}
      <div className="flex flex-col gap-2 flex-1">
        {slices.map((slice, index) => (
          <motion.div
            key={slice.label}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + index * 0.05 }}
            className="flex items-center gap-3"
          >
            <div
              className="w-4 h-4 rounded shrink-0"
              style={{ backgroundColor: slice.color }}
            />
            <span className="flex-1 text-sm">{slice.label}</span>
            <span className="text-sm font-medium">{slice.value} 所</span>
            <span className="text-xs text-muted-foreground w-12 text-right">
              {slice.percentage}%
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function Analytics() {
  const [, setLocation] = useLocation();

  // 层级分布
  const tierDistribution = useMemo(() => getTierDistribution(), []);

  // 数据完整性统计
  const coverageStats = useMemo(() => getCoverageStats(), []);

  // 饼图数据
  const pieData = useMemo(() => {
    const colors: Record<SimplifiedTier, string> = {
      "985": "#ef4444",
      "211": "#f97316",
      "双一流": "#3b82f6",
      "四非": "#a855f7",
      "省属重点师范": "#22c55e",
      "其他": "#6b7280",
    };

    return SIMPLIFIED_TIERS.filter((tier) => (tierDistribution.get(tier) || 0) > 0).map(
      (tier) => ({
        label: tier,
        value: tierDistribution.get(tier) || 0,
        color: colors[tier],
      })
    );
  }, [tierDistribution]);

  // 数据质量指标
  const qualityMetrics = useMemo(() => {
    const total = universities.length;
    const verified = universities.filter((u) => u.dataVerified).length;
    const hasUrl = universities.filter((u) => u.url && u.url !== "").length;
    const hasDeadline = universities.filter(
      (u) => u.deadline && !["待补充", "待确认", "未注明"].includes(u.deadline)
    ).length;

    return {
      verified: { count: verified, rate: Math.round((verified / total) * 100) },
      hasUrl: { count: hasUrl, rate: Math.round((hasUrl / total) * 100) },
      hasDeadline: {
        count: hasDeadline,
        rate: Math.round((hasDeadline / total) * 100),
      },
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="container max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">数据分析</h1>
              <p className="text-sm text-muted-foreground">
                共收录 {universities.length} 所院校的推免信息
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-8">
        <div className="grid gap-6">
          {/* 概览卡片 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
            >
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <School className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{universities.length}</p>
                      <p className="text-xs text-muted-foreground">院校总数</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{coverageStats.complete}</p>
                      <p className="text-xs text-muted-foreground">数据完整</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{coverageStats.partial}</p>
                      <p className="text-xs text-muted-foreground">部分完整</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{coverageStats.pendingManual}</p>
                      <p className="text-xs text-muted-foreground">待补充</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* 层级分布 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-primary" />
                  院校层级分布
                </CardTitle>
                <CardDescription>
                  按院校层级分类统计
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SimplePieChart data={pieData} />
              </CardContent>
            </Card>
          </motion.div>

          {/* 数据质量指标 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-primary" />
                  数据质量指标
                </CardTitle>
                <CardDescription>
                  各项关键数据的完整性统计
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 数据覆盖率 */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">数据完整率</span>
                    <span className="text-sm text-muted-foreground">
                      {coverageStats.complete} / {coverageStats.total} (
                      {coverageStats.completeRate}%)
                    </span>
                  </div>
                  <Progress value={coverageStats.completeRate} className="h-2" />
                </div>

                {/* 已核实数据 */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">数据核实率</span>
                    <span className="text-sm text-muted-foreground">
                      {qualityMetrics.verified.count} / {universities.length} (
                      {qualityMetrics.verified.rate}%)
                    </span>
                  </div>
                  <Progress value={qualityMetrics.verified.rate} className="h-2" />
                </div>

                {/* 有效链接 */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">通知链接覆盖</span>
                    <span className="text-sm text-muted-foreground">
                      {qualityMetrics.hasUrl.count} / {universities.length} (
                      {qualityMetrics.hasUrl.rate}%)
                    </span>
                  </div>
                  <Progress value={qualityMetrics.hasUrl.rate} className="h-2" />
                </div>

                {/* 截止日期 */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">截止日期明确</span>
                    <span className="text-sm text-muted-foreground">
                      {qualityMetrics.hasDeadline.count} / {universities.length} (
                      {qualityMetrics.hasDeadline.rate}%)
                    </span>
                  </div>
                  <Progress value={qualityMetrics.hasDeadline.rate} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* 分类详情表格 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  分类统计详情
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {SIMPLIFIED_TIERS.map((tier, index) => {
                    const count = tierDistribution.get(tier) || 0;
                    const percentage = Math.round(
                      (count / universities.length) * 100
                    );
                    const config = TIER_CONFIGS[tier];

                    return (
                      <motion.div
                        key={tier}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + index * 0.05 }}
                        className="flex items-center gap-4"
                      >
                        <div
                          className={`w-24 text-center py-1 px-2 rounded text-sm font-medium ${config.bgColor} ${config.color}`}
                        >
                          {tier}
                        </div>
                        <div className="flex-1">
                          <div className="h-6 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full ${config.bgColor}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ delay: 0.8 + index * 0.05, duration: 0.5 }}
                            />
                          </div>
                        </div>
                        <div className="w-20 text-right">
                          <span className="font-medium">{count}</span>
                          <span className="text-muted-foreground text-sm ml-1">
                            ({percentage}%)
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* 底部说明 */}
          <div className="p-4 bg-muted/30 rounded-lg text-sm text-muted-foreground">
            <p>
              <span className="text-primary font-medium">数据说明：</span>
              本平台数据来源于各高校官方公开信息，数据更新存在一定滞后性。
              "数据完整"指该院校的专业、截止日期、考核形式等核心字段均已填写；
              "数据核实"指信息已与官方通知原文核对确认。
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
