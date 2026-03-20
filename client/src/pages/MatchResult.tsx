import { useState, useEffect } from "react";
import { MatchReport, MatchResult as MatchResultType } from "@/types/userProfile";
import { storageUtils } from "@/lib/storage";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Download, Share2, ChevronDown, ChevronUp } from "lucide-react";
import { useLocation } from "wouter";

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

  if (!report) {
    return null;
  }

  const { userProfile, overallScore, scoreBreakdown, results } = report;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 70) return "text-blue-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-500/10";
    if (score >= 70) return "bg-blue-500/10";
    if (score >= 60) return "bg-yellow-500/10";
    return "bg-red-500/10";
  };

  const renderMatchCard = (result: MatchResultType, index: number) => (
    <motion.div
      key={result.universityId}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="mb-4"
    >
      <Card
        className="border-primary/10 bg-card/80 backdrop-blur-sm cursor-pointer hover:shadow-lg transition-all"
        onClick={() =>
          setExpandedUniversity(
            expandedUniversity === result.universityId ? null : result.universityId
          )
        }
      >
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <CardTitle className="text-lg">{result.universityName}</CardTitle>
                <Badge className="bg-primary/20 text-primary border-0">{result.tier}</Badge>
              </div>
              <CardDescription className="font-sans text-sm">
                {result.reasons.join(" • ")}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${getScoreColor(result.matchScore)}`}>
                {Math.round(result.matchScore)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">匹配度</div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pb-3">
          <div className="flex items-center gap-2 mb-2">
            <Progress value={result.matchScore} className="flex-1" />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{result.category}校</span>
            {expandedUniversity === result.universityId ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </CardContent>

        <AnimatePresence>
          {expandedUniversity === result.universityId && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-border/40 px-6 py-4"
            >
              <div className="space-y-3 text-sm font-sans">
                <div>
                  <h4 className="font-semibold mb-2">推荐理由</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    {result.reasons.map((reason, i) => (
                      <li key={i}>{reason}</li>
                    ))}
                  </ul>
                </div>
                <Button
                  variant="outline"
                  className="w-full font-sans"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `/?search=${result.universityName}`;
                  }}
                >
                  查看院校详情
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground font-serif py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* 返回按钮 */}
        <Button
          variant="ghost"
          onClick={() => setLocation("/matcher")}
          className="mb-8 flex items-center gap-2 font-sans"
        >
          <ArrowLeft className="w-4 h-4" />
          返回表单
        </Button>

        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3">您的匹配结果</h1>
          <p className="text-lg text-muted-foreground">
            基于您的学术背景和科研成果的个性化推荐
          </p>
        </div>

        {/* 综合评分卡片 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8"
        >
          <Card className={`border-primary/10 bg-gradient-to-br ${getScoreBgColor(overallScore)}`}>
            <CardHeader>
              <CardTitle>综合评分</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className={`text-6xl font-bold ${getScoreColor(overallScore)}`}>
                    {overallScore}
                  </div>
                  <p className="text-muted-foreground mt-2">
                    {overallScore >= 80
                      ? "优秀 - 您具有很强的竞争力"
                      : overallScore >= 70
                        ? "良好 - 您的条件较为突出"
                        : overallScore >= 60
                          ? "中等 - 您有一定的竞争力"
                          : "需要改进 - 建议加强科研成果"}
                  </p>
                </div>
              </div>

              {/* 分项评分 */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2 text-sm">
                    <span className="font-medium">本科院校层次</span>
                    <span className="text-muted-foreground">
                      {Math.round(scoreBreakdown.undergraduateLevel)}/100
                    </span>
                  </div>
                  <Progress value={scoreBreakdown.undergraduateLevel} />
                </div>

                <div>
                  <div className="flex justify-between mb-2 text-sm">
                    <span className="font-medium">绩点与排名</span>
                    <span className="text-muted-foreground">
                      {Math.round((scoreBreakdown.gpaAndRanking / 75) * 100)}/100
                    </span>
                  </div>
                  <Progress value={(scoreBreakdown.gpaAndRanking / 75) * 100} />
                </div>

                <div>
                  <div className="flex justify-between mb-2 text-sm">
                    <span className="font-medium">英语水平</span>
                    <span className="text-muted-foreground">
                      {Math.round((scoreBreakdown.englishLevel / 30) * 100)}/100
                    </span>
                  </div>
                  <Progress value={(scoreBreakdown.englishLevel / 30) * 100} />
                </div>

                <div>
                  <div className="flex justify-between mb-2 text-sm">
                    <span className="font-medium">科研竞赛</span>
                    <span className="text-muted-foreground">
                      {Math.round((scoreBreakdown.researchAndCompetition / 55) * 100)}/100
                    </span>
                  </div>
                  <Progress value={(scoreBreakdown.researchAndCompetition / 55) * 100} />
                </div>

                <div>
                  <div className="flex justify-between mb-2 text-sm">
                    <span className="font-medium">实践经历</span>
                    <span className="text-muted-foreground">
                      {Math.round((scoreBreakdown.practiceExperience / 20) * 100)}/100
                    </span>
                  </div>
                  <Progress value={(scoreBreakdown.practiceExperience / 20) * 100} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 冲校 */}
        {results.rush.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="text-red-500">🔥</span> 冲校（{results.rush.length}所）
            </h2>
            <p className="text-muted-foreground mb-4 font-sans">
              这些院校对您来说有一定难度，但如果您的科研成果突出，仍有机会被录取
            </p>
            {results.rush.map((result, index) => renderMatchCard(result, index))}
          </section>
        )}

        {/* 稳校 */}
        {results.stable.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="text-yellow-500">⭐</span> 稳校（{results.stable.length}所）
            </h2>
            <p className="text-muted-foreground mb-4 font-sans">
              这些院校与您的条件匹配度较高，是您的主要申请目标
            </p>
            {results.stable.map((result, index) => renderMatchCard(result, index))}
          </section>
        )}

        {/* 保校 */}
        {results.conservative.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="text-green-500">✅</span> 保校（{results.conservative.length}所）
            </h2>
            <p className="text-muted-foreground mb-4 font-sans">
              这些院校对您来说相对容易，是您的保底选择
            </p>
            {results.conservative.map((result, index) => renderMatchCard(result, index))}
          </section>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-4 pt-8 border-t border-border/40">
          <Button
            variant="outline"
            className="flex items-center gap-2 font-sans"
            onClick={() => {
              alert("下载功能开发中");
            }}
          >
            <Download className="w-4 h-4" />
            下载报告
          </Button>

          <Button
            variant="outline"
            className="flex items-center gap-2 font-sans"
            onClick={() => {
              alert("分享功能开发中");
            }}
          >
            <Share2 className="w-4 h-4" />
            分享结果
          </Button>

          <Button
            onClick={() => setLocation("/matcher")}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-sans"
          >
            重新评估
          </Button>
        </div>

        {/* 建议部分 */}
        <Card className="mt-8 border-primary/10 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>改进建议</CardTitle>
          </CardHeader>
          <CardContent className="font-sans text-sm space-y-3 text-muted-foreground">
            {overallScore < 70 && (
              <p>
                • 您的综合评分还有提升空间。建议重点关注科研成果的积累，发表论文或参与科研项目会显著提升您的竞争力。
              </p>
            )}
            {scoreBreakdown.gpaAndRanking < 50 && (
              <p>
                • 您的GPA或排名相对较低。建议在剩余学期内提升学习成绩，同时通过科研成果来弥补不足。
              </p>
            )}
            {scoreBreakdown.englishLevel < 20 && (
              <p>
                • 您的英语成绩还未达到理想水平。建议参加英语六级或雅思考试，这会增强您的申请竞争力。
              </p>
            )}
            {scoreBreakdown.researchAndCompetition < 30 && (
              <p>
                • 您的科研竞赛成果相对较少。建议积极参与科研项目、发表论文或参加学科竞赛，这对推免申请至关重要。
              </p>
            )}
            {overallScore >= 80 && (
              <p>
                • 您的综合条件很突出！建议重点关注第一梯队高校，同时准备充分的复试材料和自我介绍。
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
