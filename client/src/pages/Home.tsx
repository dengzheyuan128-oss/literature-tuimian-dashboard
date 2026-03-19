import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  AlertCircle,
  Bell,
  ExternalLink,
  GraduationCap,
  Heart,
  HeartOff,
  Search,
  Sparkles,
  X,
} from "lucide-react";

import { useCompare } from "@/contexts/CompareContext";
import { useReminders } from "@/contexts/ReminderContext";
import { cleanUserInput } from "@/lib/security";
import { favoritesStorage, searchHistoryStorage } from "@/lib/storage";
import { getDeadlinePresentation, getNextActionLabel } from "@/lib/publicCardPresentation";
import { usePublicProgramCards } from "@/lib/publicProgramCards";
import { SIMPLIFIED_TIERS, getTierBadgeClassName, getTierConfig, type SimplifiedTier } from "@/lib/tierUtils";
import type { PublicProgramCard } from "@/types/publicProgramCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const PAGE_SIZE = 12;

const AVAILABILITY_LABELS: Record<PublicProgramCard["availabilityStatus"], string> = {
  current: "当前可用",
  needs_review: "待核对",
  expired: "历史通知",
  unknown: "状态待确认",
};

const VERIFICATION_LABELS: Record<PublicProgramCard["verificationStatus"], string> = {
  verified: "已核验",
  needs_review: "待核验",
  unknown: "待确认",
};

