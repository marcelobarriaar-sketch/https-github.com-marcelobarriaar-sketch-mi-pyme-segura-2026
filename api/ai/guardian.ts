import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';

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
type CatalogProduct = z.infer<typeof CatalogProductSchema>;
type SecurityProjectProfile = z.infer<typeof SecurityProjectProfileSchema>;
type GuardianResponse = z.infer<typeof GuardianResponseSchema>;
type GuardianRequest = z.infer<typeof GuardianRequestSchema>;

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

function pickActiveProducts(catalog: Catalog) {
  const products = (catalog.products || []).filter((p) => p && (p.active ?? true));

  return products.slice(0, 350).map((p) => ({
    id: p.id,
    name: p.name,
    brand: p.brand ?? '',
    model: p.model ?? '',
    sku: p.sku ?? '',
    categoryId: p.categoryId ?? '',
    subcategoryId: p.subcategoryId ?? '',
    priceNet: typeof p.priceNet === 'number' ? p.priceNet : undefined,
    features: p.features ?? [],
  }));
}

function computePricing(profile: SecurityProjectProfile, catalogProducts: CatalogProduct[]) {
  const all = [
    ...(profile.solution?.cameras ?? []),
    ...(profile.solution?.nvrDvr ?? []),
    ...(profile.solution?.storage ?? []),
    ...(profile.solution?.alarm ?? []),
    ...(profile.solution?.accessControl ?? []),
    ...(profile.solution?.network ?? []),
    ...(profile.solution?.power ?? []),
    ...(profile.solution?.extras ?? []),
  ];

  let subtotal = 0;
  const notes: string[] = [];

  for (const item of all) {
    const prod = catalogProducts.find((p) => p.id === item.productId);
    const qty = Number(item.qty ?? 0) || 0;
    const price = typeof prod?.priceNet === 'number' ? prod.priceNet : null;

    if (price == null) {
      notes.push(`Sin precio neto para producto ${item.productId}`);
      continue;
    }

    subtotal += price * qty;
  }

  const iva = Math.round(subtotal * 0.19);
  const total = subtotal + iva;

  return {
    currency: 'CLP' as const,
    subtotalNet: subtotal,
    iva,
    total,
    notes: notes.length ? notes : undefined,
  };
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
      version: (currentProfile?.meta?.version ?? 0) + 1,
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
        details:
          'No llegó catalog en el request y tampoco se pudo leer data/site_data.json',
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';

    if (!apiKey) {
      return res.status(500).json({ error: 'Missing OPENAI_API_KEY' });
    }

    const catalogSlim = pickActiveProducts(catalog);

    const system = `
Eres "MPS Guardian", asesor experto instalador de seguridad para casas, parcelas y pymes en Chile.
Tu misión es conversar, entender la necesidad del cliente y actualizar un PERFIL DE PROYECTO en formato JSON.

REGLAS CRÍTICAS:
1) USA SOLO productos del catálogo entregado (por id). NO inventes marcas, modelos ni productos.
2) Si falta información crítica, pregunta antes. Haz máximo 1 a 3 preguntas por turno, cortas y útiles.
3) Devuelve SIEMPRE una respuesta FINAL en JSON válido con esta forma exacta:
{
  "assistantMessage": "...",
  "projectPatch": { ... },
  "catalogSelections": [{ "productId": "...", "qty": 1, "reason": "..." }],
  "openQuestions": ["..."]
}
4) "projectPatch" debe respetar el schema del perfil. Si no sabes un valor, omítelo.
5) Si sugieres algo sin tener producto exacto, NO lo pongas en solution. Déjalo en openQuestions o assumptions.
6) Tono: español chileno, cercano, claro y profesional.
7) Prioriza soluciones realistas, instalables y coherentes con presupuesto, energía, internet y nivel de riesgo.
8) Modo actual: ${mode ?? 'residencial'}.

IMPORTANTE:
- Responde SOLO con JSON válido.
- No uses markdown.
- No pongas texto antes ni después del JSON.
`.trim();

    const contextMsg = {
      role: 'user' as const,
      content: JSON.stringify(
        {
          instruction:
            'Actualiza el perfil según lo conversado. Propón solución solo si hay datos suficientes. Prioriza coherencia técnica, seguridad, factibilidad de instalación y claridad para el cliente.',
          currentProfile: currentProfile ?? {
            meta: {
              source: 'MPS_GUARDIAN',
              version: 1,
            },
          },
          catalog: catalogSlim,
          note:
            'Usa solo productId existentes. Si no existe el producto exacto, no lo inventes.',
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
        temperature: 0.3,
        max_output_tokens: 900,
      }),
    });

    if (!upstream.ok) {
      const txt = await upstream.text();
      return res.status(502).json({
        error: 'Upstream error',
        details: txt,
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
        assistantMessage:
          'Ya, me faltaron un par de datos clave para dejarte una propuesta firme. ¿Me confirmas tipo de inmueble, cantidad de accesos y si tienes internet estable?',
        projectPatch: currentProfile ?? {
          meta: {
            source: 'MPS_GUARDIAN',
            version: 1,
            createdAt: new Date().toISOString(),
          },
        },
        catalogSelections: [],
        openQuestions: ['Tipo de inmueble', 'Cantidad de accesos', 'Internet estable'],
        _warning: 'Model output was not valid JSON',
        _raw: outputText,
      });
    }

    const validated = GuardianResponseSchema.safeParse(json);

    if (!validated.success) {
      return res.status(200).json({
        assistantMessage:
          'Te entendí, pero todavía me falta dejar la propuesta cerrada. ¿Me confirmas cuántos pisos tiene el lugar, qué zonas quieres cubrir y si hay cortes de luz frecuentes?',
        projectPatch: currentProfile ?? {
          meta: {
            source: 'MPS_GUARDIAN',
            version: 1,
            createdAt: new Date().toISOString(),
          },
        },
        catalogSelections: [],
        openQuestions: ['Cantidad de pisos', 'Zonas a cubrir', 'Cortes de luz frecuentes'],
        _warning: 'Model JSON did not match schema',
        _schemaError: validated.error.flatten(),
        _raw: json,
      });
    }

    const mergedProfile = mergeProfiles(currentProfile, validated.data.projectPatch);
    mergedProfile.pricing = computePricing(mergedProfile, catalog.products || []);

    const response: GuardianResponse & { projectPatch: SecurityProjectProfile } = {
      ...validated.data,
      projectPatch: mergedProfile,
    };

    return res.status(200).json(response);
  } catch (err: unknown) {
    const details = err instanceof Error ? err.message : String(err);
    return res.status(500).json({
      error: 'Unhandled error',
      details,
    });
  }
}
