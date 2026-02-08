import { useState, useMemo } from "react";
import { University, DataStatus } from "@/types/university";
import { universities as universitiesData, getCoverageStats } from "@/lib/dataLoader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, BookOpen, GraduationCap, Calendar, ExternalLink, Filter, ChevronRight, Sparkles, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";

// 通用/待核实数据的占位值
const GENERIC_VALUES = {
  specialty: ['汉语言文学、语言学等', '中国语言文学', '待确认', '待补充'],
  examForm: ['材料审核、复试', '面试、笔试', '待确认', '待补充', '综合面试'],
  englishRequirement: ['CET-6或同等', 'CET-4或同等', '待确认', '待补充', '无硬性要求'],
};

// 判断字段是否为通用/待核实值
function isGenericValue(field: keyof typeof GENERIC_VALUES, value: string): boolean {
  return GENERIC_VALUES[field]?.includes(value) ?? false;
}

// 显示值（如果是通用值且未核实，显示提示）
function displayValue(value: string, field: keyof typeof GENERIC_VALUES, dataVerified: boolean): string {
  if (!dataVerified && isGenericValue(field, value)) {
    return '请查看通知原文';
  }
  return value;
}

// 数据状态标签配置
const STATUS_CONFIG: Record<DataStatus, { label: string; className: string }> = {
  COMPLETE: {
    label: '完整',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
  },
  PARTIAL: {
    label: '部分',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
  },
  PENDING_MANUAL: {
    label: '待补',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
  },
};

