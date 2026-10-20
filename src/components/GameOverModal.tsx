import React, { useState } from 'react';
import { Trophy, RotateCcw, Send, Check } from 'lucide-react';
import { GameSpeed, ThemeColors } from '../types';
import { sound } from '../audio';
import { getSavedPlayerName, submitScore } from '../api/leaderboard';

interface GameOverModalProps {
  isOpen: boolean;
  score: number;
  level: number;
  length: number;
  foodsEaten: number;
  speed: GameSpeed;
  walls: boolean;
  theme: ThemeColors;
  isNewBest: boolean;
  onPlayAgain: () => void;
  onScoreSaved: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  score,
  level,
  length,
  foodsEaten,
  speed,
  walls,
  theme,
  isNewBest,
  onPlayAgain,
  onScoreSaved,
}) => {
  const [playerName, setPlayerName] = useState<string>(() => getSavedPlayerName());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || isSubmitting || isSubmitted) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    sound.playKeyClick();

    try {
      const result = await submitScore(playerName, score, speed, walls);
      if (result.success) {
        setIsSubmitted(true);
        sound.playHighscore();
        onScoreSaved();
      } else {
        setErrorMsg(result.error || 'Failed to submit score');
      }
    } catch {
      setErrorMsg('Network error, saved locally');
      setIsSubmitted(true);
      onScoreSaved();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-6 text-center text-zinc-100">
        
        {/* Retro Header */}
        <div className="mb-4">
          <div className="font-pixel text-4xl text-rose-500 tracking-wider font-bold mb-1">
            GAME OVER
          </div>
          {isNewBest ? (
            <div className="text-amber-400 font-tech text-xs tracking-wider font-semibold animate-pulse">
              ★ NEW PERSONAL RECORD ★
            </div>
          ) : (
            <div className="text-zinc-400 text-xs font-mono">
              Nokia 3310 Snake Simulation
            </div>
          )}
        </div>

        {/* Score Readout Box */}
        <div className="my-4 rounded-xl bg-zinc-950 p-4 border border-zinc-800/80">
          <div className="text-xs uppercase tracking-wider text-zinc-500 font-mono mb-1">
            Final Score
          </div>
          <div className="font-pixel text-5xl text-emerald-400 font-bold tracking-widest tabular-nums">
            {score}
          </div>
          <div className="mt-2.5 flex items-center justify-center gap-2.5 text-xs text-zinc-400 font-mono">
            <span>Level: <strong className="text-amber-400">LV {level}</strong></span>
            <span aria-hidden="true">·</span>
            <span>Food: <strong className="text-zinc-200">{foodsEaten}</strong></span>
            <span aria-hidden="true">·</span>
            <span>Length: <strong className="text-zinc-200">{length}</strong></span>
            <span aria-hidden="true">·</span>
            <span className="capitalize">{speed}</span>
          </div>
        </div>

        {/* Leaderboard Name Submission Form */}
        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="mb-5 text-left">
            <label htmlFor="player-name" className="block text-xs font-mono text-zinc-400 mb-1.5">
              Enter your name for Leaderboard:
            </label>
            <div className="flex gap-2">
              <input
                id="player-name"
                type="text"
                maxLength={12}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
                placeholder="PLAYER"
                className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-tech font-bold text-zinc-100 tracking-wider focus:outline-hidden focus:border-emerald-500 uppercase"
              />
              <button
                type="submit"
                disabled={isSubmitting || !playerName.trim()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-tech text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-md cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="animate-spin text-sm">⟳</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>SAVE</span>
                  </>
                )}
              </button>
            </div>
            {errorMsg && (
              <div className="text-[11px] text-rose-400 mt-1 font-mono">{errorMsg}</div>
            )}
          </form>
        ) : (
          <div className="mb-5 py-2 px-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-400 text-xs font-tech flex items-center justify-center gap-2">
            <Check className="w-4 h-4" />
            <span>Score saved to SVN Leaderboard!</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              sound.playKeyClick();
              onPlayAgain();
            }}
            className="w-full py-3 bg-zinc-100 hover:bg-white text-zinc-950 font-tech font-bold text-sm tracking-wider rounded-xl transition-all shadow-lg active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>PLAY AGAIN (ENTER / SPACE)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
