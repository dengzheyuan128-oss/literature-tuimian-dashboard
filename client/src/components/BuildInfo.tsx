import { useRef, useState } from 'react';

import { usePublicProgramCards } from '@/lib/publicProgramCards';

declare const __BUILD_COMMIT__: string;
declare const __BUILD_TIME__: string;

export function BuildInfo() {
  const { cards, lastUpdated, source, configured, error, supabaseHost, totalCount, institutionCount } =
    usePublicProgramCards({ limit: 1 });
  const buildCommit = typeof __BUILD_COMMIT__ !== 'undefined' ? __BUILD_COMMIT__ : 'unknown';
  const buildTime = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : 'unknown';
  const entriesCount = totalCount ?? cards.length;
  const [position, setPosition] = useState({ x: 16, y: 16 });
  const dragOffset = useRef({ x: 0, y: 0 });

  const formatTime = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleString('zh-CN');
    } catch {
      return isoString;
    }
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    dragOffset.current = {
      x: viewportWidth - position.x - event.clientX,
      y: viewportHeight - position.y - event.clientY,
    };

    const pointerId = event.pointerId;
    event.currentTarget.setPointerCapture(pointerId);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const nextX = Math.max(16, window.innerWidth - moveEvent.clientX - dragOffset.current.x);
      const nextY = Math.max(16, window.innerHeight - moveEvent.clientY - dragOffset.current.y);
      setPosition({ x: nextX, y: nextY });
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  return (
    <div
      className="fixed z-40 bg-card/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg max-w-[280px]"
      style={{ right: position.x, bottom: position.y }}
    >
      <div
        className="mb-2 cursor-move rounded bg-secondary/60 px-2 py-1 text-[11px] text-muted-foreground select-none"
        onPointerDown={handlePointerDown}
      >
        拖动诊断面板
      </div>

      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="font-mono bg-secondary px-2 py-1 rounded">Build: {buildCommit}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Entries: {entriesCount}</span>
        </div>
        {institutionCount ? (
          <div className="flex items-center gap-2">
            <span>Institutions: {institutionCount}</span>
          </div>
        ) : null}
        <div className="flex items-center gap-2">
          <span>Data Updated: {lastUpdated}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground/70">Source: {source}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground/70">Supabase: {configured ? 'configured' : 'missing-env'}</span>
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
    </div>
  );
}
