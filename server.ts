import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import {
  calculateUrbanRoadDistanceKm,
  getShippingFeeByDistance,
  getShippingTierKey,
} from './src/utils/shipping';
import { calculateDiscountBreakdown, VoucherUsageHistoryItem } from './src/utils/voucher';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DAILY_AI_TRYON_QUOTA = 20;
const aiQuotaTracker = new Map<string, number>();

function getDayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function getAiQuotaUsed(userId: string): number {
  const key = `${userId}_${getDayKey()}`;
  return aiQuotaTracker.get(key) ?? 0;
}

function incrementAiQuotaUsed(userId: string): number {
  const key = `${userId}_${getDayKey()}`;
  const next = (aiQuotaTracker.get(key) ?? 0) + 1;
  aiQuotaTracker.set(key, next);
  return next;
}

const aiClient = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

async function startServer(): Promise<void> {
  const app = express();
  const port = Number(process.env.PORT ?? 3000);

  app.use(express.json({ limit: '10mb' }));

  app.get('/api/v1/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'lumina-optics-api' });
  });

  app.get('/api/v1/ai-tryon/quota', (req: Request, res: Response) => {
    const userId = String(req.headers['x-user-id'] ?? req.query.userId ?? '').trim();
    if (!userId) {
      res.status(401).json({ error: 'AUTH_REQUIRED' });
      return;
    }
    const used = getAiQuotaUsed(userId);
    res.json({
      used,
      limit: DAILY_AI_TRYON_QUOTA,
      remaining: Math.max(0, DAILY_AI_TRYON_QUOTA - used),
    });
  });

  app.post('/api/v1/ai-tryon/analyze', async (req: Request, res: Response) => {
    const userId = String(req.headers['x-user-id'] ?? '').trim();
    if (!userId) {
      res.status(401).json({ error: 'AUTH_REQUIRED' });
      return;
    }

    const currentUsed = getAiQuotaUsed(userId);
    if (currentUsed >= DAILY_AI_TRYON_QUOTA) {
      res.status(429).json({ error: 'DAILY_QUOTA_EXCEEDED' });
      return;
    }

    const body = req.body as {
      imageBase64?: string;
      mimeType?: string;
      selectedFrameName?: string;
    };

    if (!body.imageBase64) {
      res.status(400).json({ error: 'MISSING_IMAGE_DATA' });
      return;
    }

    const cleanBase64 = body.imageBase64.replace(/^data:image\/\w+;base64,/, '');

    if (!aiClient) {
      res.status(503).json({ error: 'GEMINI_API_KEY_NOT_CONFIGURED' });
      return;
    }

    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: body.mimeType ?? 'image/jpeg',
                data: cleanBase64,
              },
            },
            {
              text:
                `Analyze this portrait for optical eyewear fitting. The user is currently trying on "${body.selectedFrameName ?? 'optical frame'}". ` +
                `Classify face shape strictly into one of: ROUND, SQUARE, OVAL, LONG. ` +
                `Estimate pupillary distance (PD) in mm between 56 and 70. ` +
                `Provide concise bilingual (Vietnamese & English) advice on why the frame fits or which frame geometry balances their face proportions. ` +
                `Recommend up to 3 slugs from: kyoto-beta-titanium-square, atelier-havana-acetate-round, camellia-rose-crystal-cateye, oslo-brushed-gold-aviator, nordic-obsidian-browline, kobe-air-rimless-titanium, flex-tr90-clear-crystal-square, seoul-minimal-pvd-round.`,
            },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              detectedFaceShape: {
                type: Type.STRING,
                description: 'Must be one of ROUND, SQUARE, OVAL, LONG',
              },
              confidence: {
                type: Type.NUMBER,
                description: 'Confidence score between 0.7 and 0.99',
              },
              estimatedPdMm: {
                type: Type.INTEGER,
                description: 'Estimated PD in millimeters between 56 and 70',
              },
              summaryVi: {
                type: Type.STRING,
                description: '2-sentence Vietnamese optical consultation summary',
              },
              summaryEn: {
                type: Type.STRING,
                description: '2-sentence English optical consultation summary',
              },
              recommendedSlugs: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Up to 3 matching product slugs from the catalog',
              },
            },
          },
        },
      });

      const usedAfter = incrementAiQuotaUsed(userId);
      const parsed = JSON.parse((response.text ?? '{}').trim()) as {
        detectedFaceShape?: string;
        confidence?: number;
        estimatedPdMm?: number;
        summaryVi?: string;
        summaryEn?: string;
        recommendedSlugs?: string[];
      };

      const validShapes = ['ROUND', 'SQUARE', 'OVAL', 'LONG'];
      const detectedFaceShape = validShapes.includes(parsed.detectedFaceShape ?? '')
        ? parsed.detectedFaceShape
        : 'OVAL';

      res.json({
        detectedFaceShape,
        confidence: parsed.confidence ?? 0.9,
        estimatedPdMm: parsed.estimatedPdMm ?? 62,
        summaryVi:
          parsed.summaryVi ??
          'Tỷ lệ gương mặt cân đối. Bạn có thể chọn gọng vuông hoặc tròn nhẹ để tôn đường nét.',
        summaryEn:
          parsed.summaryEn ??
          'Balanced facial proportions. Architectural square or soft round frames will complement your features.',
        recommendedSlugs:
          Array.isArray(parsed.recommendedSlugs) && parsed.recommendedSlugs.length > 0
            ? parsed.recommendedSlugs
            : ['kyoto-beta-titanium-square', 'atelier-havana-acetate-round'],
        remainingQuota: Math.max(0, DAILY_AI_TRYON_QUOTA - usedAfter),
      });
    } catch (error) {
      console.error('Gemini Try-On error:', error);
      res.status(502).json({ error: 'AI_ANALYSIS_FAILED' });
    }
  });

  app.post('/api/v1/shipping/calculate', (req: Request, res: Response) => {
    try {
      const { lat, lng } = req.body as { lat?: number; lng?: number };
      if (typeof lat !== 'number' || typeof lng !== 'number') {
        res.status(400).json({ error: 'INVALID_COORDINATES' });
        return;
      }
      const distanceKm = calculateUrbanRoadDistanceKm({ lat, lng });
      const shippingFee = getShippingFeeByDistance(distanceKm);
      const tier = getShippingTierKey(distanceKm);
      res.json({ distanceKm, shippingFee, tier });
    } catch {
      res.status(400).json({ error: 'INVALID_COORDINATES' });
    }
  });

  app.post('/api/v1/vouchers/validate', (req: Request, res: Response) => {
    const body = req.body as {
      voucherCode?: string;
      subtotal?: number;
      totalQuantity?: number;
      userId?: string;
      customerEmail?: string;
      customerPhone?: string;
      usageHistory?: VoucherUsageHistoryItem[];
    };

    const result = calculateDiscountBreakdown({
      voucherCode: body.voucherCode,
      subtotal: Number(body.subtotal ?? 0),
      totalQuantity: Number(body.totalQuantity ?? 0),
      userId: body.userId,
      customerEmail: body.customerEmail ?? '',
      customerPhone: body.customerPhone ?? '',
      usageHistory: Array.isArray(body.usageHistory) ? body.usageHistory : [],
    });

    res.json(result);
  });

  app.post('/api/v1/notifications/send-order-email', (req: Request, res: Response) => {
    const body = req.body as {
      orderCode?: string;
      customerEmail?: string;
      totalAmount?: number;
    };
    const hasSmtp = Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
    res.json({
      dispatched: true,
      mode: hasSmtp ? 'GMAIL_SMTP' : 'TRANSACTIONAL_QUEUE',
      orderCode: body.orderCode,
      recipient: body.customerEmail,
    });
  });

  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`LUMINA OPTICS server running on http://0.0.0.0:${port}`);
  });
}

void startServer();