export default function Home() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);

  const universities = universitiesData as University[];

  // 覆盖率统计
  const coverageStats = useMemo(() => getCoverageStats(universities), [universities]);

  const filteredUniversities = useMemo(() => {
    return universities.filter((uni) => {
      const matchesSearch =
        uni.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        uni.specialty.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesLevel = selectedLevel ? uni.tier === selectedLevel : true;

      return matchesSearch && matchesLevel;
    });
  }, [searchTerm, selectedLevel, universities]);

  // 过滤掉 '待补充' 的梯队
  const levels = Array.from(
    new Set(universities.map(u => u.tier).filter(t => t && t !== '待补充'))
  ).sort() as string[];

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
          <div className="vertical-text text-muted-foreground hover:text-primary transition-colors cursor-pointer text-sm tracking-widest font-medium">
            数据分析
          </div>
          <div className="vertical-text text-muted-foreground hover:text-primary transition-colors cursor-pointer text-sm tracking-widest font-medium">
            关于平台
          </div>
        </div>
        <div className="mt-auto text-xs text-muted-foreground vertical-text opacity-50">
          二零二五
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="lg:pl-20 min-h-screen flex flex-col">
        {/* 顶部Hero区域 */}
        <header className="relative py-16 md:py-24 px-6 md:px-12 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>

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

              {/* 匹配功能入口 */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-8 inline-block"
              >
                <Button
                  onClick={() => setLocation("/matcher")}
                  className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:shadow-lg transition-all font-sans px-6 py-2 rounded-lg flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  院校匹配评估
                </Button>
              </motion.div>

              {/* 搜索栏 */}
              <div className="flex flex-col md:flex-row gap-4 max-w-2xl">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input
                    placeholder="搜索高校名称或专业..."
                    className="pl-10 h-12 bg-card/80 backdrop-blur-sm border-primary/20 focus:border-primary/50 transition-all shadow-sm font-sans"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
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
                  {levels.map(level => (
                    <Button
                      key={level}
                      variant={selectedLevel === level ? "default" : "outline"}
                      onClick={() => setSelectedLevel(level === selectedLevel ? null : level)}
                      className={`h-12 px-6 rounded-lg font-sans whitespace-nowrap transition-all ${selectedLevel === level ? 'bg-primary text-primary-foreground shadow-md' : 'bg-card/50 hover:bg-card'}`}
                    >
                      {level}
                    </Button>
                  ))}
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
                  共收录 {filteredUniversities.length} 所高校
                </span>
              </h2>
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground font-sans">
                <Filter className="w-4 h-4" />
                <span>按拼音排序</span>
              </div>
            </div>

            {/* 覆盖率统计面板 */}
            <div className="mb-8 p-4 bg-muted/30 rounded-lg border border-border/30">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-6 text-sm font-sans">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    完整 <strong>{coverageStats.complete}</strong>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                    部分 <strong>{coverageStats.partial}</strong>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    待补 <strong>{coverageStats.pendingManual}</strong>
                  </span>
                </div>
                <div className="text-sm font-sans text-muted-foreground">
                  数据覆盖率: <strong className="text-foreground">{coverageStats.completeRate}%</strong>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredUniversities.map((uni, index) => (
                  <motion.div
                    key={uni.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    layout
                  >
                    <Card
                      className="h-full hover:shadow-lg transition-all duration-300 border-primary/10 bg-card/80 backdrop-blur-sm group cursor-pointer overflow-hidden relative"
                      onClick={() => setSelectedUniversity(uni)}
                    >
                      <div className="absolute top-0 left-0 w-1 h-full bg-primary/0 group-hover:bg-primary transition-all duration-300"></div>
                      <CardHeader className="pb-3 relative">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl font-bold mb-1 group-hover:text-primary transition-colors">
                              {uni.name}
                            </CardTitle>
                            <CardDescription className="font-sans text-xs flex flex-wrap gap-1 mt-2">
                              <Badge variant="secondary" className="bg-secondary/50 text-secondary-foreground border-0 text-[10px] px-1.5 py-0.5">
                                {uni.tier}
                              </Badge>
                              <Badge variant="secondary" className="bg-secondary/50 text-secondary-foreground border-0 text-[10px] px-1.5 py-0.5">
                                {uni.degreeType}
                              </Badge>
                              <Badge className={`border-0 text-[10px] px-1.5 py-0.5 ${STATUS_CONFIG[uni.dataStatus].className}`}>
                                {STATUS_CONFIG[uni.dataStatus].label}
                              </Badge>
                            </CardDescription>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                            <ChevronRight className="w-5 h-5" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <div className="space-y-3">
                          <div className="flex items-start gap-2 text-sm text-muted-foreground">
                            <GraduationCap className="w-4 h-4 mt-0.5 shrink-0 text-primary/60" />
                            <span className="line-clamp-2 font-sans">{uni.specialty}</span>
                          </div>
                          <div className="flex items-start gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4 mt-0.5 shrink-0 text-primary/60" />
                            <span className="line-clamp-1 font-sans">{uni.deadline}</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0 pb-4">
                        <div className="w-full pt-3 border-t border-border/30 flex justify-between items-center text-xs text-muted-foreground font-sans">
                          <span>{uni.degreeType}</span>
                          <span className="group-hover:text-primary transition-colors">查看详情</span>
                        </div>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {filteredUniversities.length === 0 && (
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
              onClick={() => setSelectedUniversity(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl max-h-[90vh] bg-card border border-border shadow-2xl rounded-xl overflow-hidden flex flex-col"
            >
              <div className="flex justify-between items-start p-6 border-b border-border/40">
                <div>
                  <h2 className="text-3xl font-bold mb-2">{selectedUniversity.name}</h2>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-primary/20 text-primary border-0">{selectedUniversity.tier}</Badge>
                    <Badge className="bg-primary/20 text-primary border-0">{selectedUniversity.degreeType}</Badge>
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
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUniversity(null)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
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

                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-primary" />
                      专业方向
                    </h3>
                    <p className={`text-base ${!selectedUniversity.dataVerified && isGenericValue('specialty', selectedUniversity.specialty) ? 'text-orange-600 dark:text-orange-400 italic' : 'text-muted-foreground'}`}>
                      {displayValue(selectedUniversity.specialty, 'specialty', selectedUniversity.dataVerified)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground mb-2">学制</h3>
                      <p className="text-base">{selectedUniversity.duration || '待补充'}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground mb-2">考核形式</h3>
                      <p className={`text-base ${!selectedUniversity.dataVerified && isGenericValue('examForm', selectedUniversity.examForm) ? 'text-orange-600 dark:text-orange-400 italic' : ''}`}>
                        {displayValue(selectedUniversity.examForm, 'examForm', selectedUniversity.dataVerified)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-2">英语要求</h3>
                    <p className={`text-base ${!selectedUniversity.dataVerified && isGenericValue('englishRequirement', selectedUniversity.englishRequirement) ? 'text-orange-600 dark:text-orange-400 italic' : ''}`}>
                      {displayValue(selectedUniversity.englishRequirement, 'englishRequirement', selectedUniversity.dataVerified)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground mb-2">申请期间</h3>
                      <p className="text-base">{selectedUniversity.applicationPeriod}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground mb-2">截止时间</h3>
                      <p className="text-base text-primary font-semibold">{selectedUniversity.deadline}</p>
                    </div>
                  </div>

                  {selectedUniversity.url && selectedUniversity.url !== '' && (
                    <div>
                      <a
                        href={selectedUniversity.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-sans text-sm font-medium"
                      >
                        <ExternalLink className="w-4 h-4" />
                        查看官方通知
                        {selectedUniversity.noticeType && ` (${selectedUniversity.noticeType})`}
                      </a>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
