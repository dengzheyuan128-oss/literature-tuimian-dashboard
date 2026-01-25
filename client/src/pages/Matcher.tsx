import { useState, useEffect } from "react";
import { UserProfile } from "@/types/userProfile";
import { storageUtils } from "@/lib/storage";
import { matchingAlgorithm } from "@/lib/matchingAlgorithm";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { ArrowRight, Save, Trash2 } from "lucide-react";
import { useLocation } from "wouter";

const RESEARCH_INTERESTS = [
  "古代文学",
  "现当代文学",
  "比较文学",
  "语言学",
  "汉语国际教育",
  "文化研究",
];

const UNDERGRADUATE_UNIVERSITIES = [
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
  "华东师范大学",
  "北京师范大学",
  "南京师范大学",
  "湖南师范大学",
  "华中师范大学",
  "华南师范大学",
  "西南大学",
  "山东大学",
  "兰州大学",
  "中国人民大学",
  "其他高校",
];

export default function Matcher() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState<UserProfile>({
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
  });

  const [isSaved, setIsSaved] = useState(false);

  // 加载保存的数据
  useEffect(() => {
    const savedProfile = storageUtils.getUserProfile();
    if (savedProfile) {
      setFormData(savedProfile);
      setIsSaved(true);
    }
  }, []);

  const handleInputChange = (field: keyof UserProfile, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      updatedAt: Date.now(),
    }));
    setIsSaved(false);
  };

  const handleCheckboxChange = (field: keyof UserProfile, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: checked,
      updatedAt: Date.now(),
    }));
    setIsSaved(false);
  };

  const handleResearchInterestToggle = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      researchInterests: prev.researchInterests.includes(interest)
        ? prev.researchInterests.filter((i) => i !== interest)
        : [...prev.researchInterests, interest],
      updatedAt: Date.now(),
    }));
    setIsSaved(false);
  };

  const handleSaveForm = () => {
    if (storageUtils.saveUserProfile(formData)) {
      setIsSaved(true);
      // 显示保存成功提示
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  const handleClearForm = () => {
    if (window.confirm("确定要清除所有数据吗？")) {
      storageUtils.clearAll();
      setFormData({
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
      });
    }
  };

  const handleMatch = () => {
    // 验证必填字段
    if (
      !formData.undergraduateUniversity ||
      !formData.undergraduateMajor ||
      formData.gpa === 0 ||
      formData.ranking === 0
    ) {
      alert("请填写所有必填字段");
      return;
    }

    // 保存表单数据
    storageUtils.saveUserProfile(formData);

    // 生成匹配报告
    const report = matchingAlgorithm.generateMatchReport(formData);
    storageUtils.saveMatchReport(report);

    // 跳转到结果页面
    setLocation("/match-result");
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-serif py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3">院校匹配评估</h1>
          <p className="text-lg text-muted-foreground">
            根据您的学术背景和科研成果，为您推荐最适合的院校
          </p>
        </div>

        {/* 表单卡片 */}
        <Card className="border-primary/10 bg-card/80 backdrop-blur-sm">
          <CardHeader className="border-b border-border/40">
            <div className="flex justify-between items-center">
              <CardTitle>个人信息表单</CardTitle>
              {isSaved && (
                <Badge className="bg-green-500/20 text-green-700 border-0">已保存</Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="pt-8">
            <div className="space-y-8">
              {/* 基础信息 */}
              <section>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="text-primary">●</span> 基础信息
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">本科院校 *</Label>
                    <select
                      value={formData.undergraduateUniversity}
                      onChange={(e) =>
                        handleInputChange("undergraduateUniversity", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground font-sans"
                    >
                      <option value="">请选择</option>
                      {UNDERGRADUATE_UNIVERSITIES.map((uni) => (
                        <option key={uni} value={uni}>
                          {uni}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block">本科专业 *</Label>
                    <Input
                      placeholder="例：汉语言文学"
                      value={formData.undergraduateMajor}
                      onChange={(e) =>
                        handleInputChange("undergraduateMajor", e.target.value)
                      }
                      className="font-sans"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block">GPA/绩点 *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="4"
                      placeholder="0-4.0"
                      value={formData.gpa || ""}
                      onChange={(e) => handleInputChange("gpa", parseFloat(e.target.value))}
                      className="font-sans"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block">班级排名 *</Label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="例：5"
                      value={formData.ranking || ""}
                      onChange={(e) => handleInputChange("ranking", parseInt(e.target.value))}
                      className="font-sans"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block">排名百分比 (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      placeholder="0-100"
                      value={formData.rankingPercentile || ""}
                      onChange={(e) =>
                        handleInputChange("rankingPercentile", parseFloat(e.target.value))
                      }
                      className="font-sans"
                    />
                  </div>
                </div>
              </section>

              {/* 科研成果 */}
              <section>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="text-primary">●</span> 科研成果
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">论文数量</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.paperCount || ""}
                      onChange={(e) => handleInputChange("paperCount", parseInt(e.target.value))}
                      className="font-sans"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block">论文级别</Label>
                    <select
                      value={formData.paperLevel}
                      onChange={(e) => handleInputChange("paperLevel", e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground font-sans"
                    >
                      <option value="">请选择</option>
                      <option value="核心期刊">核心期刊</option>
                      <option value="普通期刊">普通期刊</option>
                      <option value="会议论文">会议论文</option>
                      <option value="其他">其他</option>
                    </select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block">科研项目数量</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.projectCount || ""}
                      onChange={(e) =>
                        handleInputChange("projectCount", parseInt(e.target.value))
                      }
                      className="font-sans"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block">项目级别</Label>
                    <select
                      value={formData.projectLevel}
                      onChange={(e) => handleInputChange("projectLevel", e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground font-sans"
                    >
                      <option value="">请选择</option>
                      <option value="国家级">国家级</option>
                      <option value="省级">省级</option>
                      <option value="校级">校级</option>
                      <option value="其他">其他</option>
                    </select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block">竞赛获奖数量</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.competitionCount || ""}
                      onChange={(e) =>
                        handleInputChange("competitionCount", parseInt(e.target.value))
                      }
                      className="font-sans"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block">竞赛级别</Label>
                    <select
                      value={formData.competitionLevel}
                      onChange={(e) => handleInputChange("competitionLevel", e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground font-sans"
                    >
                      <option value="">请选择</option>
                      <option value="国家级">国家级</option>
                      <option value="省级">省级</option>
                      <option value="校级">校级</option>
                      <option value="其他">其他</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* 研究兴趣 */}
              <section>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="text-primary">●</span> 研究兴趣
                </h3>
                <div className="mb-4">
                  <Label className="text-sm font-medium mb-3 block">选择研究方向</Label>
                  <div className="flex flex-wrap gap-3">
                    {RESEARCH_INTERESTS.map((interest) => (
                      <Badge
                        key={interest}
                        variant={
                          formData.researchInterests.includes(interest)
                            ? "default"
                            : "outline"
                        }
                        className="cursor-pointer px-3 py-1.5 font-sans"
                        onClick={() => handleResearchInterestToggle(interest)}
                      >
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">研究方向描述</Label>
                  <textarea
                    placeholder="可选：详细描述您的研究兴趣和方向"
                    value={formData.researchDescription}
                    onChange={(e) =>
                      handleInputChange("researchDescription", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground font-sans min-h-24"
                  />
                </div>
              </section>

              {/* 实践经历 */}
              <section>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="text-primary">●</span> 实践经历
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={formData.hasStudentLeadership}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange("hasStudentLeadership", checked as boolean)
                      }
                    />
                    <Label className="font-sans cursor-pointer">
                      学生干部经历
                    </Label>
                  </div>

                  {formData.hasStudentLeadership && (
                    <Input
                      placeholder="请输入职位"
                      value={formData.studentLeadershipPosition}
                      onChange={(e) =>
                        handleInputChange("studentLeadershipPosition", e.target.value)
                      }
                      className="font-sans"
                    />
                  )}

                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={formData.hasNationalCompetition}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange("hasNationalCompetition", checked as boolean)
                      }
                    />
                    <Label className="font-sans cursor-pointer">
                      国家级竞赛经历
                    </Label>
                  </div>

                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={formData.hasProvinceCompetition}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange("hasProvinceCompetition", checked as boolean)
                      }
                    />
                    <Label className="font-sans cursor-pointer">
                      省级竞赛经历
                    </Label>
                  </div>

                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={formData.hasSchoolCompetition}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange("hasSchoolCompetition", checked as boolean)
                      }
                    />
                    <Label className="font-sans cursor-pointer">
                      校级竞赛经历
                    </Label>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block">实习/社会实践</Label>
                    <textarea
                      placeholder="可选：描述您的实习或社会实践经历"
                      value={formData.practiceExperience}
                      onChange={(e) =>
                        handleInputChange("practiceExperience", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground font-sans min-h-20"
                    />
                  </div>
                </div>
              </section>

              {/* 英语水平 */}
              <section>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="text-primary">●</span> 英语水平
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Checkbox
                      checked={formData.hasCET6}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange("hasCET6", checked as boolean)
                      }
                    />
                    <Label className="font-sans cursor-pointer">
                      英语六级
                    </Label>
                  </div>

                  {formData.hasCET6 && (
                    <Input
                      type="number"
                      min="0"
                      max="710"
                      placeholder="六级成绩"
                      value={formData.cet6Score || ""}
                      onChange={(e) => handleInputChange("cet6Score", parseInt(e.target.value))}
                      className="font-sans"
                    />
                  )}

                  <div className="flex items-center gap-3 mb-2">
                    <Checkbox
                      checked={formData.hasIELTS}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange("hasIELTS", checked as boolean)
                      }
                    />
                    <Label className="font-sans cursor-pointer">
                      雅思成绩
                    </Label>
                  </div>

                  {formData.hasIELTS && (
                    <Input
                      type="number"
                      step="0.5"
                      min="0"
                      max="9"
                      placeholder="雅思成绩"
                      value={formData.ieltsScore || ""}
                      onChange={(e) =>
                        handleInputChange("ieltsScore", parseFloat(e.target.value))
                      }
                      className="font-sans"
                    />
                  )}
                </div>
              </section>

              {/* 其他信息 */}
              <section>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="text-primary">●</span> 其他信息
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={formData.hasRecommendationQualification}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange(
                          "hasRecommendationQualification",
                          checked as boolean
                        )
                      }
                    />
                    <Label className="font-sans cursor-pointer">
                      拥有推免资格
                    </Label>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block">学位偏好</Label>
                    <select
                      value={formData.degreePreference}
                      onChange={(e) =>
                        handleInputChange("degreePreference", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground font-sans"
                    >
                      <option value="都可以">都可以</option>
                      <option value="学硕">学硕</option>
                      <option value="专硕">专硕</option>
                    </select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block">备注</Label>
                    <textarea
                      placeholder="可选：其他需要说明的信息"
                      value={formData.remarks}
                      onChange={(e) => handleInputChange("remarks", e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground font-sans min-h-20"
                    />
                  </div>
                </div>
              </section>

              {/* 操作按钮 */}
              <div className="flex gap-4 pt-6 border-t border-border/40">
                <Button
                  onClick={handleSaveForm}
                  variant="outline"
                  className="flex items-center gap-2 font-sans"
                >
                  <Save className="w-4 h-4" />
                  保存表单
                </Button>

                <Button
                  onClick={handleMatch}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-sans"
                >
                  开始匹配
                  <ArrowRight className="w-4 h-4" />
                </Button>

                <Button
                  onClick={handleClearForm}
                  variant="outline"
                  className="flex items-center gap-2 font-sans text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                  清除数据
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
