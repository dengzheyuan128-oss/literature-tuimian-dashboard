import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  BarChart2,
  Bell,
  BookOpen,
  Calendar,
  ExternalLink,
  Filter,
  GraduationCap,
  Heart,
  HeartOff,
  Link2,
  Sparkles,
} from "lucide-react";

import type { DataStatus } from "@/types/university";
import type { PublicProgramCard } from "@/types/publicProgramCard";
import { mapPublicProgramCardToUniversity, usePublicProgramCards } from "@/lib/publicProgramCards";
import { favoritesStorage, searchHistoryStorage } from "@/lib/storage";
import { cleanUserInput } from "@/lib/security";
import { getDeadlinePresentation } from "@/lib/publicCardPresentation";
import { buildResultsSummary } from "@/lib/statsDisplay";
import { HOME_HERO_CONTENT } from "@/lib/homeHeroContent";
import { useCompare } from "@/contexts/CompareContext";
import { useReminders } from "@/contexts/ReminderContext";
import { SIMPLIFIED_TIERS, getTierBadgeClassName, getTierConfig, type SimplifiedTier } from "@/lib/tierUtils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import SearchCommand from "@/components/SearchCommand";
import FeedbackDialog from "@/components/FeedbackDialog";
import UserMenu from "@/components/UserMenu";
import { useAuth } from "@/contexts/AuthContext";
import { isAdmin } from "@/lib/adminUtils";

const STATUS_CONFIG: Record<DataStatus, { label: string; description: string; className: string }> = {
  COMPLETE: {
    label: "信息较全",
    description: "关键字段已基本齐全",
    className: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
  },
  PARTIAL: {
    label: "仍需核对",
    description: "已有主要信息，部分字段待确认",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
  },
  PENDING_MANUAL: {
    label: "待补字段",
    description: "原文存在，但关键展示字段尚未补齐",
    className: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
  },
};

const PAGE_SIZE = 24;

const GENERIC_VALUES = {
  specialty: ["汉语言文学、语言学等", "中国语言文学", "待确认", "待补充"],
  examForm: ["材料审核、复试", "面试、笔试", "待确认", "待补充", "综合面试"],
  englishRequirement: ["CET-6或同等", "CET-4或同等", "待确认", "待补充", "无硬性要求"],
};

function isGenericValue(field: keyof typeof GENERIC_VALUES, value: string) {
  return GENERIC_VALUES[field]?.includes(value) ?? false;
}

function displayValue(value: string, field: keyof typeof GENERIC_VALUES, dataVerified: boolean) {
  if (!dataVerified && isGenericValue(field, value)) {
    return "请查看通知原文";
  }
  return value;
}

