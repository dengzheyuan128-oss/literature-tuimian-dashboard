import { useMemo } from "react";
import { useReminders } from "@/contexts/ReminderContext";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  Trash2,
  Bell,
  BellOff,
  Calendar,
  Clock,
  Plus,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// 解析日期字符串（支持多种格式）
function parseDeadline(deadline: string): Date | null {
  // 格式: 2025年9月7日 或 2025年9月7日16:00
  const match = deadline.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (match) {
    const [, year, month, day] = match;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  return null;
}

// 计算距离截止日期的天数
function getDaysUntilDeadline(deadline: string): number | null {
  const deadlineDate = parseDeadline(deadline);
  if (!deadlineDate) return null;

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  deadlineDate.setHours(0, 0, 0, 0);

  const diffTime = deadlineDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// 获取状态标签
function getDeadlineStatus(days: number | null): {
  label: string;
  className: string;
  urgent: boolean;
} {
  if (days === null) {
    return {
      label: "日期待定",
      className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
      urgent: false,
    };
  }
  if (days < 0) {
    return {
      label: "已截止",
      className: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
      urgent: false,
    };
  }
  if (days === 0) {
    return {
      label: "今天截止",
      className: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
      urgent: true,
    };
  }
  if (days <= 3) {
    return {
      label: `剩余 ${days} 天`,
      className: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
      urgent: true,
    };
  }
  if (days <= 7) {
    return {
      label: `剩余 ${days} 天`,
      className:
        "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
      urgent: true,
    };
  }
  if (days <= 14) {
    return {
      label: `剩余 ${days} 天`,
      className:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300",
      urgent: false,
    };
  }
  return {
    label: `剩余 ${days} 天`,
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
    urgent: false,
  };
}

export default function Reminders() {
  const [, setLocation] = useLocation();
  const { reminders, removeReminder, toggleReminder } = useReminders();

  // 按截止日期排序
  const sortedReminders = useMemo(() => {
    return [...reminders].sort((a, b) => {
      const daysA = getDaysUntilDeadline(a.deadline);
      const daysB = getDaysUntilDeadline(b.deadline);

      // 无法解析的放最后
      if (daysA === null && daysB === null) return 0;
      if (daysA === null) return 1;
      if (daysB === null) return -1;

      // 已截止的放最后
      if (daysA < 0 && daysB < 0) return daysB - daysA;
      if (daysA < 0) return 1;
      if (daysB < 0) return -1;

      // 按剩余天数升序
      return daysA - daysB;
    });
  }, [reminders]);

  // 统计数据
  const stats = useMemo(() => {
    const total = reminders.length;
    const active = reminders.filter((r) => r.active).length;
    const urgent = reminders.filter((r) => {
      const days = getDaysUntilDeadline(r.deadline);
      return days !== null && days >= 0 && days <= 7;
    }).length;
    return { total, active, urgent };
  }, [reminders]);

  const isEmpty = reminders.length === 0;

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation("/")}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">申请提醒</h1>
                <p className="text-sm text-muted-foreground">
                  {stats.total > 0 ? (
                    <>
                      共 {stats.total} 条提醒，{stats.active} 条启用
                      {stats.urgent > 0 && (
                        <span className="text-orange-500 ml-2">
                          {stats.urgent} 条临近截止
                        </span>
                      )}
                    </>
                  ) : (
                    "管理您的申请截止日期提醒"
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {isEmpty ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mb-6">
                <Bell className="w-12 h-12 text-muted-foreground/50" />
              </div>
              <h2 className="text-xl font-semibold mb-2">暂无提醒</h2>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                在院校详情页面点击"设置提醒"按钮，即可添加申请截止日期提醒
              </p>
              <Button onClick={() => setLocation("/")}>
                <Plus className="w-4 h-4 mr-2" />
                浏览院校
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {sortedReminders.map((reminder, index) => {
                const days = getDaysUntilDeadline(reminder.deadline);
                const status = getDeadlineStatus(days);
                const isExpired = days !== null && days < 0;

                return (
                  <motion.div
                    key={reminder.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      className={`overflow-hidden transition-all ${
                        isExpired ? "opacity-60" : ""
                      } ${status.urgent && !isExpired ? "border-orange-300 dark:border-orange-700" : ""}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          {/* 左侧图标 */}
                          <div
                            className={`shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${
                              reminder.active && !isExpired
                                ? "bg-primary/10"
                                : "bg-muted"
                            }`}
                          >
                            {reminder.active && !isExpired ? (
                              <Bell className="w-6 h-6 text-primary" />
                            ) : (
                              <BellOff className="w-6 h-6 text-muted-foreground" />
                            )}
                          </div>

                          {/* 中间内容 */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold truncate">
                                {reminder.universityName}
                              </h3>
                              <Badge className={status.className}>
                                {status.label}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {reminder.deadline}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                提前 {reminder.reminderDate} 天提醒
                              </span>
                            </div>
                          </div>

                          {/* 右侧操作 */}
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {reminder.active ? "已启用" : "已停用"}
                              </span>
                              <Switch
                                checked={reminder.active}
                                onCheckedChange={() =>
                                  toggleReminder(reminder.id)
                                }
                                disabled={isExpired}
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeReminder(reminder.id)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* 紧急提示 */}
                        {status.urgent && !isExpired && reminder.active && (
                          <div className="mt-3 pt-3 border-t flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
                            <AlertCircle className="w-4 h-4" />
                            <span>请尽快完成申请材料准备！</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}

              {/* 底部提示 */}
              <div className="mt-8 p-4 bg-muted/30 rounded-lg text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <span className="text-primary">提示：</span>
                  提醒功能基于浏览器本地存储，清除浏览器数据会导致提醒丢失。建议同时使用日历等工具记录重要日期。
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
