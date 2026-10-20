import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Trophy,
  Volume2,
  VolumeX,
  Smartphone,
  Maximize2,
  RotateCcw,
  Play,
  Pause,
  HelpCircle,
  Sliders,
  Shield,
  Zap,
} from 'lucide-react';
import {
  GameState,
  GameSpeed,
  ThemeId,
  ViewMode,
  Point,
  ScoreEntry,
  THEMES,
} from './types';
import { SnakeEngine } from './engine/snakeEngine';
import { GameCanvas } from './components/GameCanvas';
import { NokiaPhoneFrame } from './components/NokiaPhoneFrame';
import { TouchDpad } from './components/TouchDpad';
import { LeaderboardModal } from './components/LeaderboardModal';
import { GameOverModal } from './components/GameOverModal';
import { sound } from './audio';
import {
  fetchLeaderboard,
  getPersonalBest,
  setPersonalBest,
  getCachedLeaderboard,
} from './api/leaderboard';

export default function App() {
  // Game Configuration State
  const [speed, setSpeed] = useState<GameSpeed>('normal');
  const [walls, setWalls] = useState<boolean>(true);
  const [themeId, setThemeId] = useState<ThemeId>('dark-oled');
  const [viewMode, setViewMode] = useState<ViewMode>('phone');
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.getMuted());

  // Game Engine & Simulation State
  const engineRef = useRef<SnakeEngine>(
    new SnakeEngine({ speed: 'normal', walls: true })
  );
  const [gameState, setGameState] = useState<GameState>('TITLE');
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => getPersonalBest());
  const [snakeLength, setSnakeLength] = useState<number>(4);
  const [foodsEaten, setFoodsEaten] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [levelProgress, setLevelProgress] = useState<number>(0);
  const [levelUpNotification, setLevelUpNotification] = useState<number | null>(null);
  const [bonusActive, setBonusActive] = useState<boolean>(false);
  const [isNewPersonalRecord, setIsNewPersonalRecord] = useState<boolean>(false);

  // Leaderboard Modal State
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);
  const [leaderboardScores, setLeaderboardScores] = useState<ScoreEntry[]>(() =>
    getCachedLeaderboard()
  );
  const [isLoadingScores, setIsLoadingScores] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Swipe Gesture Tracking
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  const currentTheme = THEMES[themeId];

  // Refresh server leaderboard
  const loadLeaderboard = useCallback(async () => {
    setIsLoadingScores(true);
    try {
      const scores = await fetchLeaderboard();
      setLeaderboardScores(scores);
    } finally {
      setIsLoadingScores(false);
    }
  }, []);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  // Sync engine configuration when speed or walls options change
  useEffect(() => {
    engineRef.current.config.speed = speed;
    engineRef.current.config.walls = walls;
    engineRef.current.updateSpeed();
  }, [speed, walls]);

  // Steer snake handler (active in playing and can pre-steer while paused)
  const handleDirection = useCallback(
    (dir: Point) => {
      if (gameState === 'PLAYING' || gameState === 'PAUSED') {
        const queued = engineRef.current.queueDirection(dir);
        if (queued) {
          sound.playTurn();
        }
      }
    },
    [gameState]
  );

  // Start or restart game
  const startGame = useCallback(() => {
    sound.playKeyClick();
    engineRef.current.config = { speed, walls };
    engineRef.current.reset();
    setScore(0);
    setFoodsEaten(0);
    setLevel(1);
    setLevelProgress(0);
    setLevelUpNotification(null);
    setSnakeLength(4);
    setBonusActive(false);
    setIsNewPersonalRecord(false);
    setGameState('PLAYING');
  }, [speed, walls]);

  // Pause / Resume toggle
  const togglePause = useCallback(() => {
    if (gameState === 'PLAYING') {
      sound.playKeyClick();
      engineRef.current.isPaused = true;
      setGameState('PAUSED');
    } else if (gameState === 'PAUSED') {
      sound.playKeyClick();
      engineRef.current.isPaused = false;
      setGameState('PLAYING');
    }
  }, [gameState]);

  // Toggle sound
  const handleToggleMute = () => {
    const next = sound.toggleMute();
    setIsMuted(next);
  };

  // Main Game Loop using tickIntervalMs
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    let timeoutId: number;

    const runLoop = () => {
      const engine = engineRef.current;
      const result = engine.tick();

      // Synchronize lightweight React UI state
      setScore(engine.score);
      setFoodsEaten(engine.foodsEaten);
      setLevel(engine.level);
      setLevelProgress(engine.levelProgress);
      setSnakeLength(engine.snake.length);
      setBonusActive(engine.bonus !== null);

      if (result.leveledUp) {
        sound.playLevelUp();
        setLevelUpNotification(result.level);
        window.setTimeout(() => {
          setLevelUpNotification(null);
        }, 1800);
      } else if (result.ateFood) {
        sound.playEat();
      } else if (result.ateBonus) {
        sound.playBonus();
      } else if (result.bonusSpawned) {
        sound.playBonusSpawn();
      }

      if (result.died) {
        sound.playHit();
        setTimeout(() => sound.playGameOver(), 200);

        const best = getPersonalBest();
        if (engine.score > best) {
          setIsNewPersonalRecord(true);
          setPersonalBest(engine.score);
          setHighScore(engine.score);
        }

        setGameState('GAME_OVER');
        return;
      }

      // Schedule next tick based on dynamic engine speed
      timeoutId = window.setTimeout(runLoop, engine.tickIntervalMs);
    };

    timeoutId = window.setTimeout(runLoop, engineRef.current.tickIntervalMs);

    return () => clearTimeout(timeoutId);
  }, [gameState]);

  // Global Keyboard Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input field
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
        case 'k':
        case 'K':
        case '8': // Nokia Numpad 8
          e.preventDefault();
          handleDirection({ x: 0, y: -1 });
          break;

        case 'ArrowDown':
        case 's':
        case 'S':
        case 'j':
        case 'J':
        case '2': // Nokia Numpad 2
          e.preventDefault();
          handleDirection({ x: 0, y: 1 });
          break;

        case 'ArrowLeft':
        case 'a':
        case 'A':
        case 'h':
        case 'H':
        case '4': // Nokia Numpad 4
          e.preventDefault();
          handleDirection({ x: -1, y: 0 });
          break;

        case 'ArrowRight':
        case 'd':
        case 'D':
        case 'l':
        case 'L':
        case '6': // Nokia Numpad 6
          e.preventDefault();
          handleDirection({ x: 1, y: 0 });
          break;

        case ' ': // Space = Pause or Start
          e.preventDefault();
          if (gameState === 'PLAYING' || gameState === 'PAUSED') {
            togglePause();
          } else if (gameState === 'TITLE' || gameState === 'GAME_OVER') {
            startGame();
          }
          break;

        case 'Enter':
          e.preventDefault();
          if (gameState === 'TITLE' || gameState === 'GAME_OVER') {
            startGame();
          } else if (gameState === 'PAUSED') {
            togglePause();
          }
          break;

        case 'Escape':
        case 'c':
        case 'C':
          e.preventDefault();
          if (gameState === 'PLAYING') {
            togglePause();
          } else if (gameState === 'PAUSED') {
            setGameState('TITLE');
          }
          break;

        case 'm':
        case 'M':
          handleToggleMute();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, handleDirection, startGame, togglePause]);

  // Touch Swipe Handlers for mobile playfield
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartPos.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartPos.current.x;
    const dy = touch.clientY - touchStartPos.current.y;
    touchStartPos.current = null;

    const minSwipeDistance = 25;
    if (Math.abs(dx) < minSwipeDistance && Math.abs(dy) < minSwipeDistance) {
      return;
    }

    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal swipe
      if (dx > 0) handleDirection({ x: 1, y: 0 });
      else handleDirection({ x: -1, y: 0 });
    } else {
      // Vertical swipe
      if (dy > 0) handleDirection({ x: 0, y: 1 });
      else handleDirection({ x: 0, y: -1 });
    }
  };

  // Screen HUD bar content (Score, Level, Progress bar, High Score)
  const renderScreenHeader = () => (
    <div
      className="flex items-center justify-between px-3 py-1.5 border-b select-none font-mono text-[11px] font-bold"
      style={{
        backgroundColor: currentTheme.lcdBg,
        borderColor: currentTheme.wallColor,
        color: currentTheme.textPrimary,
      }}
    >
      {/* Left: Score */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] opacity-75">SCORE:</span>
        <span className="font-pixel text-base tracking-wider tabular-nums">
          {score}
        </span>
      </div>

      {/* Center: Level & Progressive Challenge Meter */}
      <div className="flex items-center gap-1.5">
        <span
          className="text-[10px] px-1 py-0.5 rounded font-tech font-bold"
          style={{
            backgroundColor: 'rgba(0,0,0,0.25)',
            border: `1px solid ${currentTheme.wallColor}`,
          }}
        >
          LV <span className="font-pixel text-sm">{level}</span>
        </span>
        {/* 10-dot progressive food meter to next speed increase */}
        <div
          className="hidden xs:flex items-center gap-0.5"
          title={`Progress to Level ${level + 1}: ${levelProgress}/10 food items`}
        >
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-xs transition-colors"
              style={{
                backgroundColor:
                  i < levelProgress ? currentTheme.snakeHead : currentTheme.wallColor,
                opacity: i < levelProgress ? 1 : 0.35,
              }}
            />
          ))}
        </div>
      </div>

      {/* Right: High Score & Bonus indicator */}
      <div className="flex items-center gap-2">
        {bonusActive && (
          <span
            className="animate-pulse text-[10px] px-1 rounded font-bold"
            style={{ color: currentTheme.bonusColor }}
          >
            ★ BUG!
          </span>
        )}
        <div className="flex items-center gap-1 text-[10px] opacity-80">
          <span>HI:</span>
          <span className="font-pixel text-sm tabular-nums">
            {Math.max(highScore, score)}
          </span>
        </div>
      </div>
    </div>
  );

  // Active Playfield Area (Canvas + overlays)
  const renderGameScreen = () => (
    <div
      className="relative w-full aspect-4/3 overflow-hidden select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{ backgroundColor: currentTheme.lcdBg }}
    >
      {/* HUD Header */}
      {renderScreenHeader()}

      {/* Level Up Flash Banner on Screen */}
      {levelUpNotification !== null && (
        <div
          className="absolute inset-x-3 top-9 py-1 px-2 rounded text-center z-30 font-tech font-bold text-xs tracking-wider shadow-lg border animate-bounce flex items-center justify-center gap-1"
          style={{
            backgroundColor: currentTheme.snakeHead,
            color: currentTheme.lcdBg,
            borderColor: currentTheme.snakeHead,
          }}
        >
          <span>▲ LEVEL {levelUpNotification}! SPEED INCREASED ▲</span>
        </div>
      )}

      {/* Main Canvas Viewport */}
      <div className="relative w-full h-[calc(100%-30px)]">
        <GameCanvas engine={engineRef.current} theme={currentTheme} />

        {/* Scanlines / LCD filter */}
        <div className="absolute inset-0 scanlines opacity-30 pointer-events-none" />

        {/* TITLE MENU OVERLAY */}
        {gameState === 'TITLE' && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-20"
            style={{ backgroundColor: currentTheme.lcdBg, color: currentTheme.textPrimary }}
          >
            {/* Nokia Pixel Snake Logo Lockup */}
            <div className="mb-2">
              <svg
                viewBox="0 0 160 36"
                className="w-48 max-w-full mx-auto"
                style={{ fill: currentTheme.snakeHead }}
              >
                {/* Pixelated snake silhouette lockup */}
                <rect x="10" y="4" width="8" height="8" />
                <rect x="18" y="4" width="8" height="8" />
                <rect x="26" y="4" width="8" height="8" />
                <rect x="26" y="12" width="8" height="8" />
                <rect x="26" y="20" width="8" height="8" />
                <rect x="34" y="20" width="8" height="8" />
                <rect x="42" y="20" width="8" height="8" />
                <rect x="50" y="20" width="8" height="8" />
                <rect x="58" y="20" width="8" height="8" />
                <rect x="58" y="12" width="8" height="8" />
                <rect x="58" y="4" width="8" height="8" />
                <rect x="66" y="4" width="8" height="8" />
                {/* Snake eye */}
                <rect x="70" y="6" width="2" height="2" fill={currentTheme.lcdBg} />
                {/* Food egg */}
                <rect x="86" y="6" width="6" height="6" fill={currentTheme.foodColor} />
              </svg>
              <h1 className="font-pixel text-3xl font-bold tracking-widest mt-1">
                SVN SNAKES
              </h1>
              <div className="font-tech text-[10px] tracking-widest uppercase opacity-80">
                Nokia 3310 Edition · {walls ? 'Solid Walls' : 'Wrap-Around'}
              </div>
            </div>

            {/* Best Score Banner */}
            <div
              className="px-3 py-1 rounded border mb-3 text-xs font-mono flex items-center gap-1.5"
              style={{
                borderColor: currentTheme.wallColor,
                backgroundColor: 'rgba(0,0,0,0.2)',
              }}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>RECORD: <strong className="font-pixel text-base">{highScore}</strong> PTS</span>
            </div>

            {/* Primary Start CTA */}
            <button
              type="button"
              onClick={startGame}
              className="px-6 py-2 rounded-lg font-tech font-bold text-sm tracking-wider shadow-lg active:scale-95 transition-transform cursor-pointer border"
              style={{
                backgroundColor: currentTheme.snakeHead,
                color: currentTheme.lcdBg,
                borderColor: currentTheme.snakeHead,
              }}
            >
              PRESS TO START
            </button>

            {/* Flat control-hint line */}
            <div className="mt-2 text-[10px] font-mono opacity-70">
              WASD / Arrows · Space Pause · 2/4/6/8 Keypad
            </div>
          </div>
        )}

        {/* PAUSED OVERLAY */}
        {gameState === 'PAUSED' && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-20 backdrop-blur-2xs"
            style={{ backgroundColor: 'rgba(0,0,0,0.65)', color: currentTheme.textPrimary }}
          >
            <div className="font-pixel text-3xl font-bold tracking-wider mb-2">
              PAUSED
            </div>
            <div className="text-xs font-mono opacity-80 mb-4">
              Current Score: <strong className="font-pixel text-base">{score}</strong>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={togglePause}
                className="px-4 py-1.5 rounded font-tech text-xs font-bold border active:scale-95 transition-transform"
                style={{
                  backgroundColor: currentTheme.snakeHead,
                  color: currentTheme.lcdBg,
                  borderColor: currentTheme.snakeHead,
                }}
              >
                RESUME
              </button>
              <button
                type="button"
                onClick={() => setGameState('TITLE')}
                className="px-4 py-1.5 rounded font-tech text-xs font-bold border border-zinc-600 bg-zinc-800 text-zinc-200 active:scale-95 transition-transform"
              >
                MENU
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-between select-none">
      
      {/* Top Application Bar (Clean 3-zone contract) */}
      <header className="w-full max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4 border-b border-zinc-800/80 bg-zinc-950/80 sticky top-0 z-30">
        
        {/* Brand Zone */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-6 h-6 rounded bg-emerald-500 flex items-center justify-center text-zinc-950 font-pixel font-bold text-lg">
            S
          </div>
          <span className="font-tech font-bold text-sm tracking-wider text-zinc-100 whitespace-nowrap">
            SVN SNAKES GAME
          </span>
        </div>

        {/* Center Mode Controls & Stats */}
        <div className="hidden sm:flex items-center gap-4 text-xs font-mono text-zinc-400">
          <span>Level: <strong className="text-amber-400">LV {level}</strong></span>
          <span aria-hidden="true">·</span>
          <span>Speed: <strong className="text-zinc-200 capitalize">{speed}</strong></span>
          <span aria-hidden="true">·</span>
          <span>Mode: <strong className="text-zinc-200">{walls ? 'Solid Walls' : 'Wrap-around'}</strong></span>
          <span aria-hidden="true">·</span>
          <span>Theme: <strong className="text-zinc-200">{currentTheme.name}</strong></span>
        </div>

        {/* Action Zone: Hall of Fame, Settings, Sound, View Mode */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Leaderboard button */}
          <button
            type="button"
            onClick={() => {
              sound.playKeyClick();
              setIsLeaderboardOpen(true);
            }}
            title="High Scores Leaderboard"
            className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-200 text-xs font-tech font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xs:inline">SCORES</span>
          </button>

          {/* Settings button */}
          <button
            type="button"
            onClick={() => {
              sound.playKeyClick();
              setIsSettingsOpen(!isSettingsOpen);
            }}
            title="Game Settings"
            className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
              isSettingsOpen
                ? 'bg-zinc-800 border-zinc-600 text-white'
                : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Mute button */}
          <button
            type="button"
            onClick={handleToggleMute}
            title={isMuted ? 'Unmute Sound (M)' : 'Mute Sound (M)'}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* View Mode Toggle (Phone vs Minimalist) */}
          <button
            type="button"
            onClick={() => {
              sound.playKeyClick();
              setViewMode(viewMode === 'phone' ? 'minimalist' : 'phone');
            }}
            title={viewMode === 'phone' ? 'Switch to Fullscreen Minimalist' : 'Switch to Nokia 3310 Handheld'}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs transition-colors cursor-pointer"
          >
            {viewMode === 'phone' ? <Maximize2 className="w-4 h-4" /> : <Smartphone className="w-4 h-4 text-sky-400" />}
          </button>
        </div>
      </header>

      {/* Settings Dropdown Drawer (when open) */}
      {isSettingsOpen && (
        <div className="w-full max-w-md mx-auto my-2 p-4 bg-zinc-900/95 border border-zinc-800 rounded-2xl shadow-xl z-20 text-xs font-mono animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-800">
            <span className="font-tech font-bold text-zinc-200 text-sm">SETTINGS & CUSTOMIZATION</span>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(false)}
              className="text-zinc-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Speed Selector */}
          <div className="mb-3">
            <span className="block text-zinc-400 mb-1.5">Game Speed:</span>
            <div className="grid grid-cols-4 gap-1.5">
              {(['slow', 'normal', 'fast', 'extreme'] as GameSpeed[]).map((sp) => (
                <button
                  key={sp}
                  type="button"
                  onClick={() => {
                    sound.playKeyClick();
                    setSpeed(sp);
                  }}
                  className={`py-1.5 px-2 rounded-md font-bold text-center capitalize transition-colors ${
                    speed === sp
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                  }`}
                >
                  {sp}
                </button>
              ))}
            </div>
          </div>

          {/* Walls Option */}
          <div className="mb-3">
            <span className="block text-zinc-400 mb-1.5">Playfield Boundary:</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  sound.playKeyClick();
                  setWalls(true);
                }}
                className={`py-1.5 px-3 rounded-md font-bold text-center transition-colors flex items-center justify-center gap-1.5 ${
                  walls
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Solid Walls (Classic)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.playKeyClick();
                  setWalls(false);
                }}
                className={`py-1.5 px-3 rounded-md font-bold text-center transition-colors flex items-center justify-center gap-1.5 ${
                  !walls
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Wrap-Around (Snake II)</span>
              </button>
            </div>
          </div>

          {/* Theme Palette */}
          <div>
            <span className="block text-zinc-400 mb-1.5">LCD Color Theme:</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {(Object.keys(THEMES) as ThemeId[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    sound.playKeyClick();
                    setThemeId(id);
                  }}
                  className={`py-1.5 px-2 rounded-md font-bold text-[11px] text-center truncate transition-colors border ${
                    themeId === id
                      ? 'border-emerald-400 bg-zinc-800 text-white ring-1 ring-emerald-500/50'
                      : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {THEMES[id].name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Game Stage */}
      <main className="flex-1 w-full flex flex-col items-center justify-center p-3 sm:p-5 max-w-4xl mx-auto">
        {viewMode === 'phone' ? (
          /* Handheld Nokia 3310 Mode */
          <div className="w-full flex flex-col items-center animate-in fade-in duration-300">
            <NokiaPhoneFrame
              onDirection={handleDirection}
              onNaviKey={() => {
                if (gameState === 'TITLE' || gameState === 'GAME_OVER') {
                  startGame();
                } else {
                  togglePause();
                }
              }}
              onCKey={() => {
                if (gameState === 'PLAYING') {
                  togglePause();
                } else if (gameState === 'PAUSED') {
                  setGameState('TITLE');
                }
              }}
              isPaused={gameState === 'PAUSED'}
              isPlaying={gameState === 'PLAYING'}
            >
              {renderGameScreen()}
            </NokiaPhoneFrame>
          </div>
        ) : (
          /* Minimalist Modern Fullscreen Mode */
          <div className="w-full max-w-xl flex flex-col items-center animate-in fade-in duration-300">
            {/* Screen Container */}
            <div className="w-full rounded-2xl overflow-hidden border-2 border-zinc-800 shadow-2xl bg-zinc-900 p-2 sm:p-3">
              <div className="rounded-xl overflow-hidden border border-zinc-800/80 shadow-inner">
                {renderGameScreen()}
              </div>
            </div>

            {/* Mobile Touch D-Pad */}
            <div className="w-full mt-4 flex items-center justify-center">
              <TouchDpad
                onDirection={handleDirection}
                onAction={() => {
                  if (gameState === 'TITLE' || gameState === 'GAME_OVER') {
                    startGame();
                  } else {
                    togglePause();
                  }
                }}
                isPaused={gameState === 'PAUSED'}
              />
            </div>
          </div>
        )}
      </main>

      {/* Subtle Bottom Status Bar */}
      <footer className="w-full max-w-4xl mx-auto py-2.5 px-4 flex items-center justify-between text-[11px] text-zinc-500 font-mono border-t border-zinc-800/60">
        <div>
          <span>SVN Snakes Game · Mobile & Desktop Ready</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              sound.playKeyClick();
              setIsLeaderboardOpen(true);
            }}
            className="hover:text-zinc-300 transition-colors cursor-pointer"
          >
            Hall of Fame
          </button>
          <span aria-hidden="true">·</span>
          <span>Zero Dependencies</span>
        </div>
      </footer>

      {/* Leaderboard Modal */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        scores={leaderboardScores}
        isLoading={isLoadingScores}
        onRefresh={loadLeaderboard}
      />

      {/* Game Over Dialog */}
      <GameOverModal
        isOpen={gameState === 'GAME_OVER'}
        score={score}
        level={level}
        length={snakeLength}
        foodsEaten={foodsEaten}
        speed={speed}
        walls={walls}
        theme={currentTheme}
        isNewBest={isNewPersonalRecord}
        onPlayAgain={startGame}
        onScoreSaved={() => {
          loadLeaderboard();
        }}
      />
    </div>
  );
}