function getDeadlineBadgeClassName(tone: "urgent" | "warning" | "normal" | "muted") {
  switch (tone) {
    case "urgent":
      return "bg-red-100 text-red-700 border-red-200";
    case "warning":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "normal":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

function parseDeadlineToReminderTimestamp(deadline: string) {
  const chinese = deadline.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  const iso = deadline.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  const match = chinese ?? iso;

  if (!match) {
    return Date.now() + 24 * 60 * 60 * 1000;
  }

  const target = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 9, 0, 0);
  target.setDate(target.getDate() - 7);
  return target.getTime() > Date.now() ? target.getTime() : Date.now() + 2 * 60 * 60 * 1000;
}

export default function Home() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { addToCompare, isInCompare } = useCompare();
  const { addReminder } = useReminders();
  const userIsAdmin = isAdmin(user?.email);

  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<SimplifiedTier | null>(null);
  const [selectedCard, setSelectedCard] = useState<PublicProgramCard | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  const { cards, coverageStats, loading, source, error, hasMore, totalCount, institutionCount } = usePublicProgramCards({
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  const selectedUniversity = selectedCard ? mapPublicProgramCardToUniversity(selectedCard) : null;
  const totalPages = typeof totalCount === "number" ? Math.max(1, Math.ceil(totalCount / PAGE_SIZE)) : null;

  useEffect(() => {
    const favs = favoritesStorage.getFavorites();
    setFavorites(favs.map((item) => String(item.universityId)));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [selectedLevel]);

  useEffect(() => {
    if (totalPages !== null && page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const filteredUniversities = useMemo(() => {
    const cleanTerm = cleanUserInput(searchTerm.trim().toLowerCase());
    return cards.filter((uni) => {
      const matchesSearch =
        cleanTerm === "" ||
        uni.institutionName.toLowerCase().includes(cleanTerm) ||
        uni.programName.toLowerCase().includes(cleanTerm) ||
        uni.institutionTags.some((tag) => tag.toLowerCase().includes(cleanTerm));

      const matchesLevel = selectedLevel ? uni.institutionTags.includes(selectedLevel) : true;
      return matchesSearch && matchesLevel;
    });
  }, [searchTerm, selectedLevel, cards]);

  const resultsSummary = buildResultsSummary({
    currentCount: filteredUniversities.length,
    totalCount,
    institutionCount,
  });

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (value.trim()) {
      searchHistoryStorage.addSearch(value.trim());
    }
  };

  const toggleFavorite = (university: PublicProgramCard, e: React.MouseEvent) => {
    e.stopPropagation();

    if (favorites.includes(String(university.stableId))) {
      favoritesStorage.removeFavorite(String(university.stableId));
      setFavorites((prev) => prev.filter((id) => id !== String(university.stableId)));
    } else {
      favoritesStorage.addFavorite({
        universityId: String(university.stableId),
        universityName: university.institutionName,
        tier: university.tier,
        specialty: university.programName,
      });
      setFavorites((prev) => [...prev, String(university.stableId)]);
    }
  };

  const handleAddToCompare = (university: PublicProgramCard, e: React.MouseEvent) => {
    e.stopPropagation();
    addToCompare(university);
  };

  const handleSetReminder = (university: PublicProgramCard) => {
    addReminder({
      universityId: String(university.stableId),
      universityName: university.institutionName,
      deadline: university.deadline,
      reminderDate: parseDeadlineToReminderTimestamp(university.deadline),
      active: true,
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-serif selection:bg-primary/20">
      <aside className="fixed left-0 top-0 hidden h-full w-16 flex-col items-center border-r border-sidebar-border bg-sidebar py-8 shadow-sm lg:flex md:w-20">
        <div className="mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground shadow-md">
            推
          </div>
        </div>
        <div className="flex flex-1 flex-col items-center gap-8">
          <div className="vertical-text cursor-pointer text-sm font-medium tracking-widest text-muted-foreground transition-colors hover:text-primary">
            推免资讯
          </div>
          <div className="vertical-text cursor-pointer text-sm font-medium tracking-widest text-muted-foreground transition-colors hover:text-primary" onClick={() => setLocation("/analytics")}>
            数据分析
          </div>
          <div className="vertical-text cursor-pointer text-sm font-medium tracking-widest text-muted-foreground transition-colors hover:text-primary" onClick={() => setLocation("/compare")}>
            院校对比
          </div>
          <div className="vertical-text cursor-pointer text-sm font-medium tracking-widest text-muted-foreground transition-colors hover:text-primary" onClick={() => setLocation("/reminders")}>
            申请提醒
          </div>
          {userIsAdmin ? (
            <div className="vertical-text cursor-pointer text-sm font-medium tracking-widest text-amber-600 transition-colors hover:text-amber-500" onClick={() => setLocation("/admin/extract")}>
              AI提取
            </div>
          ) : null}
          <div className="mt-auto vertical-text text-xs text-muted-foreground opacity-50">二零二五</div>
        </div>
      </aside>

      <div className="fixed right-4 top-4 z-50 lg:right-8">
        <UserMenu />
      </div>

      <main className="min-h-screen lg:pl-20">
        <header className="relative overflow-hidden px-6 py-16 md:px-12 md:py-24">
          <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 translate-x-1/3 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-96 w-96 -translate-x-1/2 translate-y-1/3 rounded-full bg-accent/5 blur-3xl" />

          <div className="container relative z-10 mx-auto max-w-5xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} className="text-center md:text-left">
              <div className="mb-4 inline-block rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs tracking-widest text-primary">
                {HOME_HERO_CONTENT.badge}
              </div>
              <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-foreground md:text-6xl">
                {HOME_HERO_CONTENT.title}
              </h1>
              <p className="mb-10 max-w-2xl text-lg font-light leading-relaxed text-muted-foreground md:text-xl">
                {HOME_HERO_CONTENT.description}
              </p>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-8 flex flex-wrap gap-4">
                <Button onClick={() => setLocation(HOME_HERO_CONTENT.primaryCta.href)} className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-primary/80 px-6 py-2 text-primary-foreground transition-all hover:shadow-lg">
                  <Sparkles className="h-4 w-4" />
                  {HOME_HERO_CONTENT.primaryCta.label}
                </Button>
                <Button onClick={() => setLocation(HOME_HERO_CONTENT.secondaryCtas[0].href)} variant="outline" className="flex items-center gap-2 rounded-lg px-6 py-2">
                  <BarChart2 className="h-4 w-4" />
                  {HOME_HERO_CONTENT.secondaryCtas[0].label}
                </Button>
                <Button onClick={() => setLocation(HOME_HERO_CONTENT.secondaryCtas[1].href)} variant="outline" className="flex items-center gap-2 rounded-lg px-6 py-2">
                  <Bell className="h-4 w-4" />
                  {HOME_HERO_CONTENT.secondaryCtas[1].label}
                </Button>
              </motion.div>

              <div className="flex max-w-2xl flex-col gap-4 md:flex-row">
                <div className="flex-1">
                  <SearchCommand onSelect={(uni) => setSelectedCard(uni)} />
                </div>
                <div className="no-scrollbar flex gap-2 overflow-x-auto pb-2 md:pb-0">
                  <Button
                    variant={selectedLevel === null ? "default" : "outline"}
                    onClick={() => setSelectedLevel(null)}
                    className={`h-12 rounded-lg px-6 transition-all ${selectedLevel === null ? "bg-primary text-primary-foreground shadow-md" : "bg-card/50 hover:bg-card"}`}
                  >
                    全部
                  </Button>
                  {SIMPLIFIED_TIERS.map((level) => {
                    const config = getTierConfig(level);
                    const isSelected = selectedLevel === level;
                    return (
                      <Button
                        key={level}
                        variant={isSelected ? "default" : "outline"}
                        onClick={() => setSelectedLevel(level === selectedLevel ? null : level)}
                        className={`h-12 whitespace-nowrap rounded-lg px-6 transition-all ${isSelected ? `${config.bgColor} ${config.color} border ${config.borderColor} shadow-md` : `bg-card/50 hover:${config.bgColor} hover:${config.color}`}`}
                      >
                        {config.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        </header>

        <section className="bg-gradient-to-b from-transparent to-muted/30 px-4 pb-16 md:px-12">
          <div className="container mx-auto max-w-6xl">
            <div className="mb-4 flex items-end justify-between border-b border-border/40 pb-4">
              <h2 className="flex items-center gap-2 text-2xl font-bold">
                <BookOpen className="h-6 w-6 text-primary" />
                <span>院校名录</span>
                <span className="ml-2 text-sm font-normal text-muted-foreground">{resultsSummary}</span>
              </h2>
              <div className="flex items-center gap-2">
                <FeedbackDialog />
                <div className="hidden items-center gap-2 text-sm text-muted-foreground md:flex">
                  <Filter className="h-4 w-4" />
                  <span>支持搜索与筛选</span>
                </div>
              </div>
            </div>

            <div className="mb-8 rounded-lg border border-border/30 bg-muted/30 p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex gap-6 text-sm">
                  <span className="flex items-center gap-1.5" title={STATUS_CONFIG.COMPLETE.description}>
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    信息较全 <strong>{coverageStats.complete}</strong>
                  </span>
                  <span className="flex items-center gap-1.5" title={STATUS_CONFIG.PARTIAL.description}>
                    <span className="h-2 w-2 rounded-full bg-yellow-500" />
                    仍需核对 <strong>{coverageStats.partial}</strong>
                  </span>
                  <span className="flex items-center gap-1.5" title={STATUS_CONFIG.PENDING_MANUAL.description}>
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    待补字段 <strong>{coverageStats.pendingManual}</strong>
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  当前页覆盖率: <strong className="text-foreground">{coverageStats.completeRate}%</strong>
                </div>
              </div>
            </div>

            {source === "supabase-error" ? (
              <Card className="mb-8 border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30">
                <CardContent className="flex items-start gap-3 p-4 text-sm text-red-700 dark:text-red-300">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-medium">当前读模型加载失败</p>
                    <p className="mt-1">{error || "当前数据暂时不可用，请稍后重试或联系管理员检查数据发布状态。"}</p>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence>
                {filteredUniversities.map((uni, index) => (
                  <motion.div key={uni.stableId} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02 }}>
                    <Card className="group h-full cursor-pointer overflow-hidden border-primary/10 bg-card/70 backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-lg" onClick={() => setSelectedCard(uni)}>
                      <CardHeader className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <CardTitle className="text-xl leading-tight">{cleanUserInput(uni.institutionName)}</CardTitle>
                            <CardDescription className="mt-1 line-clamp-2">{cleanUserInput(uni.programName)}</CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={(event) => toggleFavorite(uni, event)}>
                              {favorites.includes(String(uni.stableId)) ? <Heart className="h-5 w-5 fill-current text-red-500" /> : <HeartOff className="h-5 w-5" />}
                            </Button>
                            <Button variant="ghost" size="icon" onClick={(event) => handleAddToCompare(uni, event)} title="加入对比" disabled={isInCompare(uni.stableId)}>
                              <BarChart2 className="h-5 w-5" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {uni.institutionTags.map((tag) => (
                            <Badge key={`${uni.stableId}-${tag}`} className={getTierBadgeClassName(tag)}>{tag}</Badge>
                          ))}
                          <Badge className={`border-0 ${STATUS_CONFIG[uni.dataStatus].className}`}>{STATUS_CONFIG[uni.dataStatus].label}</Badge>
                          {uni.noticeType ? <Badge variant="outline">{uni.noticeType}</Badge> : null}
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3 pb-3">
                        <div className="flex items-center justify-between gap-3 rounded-lg border border-border/40 bg-muted/30 px-3 py-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <Calendar className="h-4 w-4 shrink-0 text-primary/70" />
                            <span className="truncate text-sm text-foreground">{cleanUserInput(uni.deadline) || "截止时间待确认"}</span>
                          </div>
                          <Badge variant="outline" className={getDeadlineBadgeClassName(getDeadlinePresentation(uni.deadline).tone)}>
                            {getDeadlinePresentation(uni.deadline).label}
                          </Badge>
                        </div>

                        <div className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-primary/60" />
                          <span className="line-clamp-1">{uni.url ? "官方来源可查看" : "官方来源待补充"}</span>
                        </div>

                        <div className="flex items-start gap-2 text-sm text-muted-foreground">
                          <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-primary/60" />
                          <span className="line-clamp-2">
                            {cleanUserInput(uni.examForm) || cleanUserInput(uni.englishRequirement) || "请查看原文确认考核与材料要求"}
                          </span>
                        </div>
                      </CardContent>

                      <CardFooter className="flex items-center justify-between gap-3 border-t border-border/30 pt-3 text-xs text-muted-foreground">
                        <div className="flex min-w-0 items-center gap-2">
                          <span>{cleanUserInput(uni.degreeType)}</span>
                          <span>·</span>
                          <span>{uni.url ? "可查看原文" : "待补链接"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {uni.url ? (
                            <a
                              href={cleanUserInput(uni.url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(event) => event.stopPropagation()}
                              className="inline-flex items-center gap-1 text-primary hover:underline"
                            >
                              查看原文
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          ) : null}
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={(event) => { event.stopPropagation(); handleSetReminder(uni); }}>
                            <Bell className="mr-1 h-3.5 w-3.5" />
                            提醒我
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {!loading && source !== "supabase-error" && filteredUniversities.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground">
                <div className="mb-4 text-6xl opacity-20">⌕</div>
                <p className="text-lg">未找到符合条件的院校</p>
                <Button variant="link" onClick={() => { setSearchTerm(""); setSelectedLevel(null); }} className="mt-2 text-primary">
                  清除筛选条件
                </Button>
              </div>
            ) : null}

            {!loading && source !== "supabase-error" && filteredUniversities.length > 0 ? (
              <div className="mt-8 flex flex-col gap-4 border-t border-border/30 pt-6 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-muted-foreground">第 {page} / {totalPages} 页，每页 {PAGE_SIZE} 条</div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="text-sm text-muted-foreground" htmlFor="page-jump">跳转到</label>
                  <Input
                    id="page-jump"
                    type="number"
                    min={1}
                    max={totalPages ?? undefined}
                    value={page}
                    onChange={(event) => {
                      const nextPage = Number(event.target.value);
                      if (!Number.isNaN(nextPage)) {
                        setPage(totalPages !== null ? Math.min(totalPages, Math.max(1, nextPage)) : Math.max(1, nextPage));
                      }
                    }}
                    className="h-9 w-24"
                  />
                  <Button variant="outline" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1}>
                    上一页
                  </Button>
                  <Button variant="outline" onClick={() => setPage((current) => current + 1)} disabled={!hasMore || (totalPages !== null && page >= totalPages)}>
                    下一页
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </main>

      <AnimatePresence>
        {selectedUniversity ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setSelectedCard(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
              <div className="flex items-start justify-between border-b border-border/40 p-6">
                <div className="flex-1">
                  <h2 className="mb-2 text-3xl font-bold">{cleanUserInput(selectedUniversity.name)}</h2>
                  <div className="flex flex-wrap gap-2">
                    {selectedCard?.institutionTags.map((tag) => (
                      <Badge key={`detail-${tag}`} className={getTierBadgeClassName(tag)}>{tag}</Badge>
                    ))}
                    <Badge className="border-0 bg-primary/20 text-primary">{cleanUserInput(selectedUniversity.degreeType)}</Badge>
                    {selectedUniversity.noticeType ? <Badge className="border-0 bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">{selectedUniversity.noticeType}</Badge> : null}
                    <Badge className={`border-0 ${STATUS_CONFIG[selectedUniversity.dataStatus].className}`}>{STATUS_CONFIG[selectedUniversity.dataStatus].label}</Badge>
                  </div>
                </div>
                <button onClick={() => setSelectedCard(null)} className="ml-4 text-muted-foreground transition-colors hover:text-foreground">×</button>
              </div>

              <ScrollArea className="flex-1 overflow-y-auto">
                <div className="space-y-6 p-6">
                  {!selectedUniversity.dataVerified ? (
                    <div className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-900/20">
                      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-orange-600 dark:text-orange-400" />
                      <div className="text-sm text-orange-800 dark:text-orange-200">
                        <p className="mb-1 font-medium">数据待核实</p>
                        <p className="text-orange-600 dark:text-orange-300">以下部分信息为参考数据，建议同时查看高校官方通知原文确认。</p>
                      </div>
                    </div>
                  ) : null}

                  <div>
                    <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                      <BookOpen className="h-5 w-5 text-primary" />
                      专业方向
                    </h3>
                    <p className={`text-base ${!selectedUniversity.dataVerified && isGenericValue("specialty", selectedUniversity.specialty) ? "italic text-orange-600 dark:text-orange-400" : "text-muted-foreground"}`}>
                      {displayValue(cleanUserInput(selectedUniversity.specialty), "specialty", selectedUniversity.dataVerified)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="mb-2 text-sm font-semibold text-muted-foreground">学制</h3>
                      <p className="text-base">{cleanUserInput(selectedUniversity.duration || "待补充")}</p>
                    </div>
                    <div>
                      <h3 className="mb-2 text-sm font-semibold text-muted-foreground">考核形式</h3>
                      <p className={`text-base ${!selectedUniversity.dataVerified && isGenericValue("examForm", selectedUniversity.examForm) ? "italic text-orange-600 dark:text-orange-400" : ""}`}>
                        {displayValue(cleanUserInput(selectedUniversity.examForm), "examForm", selectedUniversity.dataVerified)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-muted-foreground">英语要求</h3>
                    <p className={`text-base ${!selectedUniversity.dataVerified && isGenericValue("englishRequirement", selectedUniversity.englishRequirement) ? "italic text-orange-600 dark:text-orange-400" : ""}`}>
                      {displayValue(cleanUserInput(selectedUniversity.englishRequirement), "englishRequirement", selectedUniversity.dataVerified)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="mb-2 text-sm font-semibold text-muted-foreground">申请期间</h3>
                      <p className="text-base">{cleanUserInput(selectedUniversity.applicationPeriod)}</p>
                    </div>
                    <div>
                      <h3 className="mb-2 text-sm font-semibold text-muted-foreground">截止时间</h3>
                      <p className="text-base font-semibold text-primary">{cleanUserInput(selectedUniversity.deadline)}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 border-t border-border/40 pt-4">
                    <Button onClick={() => setLocation(`/notice/${selectedUniversity.sourceCardId ?? selectedUniversity.id}`)}>
                      <BookOpen className="mr-2 h-4 w-4" />
                      查看通知详情
                    </Button>
                    {selectedUniversity.url ? (
                      <a href={cleanUserInput(selectedUniversity.url)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
                        <ExternalLink className="h-4 w-4" />
                        官方原文
                      </a>
                    ) : null}
                    <Button onClick={() => selectedCard && handleSetReminder(selectedCard)} variant="outline">
                      <Bell className="mr-2 h-4 w-4" />
                      设置提醒
                    </Button>
                    <Button onClick={(event) => selectedCard && toggleFavorite(selectedCard, event as unknown as React.MouseEvent)} variant="outline">
                      {selectedCard && favorites.includes(String(selectedCard.stableId)) ? (
                        <>
                          <Heart className="mr-2 h-4 w-4 fill-current text-red-500" />
                          已收藏
                        </>
                      ) : (
                        <>
                          <HeartOff className="mr-2 h-4 w-4" />
                          收藏
                        </>
                      )}
                    </Button>
                    <Button onClick={(event) => selectedCard && handleAddToCompare(selectedCard, event as unknown as React.MouseEvent)} variant="outline">
                      <BarChart2 className="mr-2 h-4 w-4" />
                      加入对比
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
