import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';
import { generateSecurityProject } from '../../lib/securityAdvisor';

// =======================
// 1) Schemas (Zod)
// =======================
const ChatMsgSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string(),
});

const CatalogProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  brand: z.string().optional(),
  model: z.string().optional(),
  sku: z.string().optional(),
  categoryId: z.string().optional(),
  subcategoryId: z.string().optional(),
  priceNet: z.number().optional(),
  features: z.array(z.string()).optional(),
  imageUrl: z.string().optional(),
  datasheetUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  active: z.boolean().optional(),
});

const CatalogCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  subcategories: z.array(z.object({ id: z.string(), name: z.string() })).optional(),
});

const CatalogSchema = z.object({
  categories: z.array(CatalogCategorySchema).optional(),
  products: z.array(CatalogProductSchema),
});

const SecurityProjectProfileSchema = z.object({
  meta: z
    .object({
      createdAt: z.string().optional(),
      version: z.number().optional(),
      source: z.literal('MPS_GUARDIAN').optional(),
    })
    .optional(),

  client: z
    .object({
      name: z.string().optional(),
      commune: z.string().optional(),
      contact: z
        .object({
          phone: z.string().optional(),
          email: z.string().optional(),
        })
        .optional(),
    })
    .optional(),

  site: z
    .object({
      type: z.enum(['casa', 'departamento', 'parcela', 'local', 'bodega']).optional(),
      floors: z.number().optional(),
      perimeter: z.enum(['bajo', 'medio', 'alto']).optional(),
      keyZones: z.array(z.string()).optional(),
      lighting: z.enum(['buena', 'media', 'mala']).optional(),
    })
    .optional(),

  constraints: z
    .object({
      budgetMaxCLP: z.number().optional(),
      internet: z.enum(['fibra', 'movil', 'sin_internet', 'no_sabe']).optional(),
      power: z.enum(['normal', 'cortes_frecuentes', 'solar', 'no_sabe']).optional(),
      recordingDaysTarget: z.number().optional(),
      preference: z
        .object({
          privacy: z.boolean().optional(),
          visibleDeterrence: z.boolean().optional(),
        })
        .optional(),
    })
    .optional(),

  risk: z
    .object({
      level: z.enum(['bajo', 'medio', 'alto']).optional(),
      reasons: z.array(z.string()).optional(),
    })
    .optional(),

  solution: z
    .object({
      cameras: z
        .array(
          z.object({
            productId: z.string(),
            qty: z.number(),
            placementNotes: z.string().optional(),
          })
        )
        .optional(),
      nvrDvr: z.array(z.object({ productId: z.string(), qty: z.number() })).optional(),
      storage: z
        .array(z.object({ productId: z.string(), qty: z.number(), notes: z.string().optional() }))
        .optional(),
      alarm: z
        .array(z.object({ productId: z.string(), qty: z.number(), notes: z.string().optional() }))
        .optional(),
      accessControl: z
        .array(z.object({ productId: z.string(), qty: z.number(), notes: z.string().optional() }))
        .optional(),
      network: z
        .array(z.object({ productId: z.string(), qty: z.number(), notes: z.string().optional() }))
        .optional(),
      power: z
        .array(z.object({ productId: z.string(), qty: z.number(), notes: z.string().optional() }))
        .optional(),
      extras: z
        .array(z.object({ productId: z.string(), qty: z.number(), notes: z.string().optional() }))
        .optional(),
    })
    .optional(),

  pricing: z
    .object({
      currency: z.literal('CLP'),
      subtotalNet: z.number().optional(),
      iva: z.number().optional(),
      total: z.number().optional(),
      notes: z.array(z.string()).optional(),
    })
    .optional(),

  openQuestions: z.array(z.string()).optional(),
  assumptions: z.array(z.string()).optional(),
  nextSteps: z.array(z.string()).optional(),
});

const GuardianResponseSchema = z.object({
  assistantMessage: z.string(),
  projectPatch: SecurityProjectProfileSchema,
  catalogSelections: z.array(
    z.object({
      productId: z.string(),
      qty: z.number().optional(),
      reason: z.string().optional(),
    })
  ),
  openQuestions: z.array(z.string()).optional(),
});