function getAvailabilityClassName(status: PublicProgramCard["availabilityStatus"]) {
  switch (status) {
    case "current":
      return "border-emerald-200 bg-emerald-100 text-emerald-700";
    case "needs_review":
      return "border-amber-200 bg-amber-100 text-amber-700";
    case "expired":
      return "border-slate-200 bg-slate-100 text-slate-700";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

function getVerificationClassName(status: PublicProgramCard["verificationStatus"]) {
  switch (status) {
    case "verified":
      return "border-emerald-200 bg-emerald-100 text-emerald-700";
    case "needs_review":
      return "border-amber-200 bg-amber-100 text-amber-700";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

function getDeadlineClassName(tone: "urgent" | "warning" | "normal" | "muted") {
  switch (tone) {
    case "urgent":
      return "border-red-200 bg-red-100 text-red-700";
    case "warning":
      return "border-amber-200 bg-amber-100 text-amber-700";
    case "normal":
      return "border-emerald-200 bg-emerald-100 text-emerald-700";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

function formatDateTime(value?: string | null) {
  if (!value) return "暂无记录";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getReminderTimestamp(deadline: string) {
  const parsed = deadline.match(/(\d{4})[-/年](\d{1,2})[-/月](\d{1,2})/);
  if (!parsed) return Date.now() + 24 * 60 * 60 * 1000;
  const reminder = new Date(Number(parsed[1]), Number(parsed[2]) - 1, Number(parsed[3]));
  reminder.setDate(reminder.getDate() - 1);
  return reminder.getTime() <= Date.now() ? Date.now() + 2 * 60 * 60 * 1000 : reminder.getTime();
}

function buildSearchText(card: PublicProgramCard) {
  return cleanUserInput(
    [
      card.institutionName,
      card.programName,
      card.departmentName ?? "",
      card.eligibilitySummary ?? "",
      card.tier,
      card.noticeType ?? "",
      card.applicationStage ?? "",
      card.deadline,
      card.sourceUrl,
      card.availabilityStatus,
      card.verificationStatus,
    ]
      .join(" ")
      .toLowerCase(),
  );
}

function getSavedFavoriteIds() {
  return favoritesStorage.getFavorites().map((item) => item.universityId);
}

export default function Home() {
  const [, setLocation] = useLocation();
  const { addToCompare, isInCompare } = useCompare();
  const { addReminder, getReminder, toggleReminder } = useReminders();

  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<SimplifiedTier | null>(null);
  const [selectedCard, setSelectedCard] = useState<PublicProgramCard | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  const { cards, coverageStats, loading, source, error, hasMore, totalCount, institutionCount, configured } =
    usePublicProgramCards({ enabled: true, limit: 400 });

  useEffect(() => {
    setFavorites(getSavedFavoriteIds());
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedLevel]);

  useEffect(() => {
    if (selectedCard && !cards.some((card) => card.stableId === selectedCard.stableId)) {
      setSelectedCard(null);
    }
  }, [cards, selectedCard]);

  const filteredCards = useMemo(() => {
    const query = cleanUserInput(searchTerm.trim().toLowerCase());
    const toneRank: Record<ReturnType<typeof getDeadlinePresentation>["tone"], number> = {
      urgent: 0,
      warning: 1,
      normal: 2,
      muted: 3,
    };

    return [...cards]
      .filter((card) => !selectedLevel || card.institutionTags.includes(selectedLevel))
      .filter((card) => !query || buildSearchText(card).includes(query))
      .sort((left, right) => {
        const leftDeadline = getDeadlinePresentation(left.deadline);
        const rightDeadline = getDeadlinePresentation(right.deadline);
        const deadlineDiff = toneRank[leftDeadline.tone] - toneRank[rightDeadline.tone];
        if (deadlineDiff !== 0) return deadlineDiff;

        const availabilityPriority =
          (left.availabilityStatus === "current" ? 0 : left.availabilityStatus === "needs_review" ? 1 : 2) -
          (right.availabilityStatus === "current" ? 0 : right.availabilityStatus === "needs_review" ? 1 : 2);
        if (availabilityPriority !== 0) return availabilityPriority;

        return left.institutionName.localeCompare(right.institutionName, "zh-Hans-CN");
      });
  }, [cards, searchTerm, selectedLevel]);

  const totalPages = Math.max(1, Math.ceil(filteredCards.length / PAGE_SIZE));
  const currentCards = filteredCards.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const urgentCount = filteredCards.filter((card) => getDeadlinePresentation(card.deadline).tone === "urgent").length;
  const verifiedCount = filteredCards.filter((card) => card.verificationStatus === "verified").length;
  const currentAvailableCount = filteredCards.filter((card) => card.availabilityStatus === "current").length;

  const sourceLabel = {
    api: "API 读模型",
    supabase: "Supabase 读模型",
    "archived-json": "本地归档兜底",
    "supabase-loading": "正在加载",
    "supabase-error": "读模型异常",
  }[source];

  const handleSearch = () => {
    const term = searchTerm.trim();
    if (term) searchHistoryStorage.addSearch(term);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedLevel(null);
    setPage(1);
  };

  const toggleFavorite = (card: PublicProgramCard) => {
    if (favorites.includes(card.stableId)) {
      favoritesStorage.removeFavorite(card.stableId);
    } else {
      favoritesStorage.addFavorite({
        universityId: card.stableId,
        universityName: card.institutionName,
        tier: card.tier,
        specialty: card.programName,
      });
    }

    setFavorites(getSavedFavoriteIds());
  };

  const toggleReminderForCard = (card: PublicProgramCard) => {
    const reminder = getReminder(card.stableId);
    if (reminder) {
      toggleReminder(reminder.id);
      return;
    }

    addReminder({
      universityId: card.stableId,
      universityName: card.institutionName,
      deadline: card.deadline,
      reminderDate: getReminderTimestamp(card.deadline),
      active: true,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
        <section className="grid gap-6 rounded-3xl border border-border/60 bg-card p-6 shadow-sm lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            <Badge className="inline-flex w-fit items-center gap-2 border-0 bg-primary/10 text-primary hover:bg-primary/10">
              <Sparkles className="h-3.5 w-3.5" />
              当前页面优先展示可判断的项目卡，而不是原始通知列表
            </Badge>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">先判断是否相关，再决定要不要行动</h1>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
                这里默认把学校、项目、截止时间、来源状态、核验状态和下一步动作放在最前面，帮助你更快筛掉无关机会。
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <MetricCard label="当前可用" value={currentAvailableCount} />
              <MetricCard label="3 天内截止" value={urgentCount} />
              <MetricCard label="已核验" value={verifiedCount} />
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={() => setLocation("/matcher")}>开始背景评估</Button>
              <Button variant="outline" onClick={() => setLocation("/compare")}>
                查看对比
              </Button>
              <Button variant="outline" onClick={() => setLocation("/reminders")}>
                查看提醒
              </Button>
            </div>
          </div>

          <div className="space-y-4 rounded-3xl border border-border/60 bg-muted/30 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium">当前数据状态</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {configured ? "前台已连接到 public_program_cards" : "当前使用本地兜底数据"}
                </p>
              </div>
              <Badge className="border-0 bg-primary/10 text-primary">{sourceLabel}</Badge>
            </div>

            {error ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{error}</p>
                </div>
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <MetricCard label="字段完整率" value={`${coverageStats.completeRate}%`} />
              <MetricCard label="当前项目数" value={totalCount ?? filteredCards.length} />
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{institutionCount ?? new Set(filteredCards.map((card) => card.institutionName)).size} 所高校</Badge>
              <Badge variant="outline">{hasMore ? "还有更多数据可拉取" : "已完成当前数据加载"}</Badge>
            </div>
          </div>
        </section>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-xl">机会大厅</CardTitle>
                <CardDescription className="mt-1">按学校、项目、截止时间和来源状态筛选当前机会。</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleSearch}>
                  记录搜索
                </Button>
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  清空筛选
                </Button>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleSearch();
                  }}
                  placeholder="输入学校、项目、项目类型或截止时间"
                  className="h-11 pl-10"
                />
              </div>
              <Button className="h-11" onClick={handleSearch}>
                搜索
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant={selectedLevel === null ? "default" : "outline"} size="sm" onClick={() => setSelectedLevel(null)}>
                全部
              </Button>
              {SIMPLIFIED_TIERS.map((tier) => {
                const config = getTierConfig(tier);
                const active = selectedLevel === tier;
                return (
                  <Button
                    key={tier}
                    variant={active ? "default" : "outline"}
                    size="sm"
                    className={active ? "" : getTierBadgeClassName(tier)}
                    onClick={() => setSelectedLevel(active ? null : tier)}
                  >
                    {config.label}
                  </Button>
                );
              })}
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading && currentCards.length === 0
            ? Array.from({ length: 6 }).map((_, index) => (
                <Card key={`skeleton-${index}`} className="border-border/60 shadow-sm">
                  <CardHeader className="space-y-3">
                    <div className="h-5 w-1/2 rounded bg-muted" />
                    <div className="h-4 w-3/4 rounded bg-muted" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="h-16 rounded-2xl bg-muted/70" />
                    <div className="h-12 rounded-2xl bg-muted/70" />
                  </CardContent>
                </Card>
              ))
            : currentCards.map((card) => {
                const deadline = getDeadlinePresentation(card.deadline);
                const reminder = getReminder(card.stableId);
                const isFavorite = favorites.includes(card.stableId);

                return (
                  <Card key={card.stableId} className="flex h-full flex-col border-border/60 shadow-sm">
                    <CardHeader className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <CardTitle className="text-lg">{card.institutionName}</CardTitle>
                          <CardDescription className="mt-1">{card.programName}</CardDescription>
                        </div>
                        <Badge variant="outline">{card.tier}</Badge>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge className={getDeadlineClassName(deadline.tone)}>{deadline.label}</Badge>
                        <Badge className={getAvailabilityClassName(card.availabilityStatus)}>
                          {AVAILABILITY_LABELS[card.availabilityStatus]}
                        </Badge>
                        <Badge className={getVerificationClassName(card.verificationStatus)}>
                          {VERIFICATION_LABELS[card.verificationStatus]}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
                        <p className="font-medium text-foreground">关键门槛</p>
                        <p className="mt-2 leading-6">{card.eligibilitySummary || "暂未抽取到明确门槛，请优先查看原始通知。"}</p>
                      </div>
                      <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
                        <p className="font-medium text-foreground">下一步动作</p>
                        <p className="mt-2 leading-6">{getNextActionLabel(card)}</p>
                      </div>
                    </CardContent>

                    <CardFooter className="mt-auto flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedCard(card)}>
                        查看详情
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => toggleFavorite(card)}>
                        {isFavorite ? <HeartOff className="mr-1 h-4 w-4" /> : <Heart className="mr-1 h-4 w-4" />}
                        {isFavorite ? "取消收藏" : "收藏"}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => addToCompare(card)} disabled={isInCompare(card.stableId)}>
                        加入对比
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => toggleReminderForCard(card)}>
                        <Bell className="mr-1 h-4 w-4" />
                        {reminder ? "关闭提醒" : "设提醒"}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            第 {page} / {totalPages} 页，共 {filteredCards.length} 条结果
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
              上一页
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
              下一页
            </Button>
          </div>
        </div>
      </div>

      {selectedCard ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-border bg-background p-6 shadow-xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">{selectedCard.institutionName}</h2>
                <p className="mt-1 text-muted-foreground">{selectedCard.programName}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedCard(null)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <DetailItem label="项目类型" value={selectedCard.noticeType || "待补充"} />
              <DetailItem label="阶段" value={selectedCard.applicationStage || "待补充"} />
              <DetailItem label="截止时间" value={selectedCard.deadline || "待确认"} />
              <DetailItem label="最近更新时间" value={formatDateTime(selectedCard.updatedAt)} />
              <DetailItem label="状态" value={AVAILABILITY_LABELS[selectedCard.availabilityStatus]} />
              <DetailItem label="核验" value={VERIFICATION_LABELS[selectedCard.verificationStatus]} />
            </div>

            <div className="mt-4 rounded-2xl border border-border/60 bg-muted/30 p-4">
              <p className="text-sm font-medium">关键门槛摘要</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {selectedCard.eligibilitySummary || "暂未抽取到明确门槛，请优先查看原始通知。"}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild disabled={!selectedCard.sourceUrl}>
                <a href={selectedCard.sourceUrl || "#"} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  查看官方原文
                </a>
              </Button>
              <Button variant="outline" onClick={() => toggleReminderForCard(selectedCard)}>
                <Bell className="mr-2 h-4 w-4" />
                {getReminder(selectedCard.stableId) ? "关闭提醒" : "设置提醒"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/40 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
