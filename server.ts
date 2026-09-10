import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Health Check Endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Lazy initialization of Gemini Client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not configured in the environment. Please add it via the Settings/Secrets menu in Google AI Studio.'
    );
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}

interface GenerateProposalRequestBody {
  clientInfo: {
    companyName: string;
    industry?: string;
    website?: string;
    primaryMarket?: string;
    mainBusinessGoal?: string;
    clientRequirement?: string;
  };
  selectedServices: string[];
  deliverablesConfig: Record<string, unknown>;
}

// POST /api/generate-client-proposal-copy
app.post('/api/generate-client-proposal-copy', async (req: Request, res: Response) => {
  try {
    const { clientInfo, selectedServices, deliverablesConfig } = req.body as GenerateProposalRequestBody;

    if (!clientInfo?.companyName) {
      res.status(400).json({
        success: false,
        error: 'Company Name is required to generate client-specific proposal copy.',
      });
      return;
    }

    const ai = getGeminiClient();

    // Map service labels for prompt clarity
    const serviceMap: Record<string, string> = {
      'seo': 'Search Engine Optimization (SEO)',
      'social-media': 'Social Media Marketing & Creative Content',
      'content-marketing': 'Content Marketing & Authority Blogging',
      'google-ads': 'Google Ads (Search & Performance Max)',
      'linkedin': 'LinkedIn Thought Leadership & B2B Marketing',
      'aeo': 'Answer Engine Optimization (AEO)',
      'geo': 'Generative Engine Optimization (GEO)',
      'website-development': 'Conversion-Focused Website Optimization',
    };

    const activeServiceNames = (selectedServices || [])
      .map((s) => serviceMap[s] || s)
      .join(', ');

    const prompt = `
You are an executive digital marketing strategist at Dinero Tech Labs Pvt. Ltd. (a premier performance marketing and organic growth agency).
You must write presentation-ready, highly professional proposal copy tailored EXCLUSIVELY for the client below.

CLIENT INFORMATION:
- Company Name: ${clientInfo.companyName}
- Industry / Sector: ${clientInfo.industry || 'Not specified (use safe industry-standard context)'}
- Official Website: ${clientInfo.website || 'Official Domain'}
- Target Location / Market: ${clientInfo.primaryMarket || 'Target geographic territory'}
- Main Business Goal: ${clientInfo.mainBusinessGoal || 'Brand Awareness and Customer Acquisition'}
- Client Requirement Statement: ${clientInfo.clientRequirement || 'Digital marketing acceleration and pipeline generation'}
- Selected Agency Services: ${activeServiceNames || 'Full Digital Growth Suite'}
- Deliverable Details: ${JSON.stringify(deliverablesConfig || {})}

STRICT WRITING & POLICY RULES:
1. Scope Restriction: You are generating copy ONLY for the 6 client-specific sections below. NEVER alter or include agency fixed sections (About Us, Why Us, Mission, Vision, Terms).
2. Professional Tone: Use refined, executive business language suitable for a high-end corporate proposal presentation.
3. Concise & Slide-Friendly: Write short, punchy paragraphs (2-3 sentences max) and crisp bullet points designed to fit cleanly onto presentation slides. Avoid long, rambling essays.
4. No Exaggerated Claims: Absolutely NO promises of guaranteed #1 rankings, guaranteed lead volumes, or guaranteed revenue numbers. Use words like "designed to drive", "targets", "focuses on", "aimed at".
5. Highly Customized: The text must feel directly written for ${clientInfo.companyName}, referencing their specific industry (${clientInfo.industry || 'their market'}), target location (${clientInfo.primaryMarket || 'their target territory'}), and commercial goal (${clientInfo.mainBusinessGoal || 'their primary objective'}).
6. Factual Integrity: Do not hallucinate or invent specific unverified facts, previous revenue numbers, or fictitious awards for the client. If details are sparse, use safe, professional strategic framing.

OUTPUT REQUIRED:
Generate structured JSON matching the requested schema with content for:
1. ourUnderstanding:
   - leadParagraph: Executive synthesis of the client's current situation and mandate (2 sentences max).
   - bulletPoints: 3 concise bullet points summarizing discovery insights.
   - calloutTitle: "Client Requirement Statement"
   - calloutText: Refined 1-2 sentence statement of what the client requires Dinero Tech Labs to accomplish.
2. marketOpportunity:
   - leadParagraph: Strategic overview of why now is the ideal time for ${clientInfo.companyName} to capture category prominence (2 sentences max).
   - bulletPoints: 3 high-impact opportunity vectors tailored to their industry and target market.
3. marketGap:
   - leadParagraph: Objective assessment of where competitors in ${clientInfo.primaryMarket || 'the target market'} are falling short (2 sentences max).
   - bulletPoints: 3 specific tactical gaps (e.g. absent from AI answer engines, generic non-converting content, unoptimized ad spend).
4. primaryObjectives:
   - leadParagraph: Focused commercial targets centered directly on ${clientInfo.mainBusinessGoal || 'business expansion'} (2 sentences max).
   - bulletPoints: 4 clear, milestone-oriented objectives (e.g. organic reach, pipeline generation, asset library, attribution).
5. digitalGrowthStrategy:
   - leadParagraph: Overview of the client-specific acquisition architecture (2 sentences max).
   - bulletPoints: Exactly 3 progressive stages:
     * Stage 1: Immediate Intent Capture (capturing active in-market buyers)
     * Stage 2: Category Authority & Trust Nurturing (differentiating brand and engaging prospects)
     * Stage 3: Algorithmic & Compound Growth (expanding organic search and answer engine citation footprint)
6. expectedOutcomes:
   - leadParagraph: Realistic trajectory explaining how compounding gains develop without false guarantees (2 sentences max).
   - bulletPoints: Exactly 3 milestone bullets:
     * Month 1 (Foundation): Technical hygiene, tracking infrastructure, initial creative deployment.
     * Month 2 (Traction): Search indexing, engagement signals, initial qualified inquiry baselines.
     * Month 3 (Compounding): Sustained algorithmic visibility, decreasing blended acquisition cost.
`;

    const modelsToTry = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
    let lastError: Error | null = null;
    let response: any = null;
    let successfulModel = 'gemini-3.8-flash';

    for (const modelCandidate of modelsToTry) {
      try {
        response = await ai.models.generateContent({
          model: modelCandidate,
          contents: prompt,
          config: {
            systemInstruction:
              'You are a senior proposal strategist at Dinero Tech Labs Pvt. Ltd. Write concise, slide-ready, non-exaggerated, realistic corporate marketing copy in JSON.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                ourUnderstanding: {
                  type: Type.OBJECT,
                  properties: {
                    leadParagraph: { type: Type.STRING },
                    bulletPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                    calloutTitle: { type: Type.STRING },
                    calloutText: { type: Type.STRING },
                  },
                  required: ['leadParagraph', 'bulletPoints', 'calloutTitle', 'calloutText'],
                },
                marketOpportunity: {
                  type: Type.OBJECT,
                  properties: {
                    leadParagraph: { type: Type.STRING },
                    bulletPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                  required: ['leadParagraph', 'bulletPoints'],
                },
                marketGap: {
                  type: Type.OBJECT,
                  properties: {
                    leadParagraph: { type: Type.STRING },
                    bulletPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                  required: ['leadParagraph', 'bulletPoints'],
                },
                primaryObjectives: {
                  type: Type.OBJECT,
                  properties: {
                    leadParagraph: { type: Type.STRING },
                    bulletPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                  required: ['leadParagraph', 'bulletPoints'],
                },
                digitalGrowthStrategy: {
                  type: Type.OBJECT,
                  properties: {
                    leadParagraph: { type: Type.STRING },
                    bulletPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                  required: ['leadParagraph', 'bulletPoints'],
                },
                expectedOutcomes: {
                  type: Type.OBJECT,
                  properties: {
                    leadParagraph: { type: Type.STRING },
                    bulletPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                  required: ['leadParagraph', 'bulletPoints'],
                },
              },
              required: [
                'ourUnderstanding',
                'marketOpportunity',
                'marketGap',
                'primaryObjectives',
                'digitalGrowthStrategy',
                'expectedOutcomes',
              ],
            },
          },
        });
        successfulModel = modelCandidate;
        break;
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.warn(`[Gemini API] Failed on candidate ${modelCandidate}:`, lastError.message);
      }
    }

    if (!response) {
      throw lastError || new Error('All Gemini model candidates failed.');
    }

    const rawText = response.text?.trim();
    if (!rawText) {
      throw new Error('Empty response received from Gemini model.');
    }

    const parsedJson = JSON.parse(rawText);

    const generatedCopy = {
      generatedAt: new Date().toISOString(),
      model: successfulModel,
      ourUnderstanding: parsedJson.ourUnderstanding,
      marketOpportunity: parsedJson.marketOpportunity,
      marketGap: parsedJson.marketGap,
      primaryObjectives: parsedJson.primaryObjectives,
      digitalGrowthStrategy: parsedJson.digitalGrowthStrategy,
      expectedOutcomes: parsedJson.expectedOutcomes,
    };

    res.json({
      success: true,
      generatedCopy,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    console.error('[API Error /api/generate-client-proposal-copy]:', message);
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

// Vite middleware or Static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Dinero Tech Labs] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();