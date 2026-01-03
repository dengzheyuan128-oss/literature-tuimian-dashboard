import { useState, useMemo } from "react";
import { University } from "@/types/university";
import universitiesData from "@/data/universities.json";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, BookOpen, GraduationCap, Calendar, ExternalLink, Filter, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);

  const universities = universitiesData as University[];

  const filteredUniversities = useMemo(() => {
    return universities.filter((uni) => {
      const matchesSearch = 
        uni.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        uni.major.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesLevel = selectedLevel ? uni.level.includes(selectedLevel) : true;
      
      return matchesSearch && matchesLevel;
    });
  }, [searchTerm, selectedLevel, universities]);

  const levels = Array.from(new Set(universities.map(u => u.level.split('/')[0]))).sort();

  return (
    <div className="min-h-screen bg-background text-foreground font-serif bg-cloud-pattern selection:bg-primary/20">
      {/* 侧边导航栏 - 模拟书签 */}
      <aside className="fixed left-0 top-0 h-full w-16 md:w-20 bg-sidebar border-r border-sidebar-border z-50 hidden lg:flex flex-col items-center py-8 shadow-sm">
        <div className="mb-8">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-md">
            <span className="font-bold text-lg">文</span>
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
                文苑<span className="text-primary">推免</span>指南
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed font-sans font-light">
                汇集全国顶尖高校文学院/中文系推免硕士考核通知，
                <br className="hidden md:block" />
                助您在学术之路上，寻得理想归处。
              </p>
              
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
            <div className="flex justify-between items-end mb-8 border-b border-border/40 pb-4">
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
                              {uni.level.split('/').map((tag, i) => (
                                <Badge key={i} variant="secondary" className="bg-secondary/50 text-secondary-foreground border-0 text-[10px] px-1.5 py-0.5">
                                  {tag}
                                </Badge>
                              ))}
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
                            <span className="line-clamp-2 font-sans">{uni.major}</span>
                          </div>
                          <div className="flex items-start gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4 mt-0.5 shrink-0 text-primary/60" />
                            <span className="line-clamp-1 font-sans">{uni.timeline.split('；')[0]}</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0 pb-4">
                        <div className="w-full pt-3 border-t border-border/30 flex justify-between items-center text-xs text-muted-foreground font-sans">
                          <span>{uni.degree}</span>
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
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50"></div>
              
              <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-3xl font-bold text-foreground mb-2">{selectedUniversity.name}</h2>
                    <div className="flex flex-wrap gap-2">
                      {selectedUniversity.level.split('/').map((tag, i) => (
                        <Badge key={i} variant="outline" className="border-primary/30 text-primary bg-primary/5">
                          {tag}
                        </Badge>
                      ))}
                      <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground">
                        {selectedUniversity.duration}
                      </Badge>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setSelectedUniversity(null)}
                    className="rounded-full hover:bg-muted"
                  >
                    <span className="text-xl">×</span>
                  </Button>
                </div>

                <div className="space-y-8 font-sans">
                  <section>
                    <h3 className="text-lg font-bold font-serif mb-3 flex items-center gap-2 text-primary">
                      <BookOpen className="w-5 h-5" />
                      开设专业
                    </h3>
                    <p className="text-foreground/80 leading-relaxed bg-muted/30 p-4 rounded-lg border border-border/50">
                      {selectedUniversity.major}
                    </p>
                  </section>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <section>
                      <h3 className="text-lg font-bold font-serif mb-3 flex items-center gap-2 text-primary">
                        <GraduationCap className="w-5 h-5" />
                        考核形式
                      </h3>
                      <p className="text-foreground/80 leading-relaxed">
                        {selectedUniversity.assessment}
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg font-bold font-serif mb-3 flex items-center gap-2 text-primary">
                        <span className="text-sm border border-current rounded px-1 font-sans">EN</span>
                        英语要求
                      </h3>
                      <p className="text-foreground/80 leading-relaxed">
                        {selectedUniversity.english}
                      </p>
                    </section>
                  </div>

                  <section>
                    <h3 className="text-lg font-bold font-serif mb-3 flex items-center gap-2 text-primary">
                      <Calendar className="w-5 h-5" />
                      时间安排
                    </h3>
                    <div className="bg-accent/10 p-4 rounded-lg border border-accent/20 text-accent-foreground">
                      {selectedUniversity.timeline}
                    </div>
                  </section>

                  <section>
                    <h3 className="text-lg font-bold font-serif mb-3 flex items-center gap-2 text-primary">
                      <span className="text-lg">📝</span>
                      考核要求总结
                    </h3>
                    <p className="text-foreground/80 leading-relaxed text-justify">
                      {selectedUniversity.summary}
                    </p>
                  </section>
                </div>
              </div>

              <div className="p-4 md:p-6 border-t border-border bg-muted/10 flex justify-end gap-4">
                <Button variant="outline" onClick={() => setSelectedUniversity(null)}>
                  关闭
                </Button>
                <Button className="gap-2" asChild>
                  <a href={selectedUniversity.link} target="_blank" rel="noopener noreferrer">
                    访问官方通知 <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
