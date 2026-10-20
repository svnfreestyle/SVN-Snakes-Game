export type GameState = 'TITLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export type GameSpeed = 'slow' | 'normal' | 'fast' | 'extreme';

export type ThemeId = 'dark-oled' | 'nokia-classic' | 'cyber-amber' | 'mono-matrix';

export type ViewMode = 'phone' | 'minimalist';

export interface Point {
  x: number;
  y: number;
}

export interface BonusFood {
  x: number;
  y: number;
  type: 'bug' | 'mouse' | 'fly';
  points: number;
  timeLeft: number; // in ticks or seconds
  maxTime: number;
}

export interface ScoreEntry {
  id: string;
  name: string;
  score: number;
  speed: GameSpeed;
  walls: boolean;
  timestamp: number;
}

export interface ThemeColors {
  id: ThemeId;
  name: string;
  lcdBg: string;
  lcdPixel: string;
  lcdGrid: string;
  snakeHead: string;
  snakeBody: string;
  foodColor: string;
  bonusColor: string;
  wallColor: string;
  textPrimary: string;
  textSecondary: string;
  bezelBg: string;
  phoneBodyBg: string;
}

export const THEMES: Record<ThemeId, ThemeColors> = {
  'dark-oled': {
    id: 'dark-oled',
    name: 'Dark OLED (Default)',
    lcdBg: '#09090b',
    lcdPixel: '#22c55e',
    lcdGrid: 'rgba(255, 255, 255, 0.04)',
    snakeHead: '#4ade80',
    snakeBody: '#22c55e',
    foodColor: '#38bdf8',
    bonusColor: '#facc15',
    wallColor: '#27272a',
    textPrimary: '#f4f4f5',
    textSecondary: '#a1a1aa',
    bezelBg: '#18181b',
    phoneBodyBg: '#0f172a',
  },
  'nokia-classic': {
    id: 'nokia-classic',
    name: 'Classic Nokia 3310',
    lcdBg: '#94a080',
    lcdPixel: '#212a1a',
    lcdGrid: 'rgba(0, 0, 0, 0.08)',
    snakeHead: '#1b2315',
    snakeBody: '#212a1a',
    foodColor: '#1b2315',
    bonusColor: '#11170d',
    wallColor: '#2c3723',
    textPrimary: '#1b2315',
    textSecondary: '#3b4931',
    bezelBg: '#374151',
    phoneBodyBg: '#1e293b',
  },
  'cyber-amber': {
    id: 'cyber-amber',
    name: 'Cyber Amber CRT',
    lcdBg: '#140e06',
    lcdPixel: '#f59e0b',
    lcdGrid: 'rgba(245, 158, 11, 0.06)',
    snakeHead: '#fbbf24',
    snakeBody: '#f59e0b',
    foodColor: '#fb923c',
    bonusColor: '#ef4444',
    wallColor: '#35210b',
    textPrimary: '#fef3c7',
    textSecondary: '#d97706',
    bezelBg: '#271b0c',
    phoneBodyBg: '#1a1208',
  },
  'mono-matrix': {
    id: 'mono-matrix',
    name: 'Monochrome Matrix',
    lcdBg: '#000000',
    lcdPixel: '#ffffff',
    lcdGrid: 'rgba(255, 255, 255, 0.05)',
    snakeHead: '#ffffff',
    snakeBody: '#e4e4e7',
    foodColor: '#ffffff',
    bonusColor: '#a1a1aa',
    wallColor: '#3f3f46',
    textPrimary: '#ffffff',
    textSecondary: '#71717a',
    bezelBg: '#121212',
    phoneBodyBg: '#18181b',
  },
};
