import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { getLevelData } from './src/utils/levels';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialization of Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
  }
  return aiClient;
}

// Real-time active players presence tracking using Server-Sent Events
let activeConnections: express.Response[] = [];

app.get('/api/presence', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  activeConnections.push(res);
  broadcastPresence();

  req.on('close', () => {
    activeConnections = activeConnections.filter(c => c !== res);
    broadcastPresence();
  });
});

function broadcastPresence() {
  const count = Math.max(1, activeConnections.length);
  const payload = JSON.stringify({ count });
  activeConnections.forEach(conn => {
    try {
      conn.write(`data: ${payload}\n\n`);
    } catch (e) {
      // Silent error for closed connection
    }
  });
}

// Keep connections alive with standard 15s heartbeats and prevent timeouts
setInterval(() => {
  activeConnections.forEach(conn => {
    try {
      conn.write(`: ping\n\n`);
    } catch (e) {
      // Connection might be closed, handled by close event
    }
  });
}, 15000);

// Full-stack API to generate customized animal-themed level data
app.post('/api/level-data', async (req, res) => {
  const { level } = req.body;
  if (!level || typeof level !== 'number') {
    res.status(400).json({ error: 'Level number is required' });
    return;
  }

  // Calculate parameters for formulas to guide the AI
  const isBossLevel = level % 10 === 0;
  const numWaves = isBossLevel ? 1 : Math.min(3 + Math.floor(level / 20), 5);
  const hpMultiplier = Math.pow(1.15, level - 1);
  const baseHp = isBossLevel ? 250 : 50;

  const client = getGeminiClient();
  if (!client) {
    console.log('[API] GEMINI_API_KEY is not defined. Falling back to robust procedural generator.');
    const fallbackData = getLevelData(level);
    res.json({ ...fallbackData, isAiGenerated: false });
    return;
  }

  try {
    const prompt = `You are an expert game designer for 'Fat Prince Gyuuun Tile Match', a Match-3 RPG puzzle game.
Generate a JSON object representing the animal enemies for Level ${level}.
The level has ${isBossLevel ? "1 Boss Wave" : `${numWaves} waves`}.

For each wave, generate a list of creative animal enemies.
The level is ${level}.
There are ${numWaves} waves.
Is it a Boss Level? ${isBossLevel ? "Yes" : "No"}.

Here are the guidelines:
1. Each enemy is a unique animal. Supported animalTypes:
   'bear', 'cat', 'fox', 'rabbit', 'pig', 'panda', 'koala', 'frog', 'bird', 'dragon', 'lion', 'wolf', 'penguin', 'elephant', 'snake', 'badger'.
2. Visual accessories (can be empty, or contain 1-2):
   'glasses', 'hat', 'wings', 'horns', 'crown', 'sword', 'armor', 'cape'. (The boss wave must have 'crown' for the boss).
3. Provide a creative name and flavor description for each.
4. Calculate stats:
   - Base HP multiplier is ${hpMultiplier.toFixed(3)}.
   - Suggested Normal Enemy HP: around ${Math.floor(50 * hpMultiplier)} to ${Math.floor(75 * hpMultiplier)}.
   - Suggested Boss Enemy HP: around ${Math.floor(250 * hpMultiplier)}.
   - Suggested Normal Enemy Attack: around ${Math.floor(5 * Math.pow(1.10, level - 1))}.
   - Suggested Boss Enemy Attack: around ${Math.floor(15 * Math.pow(1.10, level - 1))}.
   - attackCooldown should be 2 or 3.

Generate exactly the structure matching the response schema. Generate valid JSON only.`;

    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            level: { type: Type.INTEGER },
            isBossLevel: { type: Type.BOOLEAN },
            waves: {
              type: Type.ARRAY,
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    type: { type: Type.STRING },
                    hp: { type: Type.INTEGER },
                    maxHp: { type: Type.INTEGER },
                    attack: { type: Type.INTEGER },
                    attackCooldown: { type: Type.INTEGER },
                    maxCooldown: { type: Type.INTEGER },
                    isBoss: { type: Type.BOOLEAN },
                    name: { type: Type.STRING },
                    animalType: { type: Type.STRING },
                    description: { type: Type.STRING },
                    primaryColor: { type: Type.STRING },
                    secondaryColor: { type: Type.STRING },
                    accentColor: { type: Type.STRING },
                    accessories: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    }
                  },
                  required: [
                    "id", "type", "hp", "maxHp", "attack", "attackCooldown", "maxCooldown",
                    "isBoss", "name", "animalType", "description", "primaryColor",
                    "secondaryColor", "accentColor", "accessories"
                  ]
                }
              }
            }
          },
          required: ["level", "waves", "isBossLevel"]
        }
      }
    });

    const resultText = response.text;
    if (resultText) {
      const parsedData = JSON.parse(resultText);
      res.json({ ...parsedData, isAiGenerated: true });
      return;
    }
  } catch (error) {
    console.error('[API] Gemini generateContent failed:', error);
  }

  // Fallback to local procedural generator if error occurs
  const fallbackData = getLevelData(level);
  res.json({ ...fallbackData, isAiGenerated: false, apiError: true });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
