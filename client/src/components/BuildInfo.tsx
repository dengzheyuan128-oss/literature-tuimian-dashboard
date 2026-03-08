/**
 * BuildInfo 组件
 * 显示构建信息：commit hash、universities数据条目数、最后更新时间
 * 用于验收数据部署是否成功
 */

import { usePublicProgramCards } from "@/lib/publicProgramCards";

// 这些全局变量由vite.config.ts在构建时注入
declare const __BUILD_COMMIT__: string;
declare const __BUILD_TIME__: string;

export function BuildInfo() {
  const { cards, lastUpdated, source, configured, error, supabaseHost } = usePublicProgramCards({ limit: 1 });
  const buildCommit = typeof __BUILD_COMMIT__ !== "undefined" ? __BUILD_COMMIT__ : "unknown";
  const buildTime = typeof __BUILD_TIME__ !== "undefined" ? __BUILD_TIME__ : "unknown";
  const universitiesCount = cards.length;

  // 格式化时间
  const formatTime = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleString("zh-CN");
    } catch {
      return isoString;
    }
  };

  return (
    <div className="flex flex-col gap-1 text-xs text-muted-foreground">
      <div className="flex items-center gap-2">
        <span className="font-mono bg-secondary px-2 py-1 rounded">Build: {buildCommit}</span>
      </div>
      <div className="flex items-center gap-2">
        <span>Universities: {universitiesCount} 所</span>
      </div>
      <div className="flex items-center gap-2">
        <span>Data Updated: {lastUpdated}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground/70">Source: {source}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground/70">Supabase: {configured ? "configured" : "missing-env"}</span>
      </div>
      {supabaseHost ? (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground/70">Host: {supabaseHost}</span>
        </div>
      ) : null}
      {error ? (
        <div className="flex items-center gap-2">
          <span className="max-w-[240px] break-words text-[11px] text-destructive">Error: {error}</span>
        </div>
      ) : null}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground/70">Built: {formatTime(buildTime)}</span>
      </div>
    </div>
  );
}
