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

const COMPARE_FIELDS = [
  { key: "tier", label: "院校层次", icon: GraduationCap },
  { key: "programName", label: "专业方向", icon: BookOpen },
  { key: "degreeType", label: "学位类型", icon: FileText },
  { key: "year", label: "学制", icon: Clock },
  { key: "applicationPeriod", label: "申请时间", icon: Calendar },
  { key: "deadline", label: "截止时间", icon: Calendar },
  { key: "examForm", label: "考核形式", icon: FileText },
  { key: "englishRequirement", label: "英语要求", icon: Languages },
] as const;

const EMPTY_VALUE_LABELS = new Set(["未注明", "待补充", "待确认"]);

export default function Compare() {
  const [, setLocation] = useLocation();
  const { compareList, removeFromCompare, clearCompare } = useCompare();

  const isEmpty = compareList.length === 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setLocation("/dashboard")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">院校对比</h1>
                <p className="text-sm text-muted-foreground">已选择 {compareList.length}/4 所院校</p>
              </div>
            </div>
            {!isEmpty && (
              <Button variant="outline" onClick={clearCompare} className="text-destructive hover:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                清空列表
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-7xl px-4 py-8">
        <AnimatePresence mode="wait">
          {isEmpty ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted/50">
                <GraduationCap className="h-12 w-12 text-muted-foreground/50" />
              </div>
              <h2 className="mb-2 text-xl font-semibold">对比列表为空</h2>
              <p className="mb-6 max-w-md text-center text-muted-foreground">
                请先在首页选择项目加入对比列表，最多可同时对比 4 所院校。
              </p>
              <Button onClick={() => setLocation("/dashboard")}>
                <Plus className="mr-2 h-4 w-4" />
                添加院校
              </Button>
            </motion.div>
          ) : (
            <motion.div key="table" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <ScrollArea className="w-full">
                <div className="min-w-[800px]">
                  <div className="mb-6 grid grid-cols-[200px_repeat(4,1fr)] gap-4">
                    <div className="rounded-lg bg-muted/30 p-4">
                      <span className="font-semibold text-muted-foreground">对比项</span>
                    </div>
                    {compareList.map((uni) => (
                      <Card key={uni.stableId} className="group relative overflow-hidden">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1">
                              <CardTitle className="truncate text-lg">{cleanUserInput(uni.institutionName)}</CardTitle>
                              <Badge className={`${getTierBadgeClassName(uni.tier)} mt-2`}>
                                {getSimplifiedTier(uni.tier)}
                              </Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                              onClick={() => removeFromCompare(uni.stableId)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {(uni.sourceUrl || uni.url) && (
                            <a
                              href={cleanUserInput(uni.sourceUrl || uni.url || "")}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" />
                              查看通知
                            </a>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                    {Array.from({ length: 4 - compareList.length }).map((_, index) => (
                      <Card
                        key={`empty-${index}`}
                        className="cursor-pointer border-dashed bg-muted/10 transition-colors hover:bg-muted/20"
                        onClick={() => setLocation("/")}
                      >
                        <CardContent className="flex h-full flex-col items-center justify-center py-8 text-muted-foreground">
                          <Plus className="mb-2 h-8 w-8" />
                          <span className="text-sm">添加院校</span>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="space-y-2">
                    {COMPARE_FIELDS.map((field) => (
                      <div key={field.key} className="grid grid-cols-[200px_repeat(4,1fr)] gap-4">
                        <div className="flex items-center gap-2 rounded-lg bg-muted/30 p-4">
                          <field.icon className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">{field.label}</span>
                        </div>
                        {compareList.map((uni) => {
                          let value: string;
                          if (field.key === "tier") {
                            value = getSimplifiedTier(uni.tier);
                          } else if (field.key === "year") {
                            value = uni.year ? `${uni.year}年` : "未注明";
                          } else {
                            value = uni[field.key as keyof typeof uni]?.toString() || "未注明";
                          }

                          return (
                            <div key={uni.stableId} className="rounded-lg border bg-card p-4 text-sm">
                              {field.key === "tier" ? (
                                <Badge className={getTierBadgeClassName(uni.tier)}>{value}</Badge>
                              ) : (
                                <span className={EMPTY_VALUE_LABELS.has(value) ? "italic text-muted-foreground" : ""}>
                                  {cleanUserInput(value)}
                                </span>
                              )}
                            </div>
                          );
                        })}
                        {Array.from({ length: 4 - compareList.length }).map((_, index) => (
                          <div key={`empty-${index}`} className="rounded-lg border border-dashed bg-muted/10 p-4" />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>

              <div className="mt-8 rounded-lg bg-muted/30 p-4 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <span className="text-primary">提示：</span>
                  数据仅供参考，请以院校官方通知为准。标记为“未注明”的字段表示原始通知中未明确说明。
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
