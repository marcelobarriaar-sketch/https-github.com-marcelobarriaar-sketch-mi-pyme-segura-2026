import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';

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

// Request body schema
const GuardianRequestSchema = z.object({
  messages: z.array(ChatMsgSchema).min(1),
  currentProfile: SecurityProjectProfileSchema.optional(),
  catalog: CatalogSchema,
  // Opcional: para controlar tono o modo
  mode: z.enum(['residencial', 'pyme']).optional(),
});

// =======================
// 2) Helpers
// =======================
function pickActiveProducts(catalog: z.infer<typeof CatalogSchema>) {
  const products = (catalog.products || []).filter((p) => p && (p.active ?? true));
  // Limitar tamaño para no mandar un mamotreto al modelo
  const slim = products.slice(0, 350).map((p) => ({
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
  return slim;
}

function computePricing(profile: any, catalogProducts: Array<any>) {
  const all = [
    ...(profile?.solution?.cameras ?? []),
    ...(profile?.solution?.nvrDvr ?? []),
    ...(profile?.solution?.storage ?? []),
    ...(profile?.solution?.alarm ?? []),
    ...(profile?.solution?.accessControl ?? []),
    ...(profile?.solution?.network ?? []),
    ...(profile?.solution?.power ?? []),
    ...(profile?.solution?.extras ?? []),
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

  return { currency: 'CLP' as const, subtotalNet: subtotal, iva, total, notes: notes.length ? notes : undefined };
}

function safeJsonParse(str: string) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

// Para OpenAI Responses API: necesitamos texto JSON puro
function extractJsonFromText(text: string) {
  // Intento 1: parse directo
  const direct = safeJsonParse(text);
  if (direct) return direct;

  // Intento 2: buscar bloque {...}
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) {
    const slice = text.slice(start, end + 1);
    return safeJsonParse(slice);
  }
  return null;
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
      return res.status(400).json({ error: 'Invalid request body', details: parsed.error.flatten() });
    }

    const { messages, currentProfile, catalog, mode } = parsed.data;

    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
    if (!apiKey) {
      return res.status(500).json({ error: 'Missing OPENAI_API_KEY' });
    }

    const catalogSlim = pickActiveProducts(catalog);

    const system = `
Eres "MPS Guardian", asesor experto instalador de seguridad residencial (cámaras, alarmas, control de acceso, redes y energía).
Tu misión: conversar, entender la necesidad del cliente y actualizar un PERFIL DE PROYECTO en formato JSON.

REGLAS CRÍTICAS (OBLIGATORIAS):
1) USA SOLO productos del catálogo entregado (por id). NO inventes marcas, modelos ni productos.
2) Si falta información crítica, pregunta antes (máximo 1–3 preguntas por turno, cortas).
3) Devuelve SIEMPRE una respuesta FINAL en JSON válido con esta forma:
{
  "assistantMessage": "...",
  "projectPatch": { ... },
  "catalogSelections": [{ "productId": "...", "qty": 1, "reason": "..." }],
  "openQuestions": ["..."]
}
4) "projectPatch" debe seguir el schema del perfil. Si no sabes un valor, omítelo.
5) Si sugieres algo sin tener producto exacto, NO lo pongas en solution: agrégalo a openQuestions/assumptions.
6) Tono: español chileno, cercano y profesional. No chistes largos, directo y claro.
7) Modo: ${mode ?? 'residencial'}.

IMPORTANTE: Responde SOLO con JSON. Sin markdown, sin texto fuera del JSON.
    `.trim();

    // Construimos el contexto que el modelo necesita
    const contextMsg = {
      role: 'user' as const,
      content: JSON.stringify(
        {
          instruction:
            'Actualiza el perfil según lo conversado. Propón solución solo si hay datos suficientes. Prioriza coherencia, seguridad y factibilidad de instalación.',
          currentProfile: currentProfile ?? { meta: { source: 'MPS_GUARDIAN', version: 1 } },
          catalog: catalogSlim,
          note:
            'Recuerda: usa productId del catálogo. Si no existe, no lo inventes; pregunta o deja como openQuestion.',
        },
        null,
        2
      ),
    };

    // Llamada a OpenAI (Responses API)
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
          ...messages.map((m) => ({ role: m.role, content: m.content })),
          contextMsg,
        ],
        // Muy importante para “cero chamullo”
        temperature: 0.3,
        max_output_tokens: 900,
      }),
    });

    if (!upstream.ok) {
      const txt = await upstream.text();
      return res.status(502).json({ error: 'Upstream error', details: txt });
    }

    const data = await upstream.json();

    // Extraer texto generado (Responses API puede traer varios items)
    const outputText =
      data?.output?.[0]?.content?.find((c: any) => c?.type === 'output_text')?.text ??
      data?.output_text ??
      '';

    const json = extractJsonFromText(outputText);
    if (!json) {
      return res.status(200).json({
        assistantMessage:
          'Ya, se me desordenó un poco la respuesta 😅 ¿Me confirmas tipo de vivienda y cuántos accesos tienes? Con eso te armo la propuesta.',
        projectPatch: currentProfile ?? { meta: { source: 'MPS_GUARDIAN', version: 1 } },
        catalogSelections: [],
        openQuestions: ['Tipo de vivienda', 'Cantidad de accesos', 'Zonas a cubrir'],
        _warning: 'Model output was not valid JSON',
        _raw: outputText,
      });
    }

    const validated = GuardianResponseSchema.safeParse(json);
    if (!validated.success) {
      // Intento: responder igual pero sin romper UI
      return res.status(200).json({
        assistantMessage:
          'Te entendí, pero la estructura me quedó medio chueca. ¿Me confirmas cuántos pisos y si tienes internet estable? Con eso lo cierro al tiro.',
        projectPatch: currentProfile ?? { meta: { source: 'MPS_GUARDIAN', version: 1 } },
        catalogSelections: [],
        openQuestions: ['Pisos', 'Internet estable'],
        _warning: 'Model JSON did not match schema',
        _schemaError: validated.error.flatten(),
        _raw: json,
      });
    }

    // Post-proceso: pricing automático con tu catálogo (si hay priceNet)
    const mergedProfile = {
      ...(currentProfile ?? {}),
      ...validated.data.projectPatch,
      meta: {
        createdAt: (currentProfile as any)?.meta?.createdAt ?? new Date().toISOString(),
        version: ((currentProfile as any)?.meta?.version ?? 1) + 1,
        source: 'MPS_GUARDIAN',
      },
    };

    const pricing = computePricing(mergedProfile, catalog.products || []);
    mergedProfile.pricing = pricing;

    return res.status(200).json({
      ...validated.data,
      projectPatch: mergedProfile,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Unhandled error', details: String(err?.message ?? err) });
  }
}
