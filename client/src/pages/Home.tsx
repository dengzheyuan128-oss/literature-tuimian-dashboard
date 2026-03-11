import { useState, useMemo, useEffect } from "react";
import { DataStatus } from "@/types/university";
import type { PublicProgramCard } from "@/types/publicProgramCard";
import { mapPublicProgramCardToUniversity, usePublicProgramCards } from "@/lib/publicProgramCards";
import { favoritesStorage, searchHistoryStorage } from "@/lib/storage";
import { cleanUserInput } from "@/lib/security";
import { getDeadlinePresentation, getNextActionLabel } from "@/lib/publicCardPresentation";
import { buildResultsSummary } from "@/lib/statsDisplay";
import { useCompare } from "@/contexts/CompareContext";
import { useReminders } from "@/contexts/ReminderContext";
import {
  SIMPLIFIED_TIERS,
  getTierBadgeClassName,
  getTierConfig,
  SimplifiedTier
} from "@/lib/tierUtils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import SearchCommand from "@/components/SearchCommand";
import {
  Search, BookOpen, GraduationCap, Calendar, ExternalLink,
  Filter, ChevronRight, Sparkles, AlertCircle, Heart, HeartOff,
  BarChart2, Bell, Star, Link2, Inbox
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import FeedbackDialog from "@/components/FeedbackDialog";
import UserMenu from "@/components/UserMenu";
import { useAuth } from "@/contexts/AuthContext";
import { isAdmin } from "@/lib/adminUtils";

// 通用占位值，用于提示用户优先查看原文
const GENERIC_VALUES = {
  specialty: ['汉语言文学、语言学等', '中国语言文学', '待确认', '待补充'],
  examForm: ['材料审核、复试', '面试、笔试', '待确认', '待补充', '综合面试'],
  englishRequirement: ['CET-6或同等', 'CET-4或同等', '待确认', '待补充', '无硬性要求'],
};

// 判断字段是否为通用占位值
function isGenericValue(field: keyof typeof GENERIC_VALUES, value: string): boolean {
  return GENERIC_VALUES[field]?.includes(value) ?? false;
}

// 未核实时，通用占位值统一引导回原文
function displayValue(value: string, field: keyof typeof GENERIC_VALUES, dataVerified: boolean): string {
  if (!dataVerified && isGenericValue(field, value)) {
    return '请查看通知原文';
  }
  return value;
}

// 数据状态标签配置
const STATUS_CONFIG: Record<DataStatus, { label: string; description: string; className: string }> = {
  COMPLETE: {
    label: '信息较全',
    description: '关键字段已基本齐全',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
  },
  PARTIAL: {
    label: '仍需核对',
    description: '已有主要信息，部分字段待确认',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
  },
  PENDING_MANUAL: {
    label: '待补字段',
    description: '原文存在，但关键展示字段还未补齐',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
  },
};

const PAGE_SIZE = 24;

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

export default function Home() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { addToCompare, isInCompare } = useCompare();
  const { addReminder } = useReminders();
  const [page, setPage] = useState(1);
  const { cards, coverageStats, loading, source, error, hasMore, totalCount, institutionCount } = usePublicProgramCards({
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });
  const userIsAdmin = isAdmin(user?.email);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<SimplifiedTier | null>(null);
  const [selectedCard, setSelectedCard] = useState<PublicProgramCard | null>(null);
  const [favorites, setFavorites] = useState<number[]>([]);
  const selectedUniversity = selectedCard ? mapPublicProgramCardToUniversity(selectedCard) : null;
  const totalEntries = totalCount;
  const totalPages = Math.max(1, Math.ceil((totalEntries ?? page * PAGE_SIZE) / PAGE_SIZE));
  const resultsSummary = buildResultsSummary({
    currentCount: filteredUniversities.length,
    totalCount,
    institutionCount,
  });

  useEffect(() => {
    setPage(1);
  }, [selectedLevel]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  // 加载收藏列表
  useState(() => {
    const favs = favoritesStorage.getFavorites();
    setFavorites(favs.map(f => parseInt(f.universityId, 10)).filter(id => !isNaN(id)));
  });

  // 过滤大学列表（使用简化分类）
  const filteredUniversities = useMemo(() => {
    const cleanTerm = cleanUserInput(searchTerm.trim().toLowerCase());
    return cards.filter((uni) => {
      const matchesSearch =
        cleanTerm === '' ||
        uni.institutionName.toLowerCase().includes(cleanTerm) ||
        uni.programName.toLowerCase().includes(cleanTerm) ||
        uni.institutionTags.some((tag) => tag.toLowerCase().includes(cleanTerm));

      // 使用院校多标签进行筛选
      const matchesLevel = selectedLevel
        ? uni.institutionTags.includes(selectedLevel)
        : true;

      return matchesSearch && matchesLevel;
    });
  }, [searchTerm, selectedLevel, cards]);

  // 使用简化的5种分类
  const levels = SIMPLIFIED_TIERS;

  // 处理搜索（添加历史记录）
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (value.trim()) {
      searchHistoryStorage.addSearch(value.trim());
    }
  };

  // 切换收藏
  const toggleFavorite = (university: PublicProgramCard, e: React.MouseEvent) => {
    e.stopPropagation(); // 防止触发卡片点击

    if (favorites.includes(university.stableId)) {
      favoritesStorage.removeFavorite(String(university.stableId));
      setFavorites(prev => prev.filter(id => id !== university.stableId));
    } else {
      favoritesStorage.addFavorite({
        universityId: String(university.stableId),
        universityName: university.institutionName,
        tier: university.tier,
        specialty: university.programName,
      });
      setFavorites(prev => [...prev, university.stableId]);
    }
  };

  // 添加到对比
  const handleAddToCompare = (university: PublicProgramCard, e: React.MouseEvent) => {
    e.stopPropagation();
    addToCompare(mapPublicProgramCardToUniversity(university));
  };

  // 设置提醒
  const handleSetReminder = (university: PublicProgramCard) => {
    try {
      // 解析截止日期
      const deadlineMatch = university.deadline.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
      if (!deadlineMatch) {
        alert("无法解析截止日期格式");
        return;
      }

      const [, year, month, day] = deadlineMatch;
      const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

      addReminder({
        universityId: String(university.stableId),
        universityName: university.institutionName,
        deadline: university.deadline,
        reminderDate: 7, // 默认提前7天
        active: true,
      });
    } catch (error) {
      console.error("Failed to set reminder:", error);
      alert("设置提醒失败，请稍后重试");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-serif selection:bg-primary/20">
      {/* 侧边导航栏 - 模拟书签 */}
      <aside className="fixed left-0 top-0 h-full w-16 md:w-20 bg-sidebar border-r border-sidebar-border z-50 hidden lg:flex flex-col items-center py-8 shadow-sm">
        <div className="mb-8">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-md">
            <span className="font-bold text-lg">钝</span>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center gap-8">
          <div className="vertical-text text-muted-foreground hover:text-primary transition-colors cursor-pointer text-sm tracking-widest font-medium">
            推免资讯
          </div>
          <div
            className="vertical-text text-muted-foreground hover:text-primary transition-colors cursor-pointer text-sm tracking-widest font-medium"
            onClick={() => setLocation("/analytics")}
          >
            数据分析
          </div>
          <div
            className="vertical-text text-muted-foreground hover:text-primary transition-colors cursor-pointer text-sm tracking-widest font-medium"
            onClick={() => setLocation("/compare")}
          >
            院校对比
          </div>
          <div
            className="vertical-text text-muted-foreground hover:text-primary transition-colors cursor-pointer text-sm tracking-widest font-medium"
            onClick={() => setLocation("/reminders")}
          >
            申请提醒
          </div>
          {userIsAdmin && (
            <div
              className="vertical-text text-amber-600 hover:text-amber-500 transition-colors cursor-pointer text-sm tracking-widest font-medium"
              onClick={() => setLocation("/admin/extract")}
            >
              AI提取
            </div>
          )}
          <div className="mt-auto text-xs text-muted-foreground vertical-text opacity-50">
            二零二五
          </div>
        </div>
      </aside>

      {/* 顶部用户菜单 */}
      <div className="fixed top-4 right-4 z-50 lg:right-8">
        <UserMenu />
      </div>

      {/* 主内容区 */}
      <main className="lg:pl-20 min-h-screen flex flex-col">
        {/* 顶部Hero区域 */}
        <header className="relative py-16 md:py-24 px-6 md:px-12 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/2 pointer-events-none"></div>

          <div className="container max-w-5xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center md:text-left"
            >
              <div className="inline-block mb-4 px-3 py-1 border border-primary/30 rounded-full text-primary text-xs tracking-widest bg-primary/5">
                2025年最新收录 · 985/211高校
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight text-foreground leading-tight">
                钝学<span className="text-primary">推免</span>指南
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed font-sans font-light">
                汇集全国顶尖高校文学院/中文系推免硕士考核通知，
                <br className="hidden md:block" />
                助您在学术之路上，寻得理想归处。
              </p>

              {/* 功能快捷入口 */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-wrap gap-4 mb-8"
              >
                <Button
                  onClick={() => setLocation("/matcher")}
                  className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:shadow-lg transition-all font-sans px-6 py-2 rounded-lg flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  院校匹配评估
                </Button>
                <Button
                  onClick={() => setLocation("/compare")}
                  variant="outline"
                  className="font-sans px-6 py-2 rounded-lg flex items-center gap-2"
                >
                  <BarChart2 className="w-4 h-4" />
                  院校对比
                </Button>
                <Button
                  onClick={() => setLocation("/reminders")}
                  variant="outline"
                  className="font-sans px-6 py-2 rounded-lg flex items-center gap-2"
                >
                  <Bell className="w-4 h-4" />
                  申请提醒
                </Button>
                <Button
                  onClick={() => setLocation("/analytics")}
                  variant="outline"
                  className="font-sans px-6 py-2 rounded-lg flex items-center gap-2"
                >
                  <Star className="w-4 h-4" />
                  数据分析
                </Button>
              </motion.div>

              {/* 搜索栏 - 升级为命令面板 */}
              <div className="flex flex-col md:flex-row gap-4 max-w-2xl">
                <div className="flex-1">
                  <SearchCommand
                    onSelect={(uni) => {
                      setSelectedCard(uni);
                    }}
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                  <Button
                    variant={selectedLevel === null ? "default" : "outline"}
                    onClick={() => setSelectedLevel(null)}
                    className={`h-12 px-6 rounded-lg font-sans transition-all ${selectedLevel === null ? 'bg-primary text-primary-foreground shadow-md' : 'bg-card/50 hover:bg-card'}`}
                  >
                    全部
                  </Button>
                  {levels.map(level => {
                    const config = getTierConfig(level);
                    const isSelected = selectedLevel === level;
                    return (
                      <Button
                        key={level}
                        variant={isSelected ? "default" : "outline"}
                        onClick={() => setSelectedLevel(level === selectedLevel ? null : level)}
                        className={`h-12 px-6 rounded-lg font-sans whitespace-nowrap transition-all ${
                          isSelected
                            ? `${config.bgColor} ${config.color} shadow-md border ${config.borderColor}`
                            : `bg-card/50 hover:${config.bgColor} hover:${config.color}`
                        }`}
                      >
                        {level}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        </header>

        {/* 列表区域 */}
        <section className="flex-1 px-4 md:px-12 pb-16 bg-gradient-to-b from-transparent to-muted/30">
          <div className="container max-w-6xl mx-auto">
            <div className="flex justify-between items-end mb-4 border-b border-border/40 pb-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-primary" />
                <span>院校名录</span>
                <span className="text-sm font-normal text-muted-foreground ml-2 font-sans">
                  {resultsSummary}
                </span>
              </h2>
              <div className="flex items-center gap-2">
                <FeedbackDialog />
                <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground font-sans">
                  <Filter className="w-4 h-4" />
                  <span>按拼音排序</span>
                </div>
              </div>
            </div>

            {/* 覆盖率统计面板 */}
            <div className="mb-8 p-4 bg-muted/30 rounded-lg border border-border/30">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-6 text-sm font-sans">
                  <span className="flex items-center gap-1.5" title={STATUS_CONFIG.COMPLETE.description}>
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    信息较全 <strong>{coverageStats.complete}</strong>
                  </span>
                  <span className="flex items-center gap-1.5" title={STATUS_CONFIG.PARTIAL.description}>
                    <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                    仍需核对 <strong>{coverageStats.partial}</strong>
                  </span>
                  <span className="flex items-center gap-1.5" title={STATUS_CONFIG.PENDING_MANUAL.description}>
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    待补字段 <strong>{coverageStats.pendingManual}</strong>
                  </span>
                </div>
                <div className="text-sm font-sans text-muted-foreground">
                  当前页覆盖率: <strong className="text-foreground">{coverageStats.completeRate}%</strong>
                </div>
              </div>
              <div className="mt-3 text-xs text-muted-foreground font-sans">
                “待补字段”不等于项目无效，通常只是截止时间、来源链接或要求摘要还没完全结构化；请优先查看原文确认。
              </div>
            </div>

            {loading && source === 'supabase-loading' && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Card
                    key={`loading-card-${index}`}
                    className="h-full border-primary/10 bg-card/70 backdrop-blur-sm overflow-hidden"
                  >
                    <CardHeader className="space-y-3">
                      <div className="h-6 w-2/3 rounded bg-muted animate-pulse" />
                      <div className="flex gap-2">
                        <div className="h-5 w-14 rounded-full bg-muted animate-pulse" />
                        <div className="h-5 w-20 rounded-full bg-muted animate-pulse" />
                        <div className="h-5 w-16 rounded-full bg-muted animate-pulse" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="h-4 w-full rounded bg-muted animate-pulse" />
                      <div className="h-4 w-5/6 rounded bg-muted animate-pulse" />
                    </CardContent>
                    <CardFooter>
                      <div className="h-4 w-1/3 rounded bg-muted animate-pulse" />
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}

            {source === 'supabase-error' && (
              <div className="text-center py-20 text-muted-foreground">
                <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 text-destructive">
                  <Inbox className="w-8 h-8" />
                </div>
                <p className="text-lg text-foreground">Supabase 数据加载失败</p>
                <p className="mt-2 max-w-2xl mx-auto text-sm font-sans break-words">{error || "请检查数据库查询或部署环境变量。"}</p>
              </div>
            )}

            {!loading && source !== 'supabase-error' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredUniversities.map((uni, index) => (
                  <motion.div
                    key={uni.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.5) }}
                    layout
                  >
                    <Card
                      className="h-full hover:shadow-lg transition-all duration-300 border-primary/10 bg-card/80 backdrop-blur-sm group cursor-pointer overflow-hidden relative"
                        onClick={() => setSelectedCard(uni)}
                    >
                      <div className="absolute top-0 left-0 w-1 h-full bg-primary/0 group-hover:bg-primary transition-all duration-300"></div>
                      <CardHeader className="pb-3 relative">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <CardTitle className="text-xl font-bold mb-1 group-hover:text-primary transition-colors">
                              {cleanUserInput(uni.institutionName)}
                            </CardTitle>
                            <p className="text-sm font-sans text-foreground/80 line-clamp-2">
                              {cleanUserInput(uni.programName)}
                            </p>
                            <CardDescription className="font-sans text-xs flex flex-wrap gap-1 mt-2">
                              {uni.institutionTags.map((tag) => (
                                <Badge key={`${uni.id}-${tag}`} className={`${getTierBadgeClassName(tag)} text-[10px] px-1.5 py-0.5`}>
                                  {tag}
                                </Badge>
                              ))}
                              <Badge variant="secondary" className="bg-secondary/50 text-secondary-foreground border-0 text-[10px] px-1.5 py-0.5">
                                {cleanUserInput(uni.degreeType)}
                              </Badge>
                              {uni.noticeType && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                                  {cleanUserInput(uni.noticeType)}
                                </Badge>
                              )}
                              <Badge
                                title={STATUS_CONFIG[uni.dataStatus].description}
                                className={`border-0 text-[10px] px-1.5 py-0.5 ${STATUS_CONFIG[uni.dataStatus].className}`}
                              >
                                {STATUS_CONFIG[uni.dataStatus].label}
                              </Badge>
                              {uni.noticeScope === 'general' && (
                                <Badge variant="outline" className="border-amber-500 text-amber-600 text-[10px] px-1.5 py-0.5">
                                  不分专业
                                </Badge>
                              )}
                              {uni.websiteStatus === 'maintenance' && (
                                <Badge variant="outline" className="border-orange-500 text-orange-600 text-[10px] px-1.5 py-0.5">
                                  网站维护中
                                </Badge>
                              )}
                            </CardDescription>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8 hover:bg-destructive/10 hover:text-destructive transition-colors"
                              onClick={(e) => toggleFavorite(uni, e)}
                              title="收藏"
                            >
                              {favorites.includes(uni.stableId) ? (
                                <Heart className="w-5 h-5 fill-current text-red-500" />
                              ) : (
                                <HeartOff className="w-5 h-5" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`w-8 h-8 transition-colors ${isInCompare(uni.stableId) ? 'bg-primary/10 text-primary' : 'hover:bg-primary/10'}`}
                              onClick={(e) => handleAddToCompare(uni, e)}
                              title="添加到对比"
                            >
                              <BarChart2 className="w-5 h-5" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <div className="space-y-3 font-sans">
                          <div className="flex items-center justify-between gap-3 rounded-lg border border-border/40 bg-muted/30 px-3 py-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <Calendar className="w-4 h-4 shrink-0 text-primary/70" />
                              <span className="text-sm text-foreground truncate">
                                {cleanUserInput(uni.deadline) || '截止时间待确认'}
                              </span>
                            </div>
                            <Badge
                              variant="outline"
                              className={getDeadlineBadgeClassName(getDeadlinePresentation(uni.deadline).tone)}
                            >
                              {getDeadlinePresentation(uni.deadline).label}
                            </Badge>
                          </div>
                          <div className="flex items-start gap-2 text-sm text-muted-foreground">
                            <Link2 className="w-4 h-4 mt-0.5 shrink-0 text-primary/60" />
                            <span className="line-clamp-1">
                              {uni.url ? '官方来源可查看' : '官方来源待补充'}
                            </span>
                          </div>
                          <div className="flex items-start gap-2 text-sm text-muted-foreground">
                            <GraduationCap className="w-4 h-4 mt-0.5 shrink-0 text-primary/60" />
                            <span className="line-clamp-2">
                              {cleanUserInput(uni.examForm) || cleanUserInput(uni.englishRequirement) || '先查看原文确认考核与材料要求'}
                            </span>
                          </div>
                          <div className="rounded-lg bg-primary/5 px-3 py-2 text-sm text-primary">
                            下一步：{getNextActionLabel(uni)}
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0 pb-4">
                        <div className="w-full pt-3 border-t border-border/30 flex justify-between items-center gap-3 text-xs text-muted-foreground font-sans">
                          <div className="flex items-center gap-2 min-w-0">
                            <span>{cleanUserInput(uni.degreeType)}</span>
                            <span>·</span>
                            <span>{uni.url ? '可查看原文' : '待补链接'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {uni.url && (
                              <a
                                href={cleanUserInput(uni.url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 text-primary hover:underline"
                              >
                                查看原文
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetReminder(uni);
                              }}
                            >
                              <Bell className="w-3.5 h-3.5 mr-1" />
                              提醒我
                            </Button>
                          </div>
                          <span className="group-hover:text-primary transition-colors">查看详情</span>
                        </div>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            )}

            {!loading && source !== 'supabase-error' && filteredUniversities.length === 0 && (
              <div className="text-center py-20 text-muted-foreground">
                <div className="mb-4 text-6xl opacity-20">🈳</div>
                <p className="text-lg">未找到符合条件的高校</p>
                <Button
                  variant="link"
                  onClick={() => {setSearchTerm(""); setSelectedLevel(null);}}
                  className="mt-2 text-primary"
                >
                  清除筛选条件
                </Button>
              </div>
            )}

            {!loading && source !== 'supabase-error' && filteredUniversities.length > 0 && (
              <div className="mt-8 flex flex-col gap-4 border-t border-border/30 pt-6 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-muted-foreground font-sans">
                  第 {page} / {totalPages} 页，每页 {PAGE_SIZE} 条
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="text-sm text-muted-foreground font-sans" htmlFor="page-jump">
                    跳转到
                  </label>
                  <Input
                    id="page-jump"
                    type="number"
                    min={1}
                    max={totalPages}
                    value={page}
                    onChange={(event) => {
                      const nextPage = Number(event.target.value);
                      if (Number.isNaN(nextPage)) {
                        return;
                      }
                      setPage(Math.min(totalPages, Math.max(1, nextPage)));
                    }}
                    className="h-9 w-24 font-sans"
                  />
                  <Button
                    variant="outline"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={page === 1}
                  >
                    上一页
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPage((current) => current + 1)}
                    disabled={!hasMore || page >= totalPages}
                  >
                    下一页
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* 详情弹窗 */}
      <AnimatePresence>
        {selectedUniversity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
              onClick={() => setSelectedCard(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl max-h-[90vh] bg-card border border-border shadow-2xl rounded-xl overflow-hidden flex flex-col"
            >
              <div className="flex justify-between items-start p-6 border-b border-border/40">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold mb-2">{cleanUserInput(selectedUniversity.name)}</h2>
                  <div className="flex flex-wrap gap-2">
                    {selectedCard?.institutionTags.map((tag) => (
                      <Badge key={`detail-${tag}`} className={getTierBadgeClassName(tag)}>{tag}</Badge>
                    ))}
                    <Badge className="bg-primary/20 text-primary border-0">{cleanUserInput(selectedUniversity.degreeType)}</Badge>
                    {selectedUniversity.noticeType && (
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-0">
                        {selectedUniversity.noticeType}
                      </Badge>
                    )}
                    <Badge className={`border-0 ${STATUS_CONFIG[selectedUniversity.dataStatus].className}`}>
                      {STATUS_CONFIG[selectedUniversity.dataStatus].label}
                    </Badge>
                    {!selectedUniversity.dataVerified && (
                      <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300 border-0">
                        待核实
                      </Badge>
                    )}
                    {selectedUniversity.noticeScope === 'general' && (
                      <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border-0">
                        不分专业通知
                      </Badge>
                    )}
                    {selectedUniversity.websiteStatus === 'maintenance' && (
                      <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300 border-0">
                        网站维护中
                      </Badge>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCard(null)}
                  className="text-muted-foreground hover:text-foreground transition-colors ml-4"
                >
                  ✕
                </button>
              </div>

              <ScrollArea className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-6">
                  {/* 待核实数据提示 */}
                  {!selectedUniversity.dataVerified && (
                    <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
                      <div className="text-sm text-orange-800 dark:text-orange-200">
                        <p className="font-medium mb-1">数据待核实</p>
                        <p className="text-orange-600 dark:text-orange-300">
                          以下部分信息为参考数据，可能与通知原文有差异。建议点击下方链接查看官方通知获取准确信息。
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 不分专业通知提示 */}
                  {selectedUniversity.noticeScope === 'general' && (
                    <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div className="text-sm text-amber-800 dark:text-amber-200">
                        <p className="font-medium mb-1">不分专业通知</p>
                        <p className="text-amber-600 dark:text-amber-300">
                          {selectedUniversity.noticeNote || '该院校研招网发布的是不分专业的综合通知，具体中文专业招生信息请查阅官方通知原文确认。'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 网站维护中提示 */}
                  {selectedUniversity.websiteStatus === 'maintenance' && (
                    <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-gray-600 dark:text-gray-400 shrink-0 mt-0.5" />
                      <div className="text-sm text-gray-800 dark:text-gray-200">
                        <p className="font-medium mb-1">网站维护中</p>
                        <p className="text-gray-600 dark:text-gray-300">
                          {selectedUniversity.websiteNote || '该院校官网目前正在维护，暂时无法访问。请稍后再试或关注其他渠道获取信息。'}
                        </p>
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-primary" />
                      专业方向
                    </h3>
                    <p className={`text-base ${!selectedUniversity.dataVerified && isGenericValue('specialty', selectedUniversity.specialty) ? 'text-orange-600 dark:text-orange-400 italic' : 'text-muted-foreground'}`}>
                      {displayValue(cleanUserInput(selectedUniversity.specialty), 'specialty', selectedUniversity.dataVerified)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground mb-2">学制</h3>
                      <p className="text-base">{cleanUserInput(selectedUniversity.duration || '待补充')}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground mb-2">考核形式</h3>
                      <p className={`text-base ${!selectedUniversity.dataVerified && isGenericValue('examForm', selectedUniversity.examForm) ? 'text-orange-600 dark:text-orange-400 italic' : ''}`}>
                        {displayValue(cleanUserInput(selectedUniversity.examForm), 'examForm', selectedUniversity.dataVerified)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-2">英语要求</h3>
                    <p className={`text-base ${!selectedUniversity.dataVerified && isGenericValue('englishRequirement', selectedUniversity.englishRequirement) ? 'text-orange-600 dark:text-orange-400 italic' : ''}`}>
                      {displayValue(cleanUserInput(selectedUniversity.englishRequirement), 'englishRequirement', selectedUniversity.dataVerified)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground mb-2">申请期间</h3>
                      <p className="text-base">{cleanUserInput(selectedUniversity.applicationPeriod)}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground mb-2">截止时间</h3>
                      <p className="text-base text-primary font-semibold">{cleanUserInput(selectedUniversity.deadline)}</p>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex flex-wrap gap-3 pt-4 border-t border-border/40">
                    {/* 查看通知详情（提取的内容） */}
                    <Button
                      onClick={() => setLocation(`/notice/${selectedUniversity.sourceCardId ?? selectedUniversity.id}`)}
                      className="font-sans"
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      查看通知详情
                      {selectedUniversity.noticeType && ` (${selectedUniversity.noticeType})`}
                    </Button>
                    {/* 查看原始链接（外部） */}
                    {selectedUniversity.url && selectedUniversity.url !== '' && (
                      <a
                        href={cleanUserInput(selectedUniversity.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors font-sans text-sm font-medium"
                      >
                        <ExternalLink className="w-4 h-4" />
                        原始链接
                      </a>
                    )}
                    <Button
                      onClick={() => selectedCard && handleSetReminder(selectedCard)}
                      variant="outline"
                      className="font-sans"
                    >
                      <Bell className="w-4 h-4 mr-2" />
                      设置提醒
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (selectedCard) toggleFavorite(selectedCard, e as any);
                      }}
                      variant="outline"
                      className="font-sans"
                    >
                      {selectedCard && favorites.includes(selectedCard.stableId) ? (
                        <>
                          <Heart className="w-4 h-4 mr-2 fill-current text-red-500" />
                          已收藏
                        </>
                      ) : (
                        <>
                          <HeartOff className="w-4 h-4 mr-2" />
                          收藏
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (selectedCard) handleAddToCompare(selectedCard, e as any);
                      }}
                      variant="outline"
                      className="font-sans"
                    >
                      <BarChart2 className="w-4 h-4 mr-2" />
                      加入对比
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
