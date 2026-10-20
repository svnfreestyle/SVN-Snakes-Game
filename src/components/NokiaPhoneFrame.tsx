import React from 'react';
import { Point } from '../types';
import { sound } from '../audio';

interface NokiaPhoneFrameProps {
  children: React.ReactNode;
  onDirection: (dir: Point) => void;
  onNaviKey: () => void;
  onCKey: () => void;
  isPaused: boolean;
  isPlaying: boolean;
}

export const NokiaPhoneFrame: React.FC<NokiaPhoneFrameProps> = ({
  children,
  onDirection,
  onNaviKey,
  onCKey,
  isPaused,
  isPlaying,
}) => {
  const handleKeyClick = (dir?: Point, action?: () => void) => {
    sound.playKeyClick();
    if (dir) onDirection(dir);
    if (action) action();
  };

  return (
    <div className="relative mx-auto w-full max-w-[340px] sm:max-w-[380px] select-none">
      {/* 3310 Phone Outer Shell */}
      <div className="relative rounded-[48px] bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-5 pt-4 shadow-2xl border-4 border-slate-700/60 ring-1 ring-slate-950/80">
        
        {/* Subtle highlight sheen */}
        <div className="absolute inset-x-8 top-1 h-3 rounded-full bg-white/5 blur-xs pointer-events-none" />

        {/* Earpiece speaker grill */}
        <div className="mx-auto mb-2.5 h-1.5 w-14 rounded-full bg-slate-950 border-t border-slate-700/50 shadow-inner" />

        {/* Nokia Vintage Wordmark */}
        <div className="text-center font-bold tracking-[0.25em] text-slate-400/90 text-[11px] mb-2 font-mono drop-shadow">
          NOKIA
        </div>

        {/* Screen Bezel Housing */}
        <div className="relative rounded-2xl bg-zinc-950 p-3 pt-2.5 pb-2.5 shadow-inner border-2 border-slate-900/90 ring-1 ring-slate-700/30">
          {/* Inner LCD Bezel with soft reflection */}
          <div className="relative overflow-hidden rounded-lg bg-zinc-900 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)] border border-zinc-800">
            {children}
          </div>
        </div>

        {/* Upper Control Bar (Navi key, C key, Sub-keys) */}
        <div className="mt-4 mb-3 px-2">
          {/* Top row: Left Softkey, Large Navi Key, Right Softkey */}
          <div className="flex items-center justify-between gap-3 mb-2">
            {/* Left Softkey */}
            <button
              type="button"
              onClick={() => handleKeyClick(undefined, onNaviKey)}
              aria-label="Menu Select"
              className="keypad-btn h-8 flex-1 rounded-full bg-gradient-to-b from-slate-600 to-slate-700 text-[10px] font-semibold text-slate-200 border-t border-slate-500 active:scale-95 flex items-center justify-center shadow-md cursor-pointer"
            >
              <div className="w-4 h-0.5 bg-slate-300 rounded-full" />
            </button>

            {/* Central Iconic Blue/Cyan Navi Key */}
            <button
              type="button"
              onClick={() => handleKeyClick(undefined, onNaviKey)}
              aria-label="Navi Key Start/Pause"
              className="nokia-btn h-11 w-24 rounded-full bg-gradient-to-b from-sky-600 to-sky-700 active:from-sky-700 active:to-sky-800 text-white font-tech font-bold text-xs tracking-wider border-t border-sky-400 active:scale-95 flex flex-col items-center justify-center shadow-lg cursor-pointer transition-transform"
            >
              <span>{isPlaying ? (isPaused ? 'RESUME' : 'PAUSE') : 'START'}</span>
            </button>

            {/* Right Clear 'C' Key */}
            <button
              type="button"
              onClick={() => handleKeyClick(undefined, onCKey)}
              aria-label="Clear or Back"
              className="keypad-btn h-8 flex-1 rounded-full bg-gradient-to-b from-slate-600 to-slate-700 text-[10px] font-bold text-slate-300 border-t border-slate-500 active:scale-95 flex items-center justify-center shadow-md cursor-pointer"
            >
              C
            </button>
          </div>
        </div>

        {/* 12-Button Numeric Phone Keypad */}
        <div className="grid grid-cols-3 gap-2 px-3 pt-1 pb-2">
          {/* Row 1: 1, 2 (UP), 3 */}
          <button
            type="button"
            onClick={() => handleKeyClick()}
            className="keypad-btn h-10 rounded-xl bg-gradient-to-b from-slate-700 to-slate-800 text-slate-300 border-t border-slate-600 flex flex-col items-center justify-center text-xs font-mono shadow-md cursor-pointer"
          >
            <span className="font-bold text-sm leading-none">1</span>
            <span className="text-[8px] text-slate-400 leading-none">. _</span>
          </button>

          <button
            type="button"
            onClick={() => handleKeyClick({ x: 0, y: -1 })}
            aria-label="2 Up"
            className="keypad-btn h-10 rounded-xl bg-gradient-to-b from-slate-600 to-slate-800 text-white border-t border-emerald-400/50 flex flex-col items-center justify-center text-xs font-mono shadow-md cursor-pointer ring-1 ring-emerald-500/20 active:ring-emerald-400"
          >
            <span className="font-bold text-sm leading-none flex items-center gap-1 text-emerald-400">
              ▲ 2
            </span>
            <span className="text-[8px] text-slate-400 leading-none">ABC</span>
          </button>

          <button
            type="button"
            onClick={() => handleKeyClick()}
            className="keypad-btn h-10 rounded-xl bg-gradient-to-b from-slate-700 to-slate-800 text-slate-300 border-t border-slate-600 flex flex-col items-center justify-center text-xs font-mono shadow-md cursor-pointer"
          >
            <span className="font-bold text-sm leading-none">3</span>
            <span className="text-[8px] text-slate-400 leading-none">DEF</span>
          </button>

          {/* Row 2: 4 (LEFT), 5 (ACTION), 6 (RIGHT) */}
          <button
            type="button"
            onClick={() => handleKeyClick({ x: -1, y: 0 })}
            aria-label="4 Left"
            className="keypad-btn h-10 rounded-xl bg-gradient-to-b from-slate-600 to-slate-800 text-white border-t border-emerald-400/50 flex flex-col items-center justify-center text-xs font-mono shadow-md cursor-pointer ring-1 ring-emerald-500/20 active:ring-emerald-400"
          >
            <span className="font-bold text-sm leading-none flex items-center gap-1 text-emerald-400">
              ◀ 4
            </span>
            <span className="text-[8px] text-slate-400 leading-none">GHI</span>
          </button>

          <button
            type="button"
            onClick={() => handleKeyClick(undefined, onNaviKey)}
            aria-label="5 Center Action"
            className="keypad-btn h-10 rounded-xl bg-gradient-to-b from-slate-700 to-slate-800 text-slate-200 border-t border-slate-600 flex flex-col items-center justify-center text-xs font-mono shadow-md cursor-pointer"
          >
            <span className="font-bold text-sm leading-none">5</span>
            <span className="text-[8px] text-slate-400 leading-none">JKL</span>
          </button>

          <button
            type="button"
            onClick={() => handleKeyClick({ x: 1, y: 0 })}
            aria-label="6 Right"
            className="keypad-btn h-10 rounded-xl bg-gradient-to-b from-slate-600 to-slate-800 text-white border-t border-emerald-400/50 flex flex-col items-center justify-center text-xs font-mono shadow-md cursor-pointer ring-1 ring-emerald-500/20 active:ring-emerald-400"
          >
            <span className="font-bold text-sm leading-none flex items-center gap-1 text-emerald-400">
              6 ▶
            </span>
            <span className="text-[8px] text-slate-400 leading-none">MNO</span>
          </button>

          {/* Row 3: 7, 8 (DOWN), 9 */}
          <button
            type="button"
            onClick={() => handleKeyClick()}
            className="keypad-btn h-10 rounded-xl bg-gradient-to-b from-slate-700 to-slate-800 text-slate-300 border-t border-slate-600 flex flex-col items-center justify-center text-xs font-mono shadow-md cursor-pointer"
          >
            <span className="font-bold text-sm leading-none">7</span>
            <span className="text-[8px] text-slate-400 leading-none">PQRS</span>
          </button>

          <button
            type="button"
            onClick={() => handleKeyClick({ x: 0, y: 1 })}
            aria-label="8 Down"
            className="keypad-btn h-10 rounded-xl bg-gradient-to-b from-slate-600 to-slate-800 text-white border-t border-emerald-400/50 flex flex-col items-center justify-center text-xs font-mono shadow-md cursor-pointer ring-1 ring-emerald-500/20 active:ring-emerald-400"
          >
            <span className="font-bold text-sm leading-none flex items-center gap-1 text-emerald-400">
              ▼ 8
            </span>
            <span className="text-[8px] text-slate-400 leading-none">TUV</span>
          </button>

          <button
            type="button"
            onClick={() => handleKeyClick()}
            className="keypad-btn h-10 rounded-xl bg-gradient-to-b from-slate-700 to-slate-800 text-slate-300 border-t border-slate-600 flex flex-col items-center justify-center text-xs font-mono shadow-md cursor-pointer"
          >
            <span className="font-bold text-sm leading-none">9</span>
            <span className="text-[8px] text-slate-400 leading-none">WXYZ</span>
          </button>

          {/* Row 4: *, 0, # */}
          <button
            type="button"
            onClick={() => handleKeyClick()}
            className="keypad-btn h-9 rounded-xl bg-gradient-to-b from-slate-700 to-slate-800 text-slate-400 border-t border-slate-600 flex items-center justify-center text-xs font-mono shadow-md cursor-pointer"
          >
            *
          </button>
          <button
            type="button"
            onClick={() => handleKeyClick()}
            className="keypad-btn h-9 rounded-xl bg-gradient-to-b from-slate-700 to-slate-800 text-slate-300 border-t border-slate-600 flex flex-col items-center justify-center text-xs font-mono shadow-md cursor-pointer"
          >
            <span className="font-bold text-xs leading-none">0</span>
            <span className="text-[7px] text-slate-400 leading-none">+</span>
          </button>
          <button
            type="button"
            onClick={() => handleKeyClick()}
            className="keypad-btn h-9 rounded-xl bg-gradient-to-b from-slate-700 to-slate-800 text-slate-400 border-t border-slate-600 flex items-center justify-center text-xs font-mono shadow-md cursor-pointer"
          >
            #
          </button>
        </div>

        {/* Bottom mic hole */}
        <div className="mx-auto mt-2 h-1 w-1 rounded-full bg-slate-950" />
      </div>
    </div>
  );
};
