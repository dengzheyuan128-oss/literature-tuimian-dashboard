import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "wouter";
import { ArrowLeft, ChevronDown, ChevronUp, Download, Share2 } from "lucide-react";

import { storageUtils } from "@/lib/storage";
import type { MatchReport, MatchResult as MatchResultType } from "@/types/userProfile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

function getScoreColor(score: number) {
  if (score >= 80) return "text-emerald-600";
  if (score >= 70) return "text-blue-600";
  if (score >= 60) return "text-amber-600";
  return "text-red-600";
}

function getScoreBgColor(score: number) {
  if (score >= 80) return "bg-emerald-500/10";
  if (score >= 70) return "bg-blue-500/10";
  if (score >= 60) return "bg-amber-500/10";
  return "bg-red-500/10";
}

function getOverallSummary(score: number) {
  if (score >= 80) return "你的综合条件较强，可以重点关注冲刺项目，同时保留稳妥选择。";
  if (score >= 70) return "你的背景具备较强竞争力，建议以稳为主，同时挑选少量冲刺项目。";
  if (score >= 60) return "你的条件具备基本申请能力，建议优先补齐短板并做稳妥匹配。";
  return "你的背景还有提升空间，建议先补齐成绩、英语或科研材料，再压缩目标范围。";
}

function getCategoryTitle(category: MatchResultType["category"]) {
  if (category === "冲") return "冲校";
  if (category === "稳") return "稳校";
  return "保校";
}

function getSectionIntro(category: MatchResultType["category"]) {
  if (category === "冲") return "这些项目更适合冲刺，通常竞争压力更高。";
  if (category === "稳") return "这些项目与你当前条件更匹配，建议优先准备。";
  return "这些项目更适合作为保底或补充选择。";
}

export default function MatchResultPage() {
  const [, setLocation] = useLocation();
  const [report, setReport] = useState<MatchReport | null>(null);
  const [expandedUniversity, setExpandedUniversity] = useState<number | null>(null);

  useEffect(() => {
    const savedReport = storageUtils.getMatchReport();
    if (!savedReport) {
      setLocation("/matcher");
      return;
    }
    setReport(savedReport);
  }, [setLocation]);

  if (!report) return null;

  const { overallScore, scoreBreakdown, results } = report;
  const sections: Array<{
    key: keyof MatchReport["results"];
    title: string;
    intro: string;
    items: MatchResultType[];
  }> = [
    { key: "rush", title: "冲校", intro: getSectionIntro("冲"), items: results.rush },
    { key: "stable", title: "稳校", intro: getSectionIntro("稳"), items: results.stable },
    { key: "conservative", title: "保校", intro: getSectionIntro("保"), items: results.conservative },
  ];

  return (
    <div className="min-h-screen bg-background px-4 py-12 text-foreground">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-4xl">
        <Button variant="ghost" onClick={() => setLocation("/matcher")} className="mb-8 gap-2">
          <ArrowLeft className="h-4 w-4" />
          返回表单
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-semibold tracking-tight">你的匹配结果</h1>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            这份结果基于你当前填写的信息和公共项目卡生成，用于帮助你确定申请优先级，而不是替代最终判断。
          </p>
        </div>

        <Card className={`mb-8 border-border/60 shadow-sm ${getScoreBgColor(overallScore)}`}>
          <CardHeader>
            <CardTitle>综合评分</CardTitle>
            <CardDescription>分数越高，说明你当前条件与目标项目的匹配度越强。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className={`text-6xl font-semibold ${getScoreColor(overallScore)}`}>{overallScore}</div>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">{getOverallSummary(overallScore)}</p>
            </div>

            <div className="space-y-4">
              <ScoreRow label="本科院校背景" value={scoreBreakdown.undergraduateLevel} max={100} />
              <ScoreRow label="成绩与排名" value={scoreBreakdown.gpaAndRanking} max={75} />
              <ScoreRow label="英语水平" value={scoreBreakdown.englishLevel} max={30} />
              <ScoreRow label="科研与竞赛" value={scoreBreakdown.researchAndCompetition} max={55} />
              <ScoreRow label="实践经历" value={scoreBreakdown.practiceExperience} max={20} />
            </div>
          </CardContent>
        </Card>

        {sections.map((section) =>
          section.items.length > 0 ? (
            <section key={section.key} className="mb-8">
              <h2 className="text-2xl font-semibold">{section.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{section.intro}</p>
              <div className="mt-4 space-y-4">
                {section.items.map((result, index) => (
                  <motion.div
                    key={result.universityId}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="border-border/60 shadow-sm">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <CardTitle className="text-lg">{result.universityName}</CardTitle>
                              <Badge variant="outline">{result.tier}</Badge>
                              <Badge>{getCategoryTitle(result.category)}</Badge>
                            </div>
                            <CardDescription className="mt-2">{result.reasons.join(" · ")}</CardDescription>
                          </div>
                          <div className="text-right">
                            <div className={`text-3xl font-semibold ${getScoreColor(result.matchScore)}`}>
                              {Math.round(result.matchScore)}
                            </div>
                            <div className="text-xs text-muted-foreground">匹配度</div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Progress value={result.matchScore} />
                        <Button
                          variant="ghost"
                          className="h-auto w-full justify-between px-0"
                          onClick={() =>
                            setExpandedUniversity((current) => (current === result.universityId ? null : result.universityId))
                          }
                        >
                          <span className="text-sm text-muted-foreground">查看推荐理由</span>
                          {expandedUniversity === result.universityId ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>

                        <AnimatePresence initial={false}>
                          {expandedUniversity === result.universityId ? (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden rounded-2xl border border-border/60 bg-muted/30 p-4"
                            >
                              <ul className="space-y-2 text-sm text-muted-foreground">
                                {result.reasons.map((reason) => (
                                  <li key={reason}>- {reason}</li>
                                ))}
                              </ul>
                            </motion.div>
                          ) : null}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </section>
          ) : null,
        )}

        <div className="flex flex-col gap-3 border-t border-border/60 pt-8 sm:flex-row">
          <Button variant="outline" className="gap-2" onClick={() => window.alert("导出功能暂未开放，建议先保存当前结果。")}>
            <Download className="h-4 w-4" />
            导出结果
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => window.alert("分享功能暂未开放，可以先截图保存。")}>
            <Share2 className="h-4 w-4" />
            分享结果
          </Button>
          <Button onClick={() => setLocation("/matcher")} className="sm:flex-1">
            重新评估
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

function ScoreRow({ label, value, max }: { label: string; value: number; max: number }) {
  const normalized = Math.round((value / max) * 100);

  return (
    <div>
      <div className="mb-2 flex justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">{normalized}/100</span>
      </div>
      <Progress value={normalized} />
    </div>
  );
}
