import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// Persistent leaderboard data storage
const DATA_DIR = path.join(__dirname, 'data');
const LEADERBOARD_FILE = path.join(DATA_DIR, 'leaderboard.json');

interface ScoreEntry {
  id: string;
  name: string;
  score: number;
  speed: 'slow' | 'normal' | 'fast' | 'extreme';
  walls: boolean;
  timestamp: number;
}

const DEFAULT_SCORES: ScoreEntry[] = [
  { id: 'seed-1', name: 'SVN_MASTER', score: 320, speed: 'normal', walls: true, timestamp: Date.now() - 86400000 * 3 },
  { id: 'seed-2', name: 'NOKIA_3310', score: 260, speed: 'normal', walls: true, timestamp: Date.now() - 86400000 * 5 },
  { id: 'seed-3', name: 'RETRO_VIPER', score: 210, speed: 'fast', walls: false, timestamp: Date.now() - 86400000 * 7 },
  { id: 'seed-4', name: 'PIXEL_BYTE', score: 170, speed: 'normal', walls: true, timestamp: Date.now() - 86400000 * 9 },
  { id: 'seed-5', name: 'GLITCH', score: 120, speed: 'slow', walls: false, timestamp: Date.now() - 86400000 * 12 },
];

function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(LEADERBOARD_FILE)) {
    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(DEFAULT_SCORES, null, 2), 'utf8');
  }
}

function getLeaderboard(): ScoreEntry[] {
  ensureDataDirectory();
  try {
    const raw = fs.readFileSync(LEADERBOARD_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.sort((a, b) => b.score - a.score);
    }
  } catch (err) {
    console.error('Error reading leaderboard file:', err);
  }
  return DEFAULT_SCORES;
}

function saveScore(newScore: Omit<ScoreEntry, 'id' | 'timestamp'>): ScoreEntry[] {
  ensureDataDirectory();
  const current = getLeaderboard();
  const entry: ScoreEntry = {
    id: 'entry-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    name: newScore.name.trim().toUpperCase().slice(0, 12),
    score: Math.max(0, Math.floor(newScore.score)),
    speed: newScore.speed || 'normal',
    walls: Boolean(newScore.walls),
    timestamp: Date.now(),
  };

  current.push(entry);
  current.sort((a, b) => b.score - a.score);
  const trimmed = current.slice(0, 50); // Keep top 50 records

  try {
    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(trimmed, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving leaderboard file:', err);
  }
  return trimmed;
}

// API Routes
app.get('/api/leaderboard', (_req: Request, res: Response) => {
  const scores = getLeaderboard();
  res.json({ success: true, scores });
});

app.post('/api/leaderboard', (req: Request, res: Response) => {
  const { name, score, speed, walls } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    res.status(400).json({ success: false, error: 'Name is required (1-12 characters)' });
    return;
  }
  if (typeof score !== 'number' || isNaN(score) || score < 0) {
    res.status(400).json({ success: false, error: 'Score must be a positive number' });
    return;
  }

  const sanitizedName = name.replace(/[^a-zA-Z0-9_\- ]/g, '').trim() || 'PLAYER';
  const updated = saveScore({
    name: sanitizedName,
    score,
    speed: speed || 'normal',
    walls: walls ?? true,
  });

  res.json({ success: true, scores: updated });
});

// Reset / Seed API (optional administrative reset)
app.post('/api/leaderboard/reset', (_req: Request, res: Response) => {
  ensureDataDirectory();
  fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(DEFAULT_SCORES, null, 2), 'utf8');
  res.json({ success: true, scores: DEFAULT_SCORES });
});

async function startServer() {
  ensureDataDirectory();

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT} (mode: ${isProduction ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
