import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { ArrowRight, Save, Trash2 } from "lucide-react";

import { matchingAlgorithm } from "@/lib/matchingAlgorithm";
import { storageUtils } from "@/lib/storage";
import type { UserProfile } from "@/types/userProfile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const RESEARCH_INTERESTS = ["古代文学", "现当代文学", "比较文学", "语言学", "汉语国际教育", "文化研究"];
const UNIVERSITY_OPTIONS = [
  "北京大学",
  "清华大学",
  "复旦大学",
  "上海交通大学",
  "浙江大学",
  "南京大学",
  "武汉大学",
  "中山大学",
  "四川大学",
  "华中科技大学",
  "北京师范大学",
  "华东师范大学",
  "南京师范大学",
  "湖南师范大学",
  "华中师范大学",
  "华南师范大学",
  "山东大学",
  "中国人民大学",
  "兰州大学",
  "其他高校",
];

const DEFAULT_PROFILE: UserProfile = {
  undergraduateUniversity: "",
  undergraduateMajor: "",
  gpa: 0,
  ranking: 0,
  rankingPercentile: 0,
  paperCount: 0,
  paperLevel: "",
  projectCount: 0,
  projectLevel: "",
  projectRole: "",
  competitionCount: 0,
  competitionLevel: "",
  researchInterests: [],
  researchDescription: "",
  hasStudentLeadership: false,
  studentLeadershipPosition: "",
  hasNationalCompetition: false,
  hasProvinceCompetition: false,
  hasSchoolCompetition: false,
  practiceExperience: "",
  hasCET4: false,
  cet4Score: 0,
  hasCET6: false,
  cet6Score: 0,
  hasIELTS: false,
  ieltsScore: 0,
  hasTOEFL: false,
  toeflScore: 0,
  hasRecommendationQualification: false,
  targetCities: [],
  degreePreference: "都可以",
  remarks: "",
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

const PAPER_LEVELS = ["核心期刊", "普通期刊", "会议论文", "其他"] as const;
const PROJECT_LEVELS = ["国家级", "省级", "校级", "其他"] as const;
const COMPETITION_LEVELS = ["国家级", "省级", "校级", "其他"] as const;
const DEGREE_OPTIONS = ["学硕", "专硕", "都可以"] as const;

function parseNumber(value: string) {
  if (!value.trim()) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseCityList(value: string) {
  return value
    .split(/[,，、\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function Matcher() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState<UserProfile>(DEFAULT_PROFILE);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const savedProfile = storageUtils.getUserProfile();
    if (savedProfile) {
      setFormData(savedProfile);
      setIsSaved(true);
    }
  }, []);

  const updateField = <K extends keyof UserProfile>(field: K, value: UserProfile[K]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      updatedAt: Date.now(),
    }));
    setIsSaved(false);
  };

  const toggleResearchInterest = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      researchInterests: prev.researchInterests.includes(interest)
        ? prev.researchInterests.filter((item) => item !== interest)
        : [...prev.researchInterests, interest],
      updatedAt: Date.now(),
    }));
    setIsSaved(false);
  };

  const handleSave = () => {
    if (storageUtils.saveUserProfile(formData)) {
      setIsSaved(true);
      window.setTimeout(() => setIsSaved(false), 1800);
    }
  };

  const handleClear = () => {
    if (!window.confirm("确定要清除当前填写的信息吗？")) return;
    storageUtils.clearAll();
    setFormData(DEFAULT_PROFILE);
    setIsSaved(false);
  };

  const handleGenerate = async () => {
    if (
      !formData.undergraduateUniversity ||
      !formData.undergraduateMajor ||
      formData.gpa <= 0 ||
      formData.ranking <= 0 ||
      formData.rankingPercentile <= 0
    ) {
      window.alert("请先填写本科院校、专业、GPA、排名和排名百分位。");
      return;
    }

    try {
      storageUtils.saveUserProfile(formData);
      const report = await matchingAlgorithm.generateMatchReport(formData);
      storageUtils.saveMatchReport(report);
      setLocation("/match-result");
    } catch (error) {
      console.error("Failed to generate match report:", error);
      window.alert("生成匹配结果失败，请稍后重试。");
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-12 text-foreground">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-4xl">
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <Badge variant="secondary">背景评估</Badge>
            {isSaved ? <Badge className="border-0 bg-emerald-100 text-emerald-700">已保存</Badge> : null}
          </div>
          <h1 className="text-4xl font-semibold tracking-tight">生成你的推免匹配报告</h1>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            先填写基础信息、成绩、科研经历和英语情况，再基于当前公开项目卡生成一份分层参考结果。
          </p>
        </div>

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>个人信息表单</CardTitle>
          </CardHeader>

          <CardContent className="space-y-8">
            <section className="space-y-4">
              <SectionTitle title="基础信息" />
              <div className="grid gap-6 md:grid-cols-2">
                <Field label="本科院校 *">
                  <select
                    value={formData.undergraduateUniversity}
                    onChange={(event) => updateField("undergraduateUniversity", event.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2"
                  >
                    <option value="">请选择</option>
                    {UNIVERSITY_OPTIONS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="本科专业 *">
                  <Input
                    placeholder="例如：中国语言文学"
                    value={formData.undergraduateMajor}
                    onChange={(event) => updateField("undergraduateMajor", event.target.value)}
                  />
                </Field>
                <Field label="GPA *">
                  <Input
                    type="number"
                    min="0"
                    max="4"
                    step="0.01"
                    value={formData.gpa || ""}
                    onChange={(event) => updateField("gpa", parseNumber(event.target.value))}
                  />
                </Field>
                <Field label="专业排名 *">
                  <Input
                    type="number"
                    min="1"
                    value={formData.ranking || ""}
                    onChange={(event) => updateField("ranking", parseNumber(event.target.value))}
                  />
                </Field>
                <Field label="排名百分位 *">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.rankingPercentile || ""}
                    onChange={(event) => updateField("rankingPercentile", parseNumber(event.target.value))}
                  />
                </Field>
                <Field label="学位偏好">
                  <select
                    value={formData.degreePreference}
                    onChange={(event) => updateField("degreePreference", event.target.value as UserProfile["degreePreference"])}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2"
                  >
                    {DEGREE_OPTIONS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </section>

            <section className="space-y-4">
              <SectionTitle title="科研与项目经历" />
              <div className="grid gap-6 md:grid-cols-2">
                <Field label="论文数量">
                  <Input type="number" min="0" value={formData.paperCount || ""} onChange={(event) => updateField("paperCount", parseNumber(event.target.value))} />
                </Field>
                <Field label="论文级别">
                  <select
                    value={formData.paperLevel}
                    onChange={(event) => updateField("paperLevel", event.target.value as UserProfile["paperLevel"])}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2"
                  >
                    <option value="">请选择</option>
                    {PAPER_LEVELS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="项目数量">
                  <Input type="number" min="0" value={formData.projectCount || ""} onChange={(event) => updateField("projectCount", parseNumber(event.target.value))} />
                </Field>
                <Field label="项目级别">
                  <select
                    value={formData.projectLevel}
                    onChange={(event) => updateField("projectLevel", event.target.value as UserProfile["projectLevel"])}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2"
                  >
                    <option value="">请选择</option>
                    {PROJECT_LEVELS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="竞赛数量">
                  <Input type="number" min="0" value={formData.competitionCount || ""} onChange={(event) => updateField("competitionCount", parseNumber(event.target.value))} />
                </Field>
                <Field label="竞赛级别">
                  <select
                    value={formData.competitionLevel}
                    onChange={(event) => updateField("competitionLevel", event.target.value as UserProfile["competitionLevel"])}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2"
                  >
                    <option value="">请选择</option>
                    {COMPETITION_LEVELS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </section>

            <section className="space-y-4">
              <SectionTitle title="研究兴趣与补充说明" />
              <div className="flex flex-wrap gap-3">
                {RESEARCH_INTERESTS.map((item) => (
                  <Badge
                    key={item}
                    variant={formData.researchInterests.includes(item) ? "default" : "outline"}
                    className="cursor-pointer px-3 py-1.5"
                    onClick={() => toggleResearchInterest(item)}
                  >
                    {item}
                  </Badge>
                ))}
              </div>
              <Field label="研究方向说明">
                <textarea
                  placeholder="例如：关注古代文学方向，希望继续做文本细读与文献整理。"
                  value={formData.researchDescription}
                  onChange={(event) => updateField("researchDescription", event.target.value)}
                  className="min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2"
                />
              </Field>
            </section>

            <section className="space-y-4">
              <SectionTitle title="英语与实践经历" />
              <div className="grid gap-4 md:grid-cols-2">
                <CheckRow checked={formData.hasStudentLeadership} label="有学生干部经历" onChange={(checked) => updateField("hasStudentLeadership", checked)} />
                <CheckRow checked={formData.hasRecommendationQualification} label="已获得推免资格" onChange={(checked) => updateField("hasRecommendationQualification", checked)} />
                <CheckRow checked={formData.hasNationalCompetition} label="有国家级竞赛经历" onChange={(checked) => updateField("hasNationalCompetition", checked)} />
                <CheckRow checked={formData.hasProvinceCompetition} label="有省级竞赛经历" onChange={(checked) => updateField("hasProvinceCompetition", checked)} />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Field label="CET-6 分数">
                  <Input
                    type="number"
                    min="0"
                    max="710"
                    value={formData.cet6Score || ""}
                    onChange={(event) => {
                      const value = parseNumber(event.target.value);
                      updateField("hasCET6", value > 0);
                      updateField("cet6Score", value);
                    }}
                  />
                </Field>
                <Field label="IELTS 分数">
                  <Input
                    type="number"
                    min="0"
                    max="9"
                    step="0.5"
                    value={formData.ieltsScore || ""}
                    onChange={(event) => {
                      const value = parseNumber(event.target.value);
                      updateField("hasIELTS", value > 0);
                      updateField("ieltsScore", value);
                    }}
                  />
                </Field>
                <Field label="目标城市">
                  <Input placeholder="例如：北京，上海，南京" value={formData.targetCities.join("，")} onChange={(event) => updateField("targetCities", parseCityList(event.target.value))} />
                </Field>
                <Field label="实践经历">
                  <Input placeholder="例如：志愿服务、实习、校内项目" value={formData.practiceExperience} onChange={(event) => updateField("practiceExperience", event.target.value)} />
                </Field>
              </div>

              <Field label="备注">
                <textarea
                  placeholder="补充任何有助于匹配判断的信息。"
                  value={formData.remarks}
                  onChange={(event) => updateField("remarks", event.target.value)}
                  className="min-h-20 w-full rounded-lg border border-border bg-background px-3 py-2"
                />
              </Field>
            </section>

            <div className="flex flex-col gap-3 border-t border-border/60 pt-6 sm:flex-row">
              <Button onClick={handleSave} variant="outline" className="gap-2">
                <Save className="h-4 w-4" />
                保存表单
              </Button>
              <Button onClick={handleGenerate} className="gap-2 sm:flex-1">
                生成匹配结果
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button onClick={handleClear} variant="outline" className="gap-2 text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
                清空数据
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <h2 className="text-lg font-medium">{title}</h2>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
    </div>
  );
}

function CheckRow({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2">
      <Checkbox checked={checked} onCheckedChange={(value) => onChange(Boolean(value))} />
      <Label className="cursor-pointer">{label}</Label>
    </div>
  );
}
