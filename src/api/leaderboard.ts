import { ScoreEntry, GameSpeed } from '../types';

const LOCAL_STORAGE_KEY = 'svn_snake_leaderboard_cache';
const LOCAL_BEST_KEY = 'svn_snake_personal_best';
const PLAYER_NAME_KEY = 'svn_snake_saved_player_name';

const FALLBACK_SCORES: ScoreEntry[] = [
  { id: 'fb-1', name: 'SVN_MASTER', score: 320, speed: 'normal', walls: true, timestamp: Date.now() - 86400000 * 2 },
  { id: 'fb-2', name: 'NOKIA_3310', score: 260, speed: 'normal', walls: true, timestamp: Date.now() - 86400000 * 4 },
  { id: 'fb-3', name: 'RETRO_VIPER', score: 210, speed: 'fast', walls: false, timestamp: Date.now() - 86400000 * 6 },
  { id: 'fb-4', name: 'PIXEL_BYTE', score: 170, speed: 'normal', walls: true, timestamp: Date.now() - 86400000 * 8 },
  { id: 'fb-5', name: 'GLITCH', score: 120, speed: 'slow', walls: false, timestamp: Date.now() - 86400000 * 10 },
];

export function getCachedLeaderboard(): ScoreEntry[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  return FALLBACK_SCORES;
}

export function cacheLeaderboard(scores: ScoreEntry[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(scores));
  } catch {
    // ignore
  }
}

export async function fetchLeaderboard(): Promise<ScoreEntry[]> {
  try {
    const res = await fetch('/api/leaderboard');
    if (!res.ok) throw new Error('Failed to load server scores');
    const data = await res.json();
    if (data.success && Array.isArray(data.scores)) {
      cacheLeaderboard(data.scores);
      return data.scores;
    }
  } catch (err) {
    console.warn('Using local leaderboard fallback:', err);
  }
  return getCachedLeaderboard();
}

export async function submitScore(
  name: string,
  score: number,
  speed: GameSpeed,
  walls: boolean
): Promise<{ success: boolean; scores: ScoreEntry[]; error?: string }> {
  const sanitizedName = name.trim().toUpperCase().slice(0, 12);
  
  // Save last used player name
  try {
    localStorage.setItem(PLAYER_NAME_KEY, sanitizedName);
  } catch {
    // ignore
  }

  // Update personal best
  const currentBest = getPersonalBest();
  if (score > currentBest) {
    setPersonalBest(score);
  }

  try {
    const res = await fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: sanitizedName, score, speed, walls }),
    });

    const data = await res.json();
    if (data.success && Array.isArray(data.scores)) {
      cacheLeaderboard(data.scores);
      return { success: true, scores: data.scores };
    }
    return { success: false, scores: getCachedLeaderboard(), error: data.error || 'Server error' };
  } catch (err) {
    console.warn('Network error saving to server; saving locally:', err);
    // Offline local persistence
    const local = getCachedLeaderboard();
    const newEntry: ScoreEntry = {
      id: 'local-' + Date.now(),
      name: sanitizedName,
      score,
      speed,
      walls,
      timestamp: Date.now(),
    };
    local.push(newEntry);
    local.sort((a, b) => b.score - a.score);
    const trimmed = local.slice(0, 50);
    cacheLeaderboard(trimmed);
    return { success: true, scores: trimmed };
  }
}

export function getPersonalBest(): number {
  try {
    const val = localStorage.getItem(LOCAL_BEST_KEY);
    return val ? parseInt(val, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

export function setPersonalBest(score: number): void {
  try {
    localStorage.setItem(LOCAL_BEST_KEY, String(score));
  } catch {
    // ignore
  }
}

export function getSavedPlayerName(): string {
  try {
    return localStorage.getItem(PLAYER_NAME_KEY) || 'PLAYER';
  } catch {
    return 'PLAYER';
  }
}
