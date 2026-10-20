import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Play, Pause } from 'lucide-react';
import { Point } from '../types';
import { sound } from '../audio';

interface TouchDpadProps {
  onDirection: (dir: Point) => void;
  onAction?: () => void;
  isPaused?: boolean;
  className?: string;
}

export const TouchDpad: React.FC<TouchDpadProps> = ({
  onDirection,
  onAction,
  isPaused = false,
  className = '',
}) => {
  const handlePress = (e: React.TouchEvent | React.MouseEvent, dir: Point) => {
    e.preventDefault();
    sound.playTurn();
    onDirection(dir);
  };

  const handleAction = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    sound.playKeyClick();
    if (onAction) onAction();
  };

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      {/* Up Button */}
      <div className="flex justify-center mb-1">
        <button
          type="button"
          onTouchStart={(e) => handlePress(e, { x: 0, y: -1 })}
          onClick={(e) => handlePress(e, { x: 0, y: -1 })}
          aria-label="Up"
          className="w-16 h-14 bg-zinc-800/90 active:bg-zinc-700 text-zinc-100 border border-zinc-700/60 rounded-t-xl rounded-b-md shadow-lg flex items-center justify-center transition-transform active:scale-95"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
      </div>

      {/* Middle Row: Left, Action/Center, Right */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onTouchStart={(e) => handlePress(e, { x: -1, y: 0 })}
          onClick={(e) => handlePress(e, { x: -1, y: 0 })}
          aria-label="Left"
          className="w-14 h-16 bg-zinc-800/90 active:bg-zinc-700 text-zinc-100 border border-zinc-700/60 rounded-l-xl rounded-r-md shadow-lg flex items-center justify-center transition-transform active:scale-95"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        {/* Center Pause/Action Button */}
        <button
          type="button"
          onTouchStart={handleAction}
          onClick={handleAction}
          aria-label="Pause or Action"
          className="w-14 h-14 bg-emerald-600/90 active:bg-emerald-500 text-white rounded-lg shadow-md flex items-center justify-center border border-emerald-400/40 transition-transform active:scale-95"
        >
          {isPaused ? <Play className="w-5 h-5 fill-current ml-0.5" /> : <Pause className="w-5 h-5 fill-current" />}
        </button>

        <button
          type="button"
          onTouchStart={(e) => handlePress(e, { x: 1, y: 0 })}
          onClick={(e) => handlePress(e, { x: 1, y: 0 })}
          aria-label="Right"
          className="w-14 h-16 bg-zinc-800/90 active:bg-zinc-700 text-zinc-100 border border-zinc-700/60 rounded-r-xl rounded-l-md shadow-lg flex items-center justify-center transition-transform active:scale-95"
        >
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>

      {/* Down Button */}
      <div className="flex justify-center mt-1">
        <button
          type="button"
          onTouchStart={(e) => handlePress(e, { x: 0, y: 1 })}
          onClick={(e) => handlePress(e, { x: 0, y: 1 })}
          aria-label="Down"
          className="w-16 h-14 bg-zinc-800/90 active:bg-zinc-700 text-zinc-100 border border-zinc-700/60 rounded-b-xl rounded-t-md shadow-lg flex items-center justify-center transition-transform active:scale-95"
        >
          <ArrowDown className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
