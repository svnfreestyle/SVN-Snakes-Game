interface ScoreEntry {
  id: string;
  name: string;
  score: number;
  speed: string;
  walls: boolean;
  timestamp: number;
}

// In-memory persistence for Netlify function container lifetime
let serverScores: ScoreEntry[] = [
  { id: 'seed-1', name: 'SVN_MASTER', score: 320, speed: 'normal', walls: true, timestamp: Date.now() - 86400000 * 3 },
  { id: 'seed-2', name: 'NOKIA_3310', score: 260, speed: 'normal', walls: true, timestamp: Date.now() - 86400000 * 5 },
  { id: 'seed-3', name: 'RETRO_VIPER', score: 210, speed: 'fast', walls: false, timestamp: Date.now() - 86400000 * 7 },
  { id: 'seed-4', name: 'PIXEL_BYTE', score: 170, speed: 'normal', walls: true, timestamp: Date.now() - 86400000 * 9 },
  { id: 'seed-5', name: 'GLITCH', score: 120, speed: 'slow', walls: false, timestamp: Date.now() - 86400000 * 12 },
];

export const handler = async (event: {
  httpMethod: string;
  body: string | null;
}) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, scores: serverScores }),
    };
  }

  if (event.httpMethod === 'POST') {
    try {
      const data = event.body ? JSON.parse(event.body) : {};
      const { name, score, speed, walls } = data;

      if (!name || typeof name !== 'string') {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'Name is required' }),
        };
      }

      const sanitizedName = name.replace(/[^a-zA-Z0-9_\- ]/g, '').trim().toUpperCase().slice(0, 12) || 'PLAYER';
      const newScore: ScoreEntry = {
        id: 'nl-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        name: sanitizedName,
        score: typeof score === 'number' ? score : 0,
        speed: speed || 'normal',
        walls: Boolean(walls),
        timestamp: Date.now(),
      };

      serverScores.push(newScore);
      serverScores.sort((a, b) => b.score - a.score);
      serverScores = serverScores.slice(0, 50);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, scores: serverScores }),
      };
    } catch {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'Invalid JSON body' }),
      };
    }
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Method Not Allowed' }),
  };
};