const GuardianRequestSchema = z.object({
  messages: z.array(ChatMsgSchema).min(1),
  currentProfile: SecurityProjectProfileSchema.optional(),
  catalog: CatalogSchema.optional(),
  mode: z.enum(['residencial', 'pyme']).optional(),
});

type Catalog = z.infer<typeof CatalogSchema>;
type SecurityProjectProfile = z.infer<typeof SecurityProjectProfileSchema>;
type GuardianRequest = z.infer<typeof GuardianRequestSchema>;
type GuardianResponse = z.infer<typeof GuardianResponseSchema>;

// =======================
// 2) Helpers
// =======================
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function safeJsonParse<T = unknown>(str: string): T | null {
  try {
    return JSON.parse(str) as T;
  } catch {
    return null;
  }
}

function extractJsonFromText(text: string): unknown {
  const direct = safeJsonParse(text);
  if (direct) return direct;

  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) {
    const slice = text.slice(start, end + 1);
    return safeJsonParse(slice);
  }

  return null;
}

function tryParseCatalogCandidate(candidate: unknown): Catalog | null {
  const parsed = CatalogSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

function extractCatalogFromUnknownSiteData(siteData: unknown): Catalog | null {
  if (!isObject(siteData)) return null;

  const directCatalog = tryParseCatalogCandidate(siteData.catalog);
  if (directCatalog) return directCatalog;

  const directTopLevel = tryParseCatalogCandidate({
    categories: siteData.categories,
    products: siteData.products,
  });
  if (directTopLevel) return directTopLevel;

  if (isObject(siteData.siteData)) {
    const nestedCatalog = tryParseCatalogCandidate(siteData.siteData.catalog);
    if (nestedCatalog) return nestedCatalog;

    const nestedTopLevel = tryParseCatalogCandidate({
      categories: siteData.siteData.categories,
      products: siteData.siteData.products,
    });
    if (nestedTopLevel) return nestedTopLevel;
  }

  return null;
}

async function loadLocalCatalog(): Promise<Catalog | null> {
  const filePath = path.join(process.cwd(), 'data', 'site_data.json');

  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const json = safeJsonParse(raw);
    return extractCatalogFromUnknownSiteData(json);
  } catch {
    return null;
  }
}

function mergeProfiles(
  currentProfile: SecurityProjectProfile | undefined,
  patch: SecurityProjectProfile | undefined
): SecurityProjectProfile {
  return {
    ...currentProfile,
    ...patch,

    meta: {
      ...currentProfile?.meta,
      ...patch?.meta,
      createdAt: currentProfile?.meta?.createdAt ?? new Date().toISOString(),
      version: Math.max(currentProfile?.meta?.version ?? 0, patch?.meta?.version ?? 0),
      source: 'MPS_GUARDIAN',
    },

    client: {
      ...currentProfile?.client,
      ...patch?.client,
      contact: {
        ...currentProfile?.client?.contact,
        ...patch?.client?.contact,
      },
    },

    site: {
      ...currentProfile?.site,
      ...patch?.site,
    },

    constraints: {
      ...currentProfile?.constraints,
      ...patch?.constraints,
      preference: {
        ...currentProfile?.constraints?.preference,
        ...patch?.constraints?.preference,
      },
    },

    risk: {
      ...currentProfile?.risk,
      ...patch?.risk,
      reasons: patch?.risk?.reasons ?? currentProfile?.risk?.reasons,
    },

    solution: {
      ...currentProfile?.solution,
      ...patch?.solution,
      cameras: patch?.solution?.cameras ?? currentProfile?.solution?.cameras,
      nvrDvr: patch?.solution?.nvrDvr ?? currentProfile?.solution?.nvrDvr,
      storage: patch?.solution?.storage ?? currentProfile?.solution?.storage,
      alarm: patch?.solution?.alarm ?? currentProfile?.solution?.alarm,
      accessControl: patch?.solution?.accessControl ?? currentProfile?.solution?.accessControl,
      network: patch?.solution?.network ?? currentProfile?.solution?.network,
      power: patch?.solution?.power ?? currentProfile?.solution?.power,
      extras: patch?.solution?.extras ?? currentProfile?.solution?.extras,
    },

    pricing: patch?.pricing ?? currentProfile?.pricing,
    openQuestions: patch?.openQuestions ?? currentProfile?.openQuestions,
    assumptions: patch?.assumptions ?? currentProfile?.assumptions,
    nextSteps: patch?.nextSteps ?? currentProfile?.nextSteps,
  };
}

