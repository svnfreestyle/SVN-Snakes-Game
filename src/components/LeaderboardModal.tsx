import React, { useState } from 'react';
import { X, Trophy, RefreshCw, Shield, Zap } from 'lucide-react';
import { ScoreEntry, GameSpeed } from '../types';
import { sound } from '../audio';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  scores: ScoreEntry[];
  isLoading: boolean;
  onRefresh: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  scores,
  isLoading,
  onRefresh,
}) => {
  const [filterSpeed, setFilterSpeed] = useState<string>('all');

  if (!isOpen) return null;

  const filtered = scores.filter((item) => {
    if (filterSpeed === 'all') return true;
    return item.speed === filterSpeed;
  });

  const formatDate = (timestamp: number) => {
    try {
      const diff = Date.now() - timestamp;
      const minutes = Math.floor(diff / 60000);
      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-zinc-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/90">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold tracking-tight font-tech">SVN HALL OF FAME</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                sound.playKeyClick();
                onRefresh();
              }}
              disabled={isLoading}
              title="Refresh Leaderboard"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => {
                sound.playKeyClick();
                onClose();
              }}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 px-4 py-2 bg-zinc-950/60 border-b border-zinc-800/80 text-xs">
          {(['all', 'normal', 'fast', 'extreme'] as const).map((speed) => (
            <button
              key={speed}
              type="button"
              onClick={() => {
                sound.playKeyClick();
                setFilterSpeed(speed);
              }}
              className={`px-3 py-1 rounded-md capitalize transition-colors font-mono ${
                filterSpeed === speed
                  ? 'bg-zinc-800 text-white font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {speed}
            </button>
          ))}
        </div>

        {/* Scores List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 divide-y divide-zinc-800/50">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 font-mono text-sm">
              No scores recorded yet for this speed.
            </div>
          ) : (
            filtered.map((item, index) => {
              const rank = index + 1;
              const isTop3 = rank <= 3;
              let rankBadgeClass = 'text-zinc-500';
              if (rank === 1) rankBadgeClass = 'text-amber-400 font-bold';
              else if (rank === 2) rankBadgeClass = 'text-slate-300 font-bold';
              else if (rank === 3) rankBadgeClass = 'text-amber-600 font-bold';

              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between py-2.5 px-2 rounded-lg transition-colors hover:bg-zinc-800/40 ${
                    rank === 1 ? 'bg-amber-500/5' : ''
                  }`}
                >
                  {/* Left: Rank & Name */}
                  <div className="flex items-center gap-3">
                    <span className={`w-6 text-right font-mono text-sm ${rankBadgeClass}`}>
                      {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                    </span>
                    <div>
                      <div className="font-tech font-bold text-sm tracking-wide text-zinc-100 flex items-center gap-1.5">
                        {item.name}
                        {rank === 1 && (
                          <span className="text-[10px] text-amber-400 font-mono">TOP SCORER</span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-500 flex items-center gap-1">
                        <span className="capitalize">{item.speed}</span>
                        <span aria-hidden="true">·</span>
                        <span>{item.walls ? 'Walls ON' : 'Wrap-around'}</span>
                        <span aria-hidden="true">·</span>
                        <span>{formatDate(item.timestamp)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Score */}
                  <div className="text-right">
                    <div className="font-pixel text-2xl text-emerald-400 tracking-wider font-bold tabular-nums">
                      {item.score}
                    </div>
                    <div className="text-[9px] uppercase tracking-wider text-zinc-500 font-mono">
                      PTS
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-950/70 text-center text-xs text-zinc-400 font-mono">
          Scores automatically verified & stored on server
        </div>
      </div>
    </div>
  );
};
