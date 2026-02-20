import { useCompare } from "@/contexts/CompareContext";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Trash2,
  ExternalLink,
  GraduationCap,
  Calendar,
  BookOpen,
  Clock,
  FileText,
  Languages,
  Plus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getSimplifiedTier, getTierBadgeClassName } from "@/lib/tierUtils";
import { cleanUserInput } from "@/lib/security";

// 对比项配置
const COMPARE_FIELDS = [
  { key: "tier", label: "院校层次", icon: GraduationCap },
  { key: "specialty", label: "专业方向", icon: BookOpen },
  { key: "degreeType", label: "学位类型", icon: FileText },
  { key: "duration", label: "学制", icon: Clock },
  { key: "applicationPeriod", label: "申请时间", icon: Calendar },
  { key: "deadline", label: "截止日期", icon: Calendar },
  { key: "examForm", label: "考核形式", icon: FileText },
  { key: "englishRequirement", label: "英语要求", icon: Languages },
] as const;

export default function Compare() {
  const [, setLocation] = useLocation();
  const { compareList, removeFromCompare, clearCompare } = useCompare();

  const isEmpty = compareList.length === 0;

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="container max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation("/")}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">院校对比</h1>
                <p className="text-sm text-muted-foreground">
                  已选择 {compareList.length}/4 所院校
                </p>
              </div>
            </div>
            {!isEmpty && (
              <Button
                variant="outline"
                onClick={clearCompare}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                清空列表
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {isEmpty ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mb-6">
                <GraduationCap className="w-12 h-12 text-muted-foreground/50" />
              </div>
              <h2 className="text-xl font-semibold mb-2">对比列表为空</h2>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                请在首页选择院校添加到对比列表，最多可同时对比4所院校
              </p>
              <Button onClick={() => setLocation("/")}>
                <Plus className="w-4 h-4 mr-2" />
                添加院校
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="table"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ScrollArea className="w-full">
                <div className="min-w-[800px]">
                  {/* 表头 - 院校名称 */}
                  <div className="grid grid-cols-[200px_repeat(4,1fr)] gap-4 mb-6">
                    <div className="p-4 rounded-lg bg-muted/30">
                      <span className="font-semibold text-muted-foreground">
                        对比项
                      </span>
                    </div>
                    {compareList.map((uni) => (
                      <Card
                        key={uni.id}
                        className="relative overflow-hidden group"
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-lg truncate">
                                {cleanUserInput(uni.name)}
                              </CardTitle>
                              <Badge
                                className={`${getTierBadgeClassName(uni.tier)} mt-2`}
                              >
                                {getSimplifiedTier(uni.tier)}
                              </Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeFromCompare(uni.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {uni.url && (
                            <a
                              href={cleanUserInput(uni.url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" />
                              查看通知
                            </a>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                    {/* 空位占位符 */}
                    {Array.from({ length: 4 - compareList.length }).map(
                      (_, i) => (
                        <Card
                          key={`empty-${i}`}
                          className="border-dashed bg-muted/10 cursor-pointer hover:bg-muted/20 transition-colors"
                          onClick={() => setLocation("/")}
                        >
                          <CardContent className="h-full flex flex-col items-center justify-center py-8 text-muted-foreground">
                            <Plus className="w-8 h-8 mb-2" />
                            <span className="text-sm">添加院校</span>
                          </CardContent>
                        </Card>
                      )
                    )}
                  </div>

                  {/* 对比内容 */}
                  <div className="space-y-2">
                    {COMPARE_FIELDS.map((field) => (
                      <div
                        key={field.key}
                        className="grid grid-cols-[200px_repeat(4,1fr)] gap-4"
                      >
                        {/* 字段标签 */}
                        <div className="p-4 rounded-lg bg-muted/30 flex items-center gap-2">
                          <field.icon className="w-4 h-4 text-primary" />
                          <span className="font-medium text-sm">
                            {field.label}
                          </span>
                        </div>
                        {/* 各院校数据 */}
                        {compareList.map((uni) => {
                          let value: string;
                          if (field.key === "tier") {
                            value = getSimplifiedTier(uni.tier);
                          } else {
                            value =
                              uni[field.key as keyof typeof uni]?.toString() ||
                              "未注明";
                          }
                          return (
                            <div
                              key={uni.id}
                              className="p-4 rounded-lg bg-card border text-sm"
                            >
                              {field.key === "tier" ? (
                                <Badge
                                  className={getTierBadgeClassName(uni.tier)}
                                >
                                  {value}
                                </Badge>
                              ) : (
                                <span
                                  className={
                                    value === "未注明" ||
                                    value === "待补充" ||
                                    value === "待确认"
                                      ? "text-muted-foreground italic"
                                      : ""
                                  }
                                >
                                  {cleanUserInput(value)}
                                </span>
                              )}
                            </div>
                          );
                        })}
                        {/* 空位 */}
                        {Array.from({ length: 4 - compareList.length }).map(
                          (_, i) => (
                            <div
                              key={`empty-${i}`}
                              className="p-4 rounded-lg bg-muted/10 border border-dashed"
                            />
                          )
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>

              {/* 底部提示 */}
              <div className="mt-8 p-4 bg-muted/30 rounded-lg text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <span className="text-primary">提示：</span>
                  数据仅供参考，请以各院校官方通知为准。部分信息显示"未注明"表示官方通知中未明确说明。
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