function buildFallbackProfile(currentProfile?: SecurityProjectProfile): SecurityProjectProfile {
  return (
    currentProfile ?? {
      meta: {
        source: 'MPS_GUARDIAN',
        version: 1,
        createdAt: new Date().toISOString(),
      },
    }
  );
}

function getLatestUserMessage(messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>): string {
  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
  return lastUserMessage?.content ?? '';
}

function dedupeStrings(items?: string[]): string[] | undefined {
  if (!items || items.length === 0) return undefined;
  return [...new Set(items.map((x) => x.trim()).filter(Boolean))];
}

function combineOpenQuestions(a?: string[], b?: string[]): string[] | undefined {
  return dedupeStrings([...(a ?? []), ...(b ?? [])]);
}

// =======================
// 3) Handler
// =======================
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const parsed = GuardianRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid request body',
        details: parsed.error.flatten(),
      });
    }

    const { messages, currentProfile, catalog: requestCatalog, mode }: GuardianRequest = parsed.data;

    const localCatalog = await loadLocalCatalog();
    const catalog = requestCatalog ?? localCatalog;

    if (!catalog) {
      return res.status(500).json({
        error: 'Catalog not found',
        details: 'No llegó catalog en el request y tampoco se pudo leer data/site_data.json',
      });
    }

    const technicalBase = generateSecurityProject(
      buildFallbackProfile(currentProfile),
      catalog,
      mode ?? 'residencial'
    );

    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';

    if (!apiKey) {
      return res.status(200).json({
        assistantMessage: technicalBase.assistantMessage,
        projectPatch: technicalBase.projectPatch,
        catalogSelections: technicalBase.catalogSelections,
        openQuestions: technicalBase.openQuestions,
        assumptions: technicalBase.assumptions,
        nextSteps: technicalBase.nextSteps,
        _warning: 'Missing OPENAI_API_KEY - returned technical fallback only',
      });
    }

    const system = `
Eres "MPS Guardian", asesor experto de seguridad para Mi Pyme Segura en Chile.
Tu misión es conversar con el cliente, entender su necesidad y proponer una actualización JSON para el proyecto.

REGLAS CRÍTICAS:
1) USA SOLO productos del catálogo entregado (por id). NO inventes productos.
2) Si falta información crítica, pregunta antes. Máximo 1 a 3 preguntas por turno.
3) Devuelve SIEMPRE un JSON válido con esta forma exacta:
{
  "assistantMessage": "...",
  "projectPatch": { ... },
  "catalogSelections": [{ "productId": "...", "qty": 1, "reason": "..." }],
  "openQuestions": ["..."]
}
4) "projectPatch" debe respetar el schema entregado. Si no sabes algo, omítelo.
5) Si no existe un producto exacto en catálogo, no lo inventes ni lo metas en solution.
6) Tono: español chileno, claro, cercano, profesional y aterrizado.
7) Modo actual: ${mode ?? 'residencial'}.

IMPORTANTE:
- Responde SOLO con JSON.
- No uses markdown.
- No pongas texto antes ni después del JSON.
`.trim();

    const contextMsg = {
      role: 'user' as const,
      content: JSON.stringify(
        {
          instruction:
            'Conversa y actualiza el perfil. Puedes mejorar, afinar o reducir la propuesta base si la conversación lo justifica.',
          latestUserMessage: getLatestUserMessage(messages),
          currentProfile: currentProfile ?? {
            meta: {
              source: 'MPS_GUARDIAN',
              version: 1,
            },
          },
          technicalBase,
          catalog: {
            categories: catalog.categories ?? [],
            products: catalog.products
              .filter((p) => p.active ?? true)
              .slice(0, 350)
              .map((p) => ({
                id: p.id,
                name: p.name,
                brand: p.brand ?? '',
                model: p.model ?? '',
                sku: p.sku ?? '',
                categoryId: p.categoryId ?? '',
                subcategoryId: p.subcategoryId ?? '',
                priceNet: typeof p.priceNet === 'number' ? p.priceNet : undefined,
                features: p.features ?? [],
              })),
          },
          note:
            'La propuesta técnica base sirve como apoyo. Si la conversación indica algo más preciso, ajusta el JSON, pero siempre usando solo productId reales del catálogo.',
        },
        null,
        2
      ),
    };

    const upstream = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input: [
          { role: 'system', content: system },
          ...messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          contextMsg,
        ],
        temperature: 0.2,
        max_output_tokens: 1000,
      }),
    });

    if (!upstream.ok) {
      const txt = await upstream.text();
      return res.status(200).json({
        assistantMessage: technicalBase.assistantMessage,
        projectPatch: technicalBase.projectPatch,
        catalogSelections: technicalBase.catalogSelections,
        openQuestions: technicalBase.openQuestions,
        assumptions: technicalBase.assumptions,
        nextSteps: technicalBase.nextSteps,
        _warning: 'OpenAI upstream error - returned technical fallback',
        _upstream: txt,
      });
    }

    const data: unknown = await upstream.json();

    let outputText = '';

    if (isObject(data) && Array.isArray(data.output)) {
      for (const item of data.output) {
        if (!isObject(item) || !Array.isArray(item.content)) continue;

        for (const part of item.content) {
          if (isObject(part) && part.type === 'output_text' && typeof part.text === 'string') {
            outputText += part.text;
          }
        }
      }
    }

    if (!outputText && isObject(data) && typeof data.output_text === 'string') {
      outputText = data.output_text;
    }

    const json = extractJsonFromText(outputText);

    if (!json) {
      return res.status(200).json({
        assistantMessage: technicalBase.assistantMessage,
        projectPatch: technicalBase.projectPatch,
        catalogSelections: technicalBase.catalogSelections,
        openQuestions: technicalBase.openQuestions,
        assumptions: technicalBase.assumptions,
        nextSteps: technicalBase.nextSteps,
        _warning: 'Model output was not valid JSON - returned technical fallback',
        _raw: outputText,
      });
    }

    const validated = GuardianResponseSchema.safeParse(json);

    if (!validated.success) {
      return res.status(200).json({
        assistantMessage: technicalBase.assistantMessage,
        projectPatch: technicalBase.projectPatch,
        catalogSelections: technicalBase.catalogSelections,
        openQuestions: technicalBase.openQuestions,
        assumptions: technicalBase.assumptions,
        nextSteps: technicalBase.nextSteps,
        _warning: 'Model JSON did not match schema - returned technical fallback',
        _schemaError: validated.error.flatten(),
        _raw: json,
      });
    }

    const aiData: GuardianResponse = validated.data;

    const mergedProfile = mergeProfiles(technicalBase.projectPatch, aiData.projectPatch);
    const finalTechnical = generateSecurityProject(mergedProfile, catalog, mode ?? 'residencial');

    const finalAssistantMessage =
      aiData.assistantMessage?.trim() || finalTechnical.assistantMessage;

    const finalCatalogSelections = [
      ...aiData.catalogSelections,
      ...finalTechnical.catalogSelections.filter(
        (techSel) =>
          !aiData.catalogSelections.some((aiSel) => aiSel.productId === techSel.productId)
      ),
    ];

    const finalOpenQuestions = combineOpenQuestions(
      aiData.openQuestions,
      finalTechnical.openQuestions
    );

    return res.status(200).json({
      assistantMessage: finalAssistantMessage,
      projectPatch: finalTechnical.projectPatch,
      catalogSelections: finalCatalogSelections,
      openQuestions: finalOpenQuestions,
      assumptions: finalTechnical.assumptions,
      nextSteps: finalTechnical.nextSteps,
    });
  } catch (err: unknown) {
    const details = err instanceof Error ? err.message : String(err);
    return res.status(500).json({
      error: 'Unhandled error',
      details,
    });
  }
}
