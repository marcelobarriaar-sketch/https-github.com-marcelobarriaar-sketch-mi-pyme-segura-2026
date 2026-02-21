import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, CheckCircle2, MessageCircle, Sparkles, Info } from 'lucide-react';
import { useSiteData } from '../App';

type BizType =
  | 'retail'
  | 'office'
  | 'warehouse'
  | 'food'
  | 'workshop'
  | 'health'
  | 'education'
  | 'condo'
  | 'farm'
  | 'other';

type NightMode = 'bw' | 'color';

type Priority = 'price' | 'quality' | 'remote' | 'scalable' | 'rugged';
type InternetType = 'fiber' | '4g' | 'none';
type YesNoNA = 'yes' | 'no' | 'na';

type AvgDistance = '0-30' | '30-70' | '70-100' | '100+';
type CableDifficulty = 'easy' | 'mid' | 'hard';

const INSTALL_PER_CAMERA = 20000;

const normalize = (s: any) =>
  String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const containsAny = (text: string, words: string[]) => {
  const t = normalize(text);
  return words.some((w) => t.includes(normalize(w)));
};

const bizOptions: Array<{ id: BizType; title: string; desc: string }> = [
  { id: 'retail', title: 'Comercio / Retail', desc: 'Tienda, minimarket, local, ferretería, etc.' },
  { id: 'office', title: 'Oficina / Corporativo', desc: 'Oficinas, recepción, cowork, empresa.' },
  { id: 'warehouse', title: 'Bodega / Industria', desc: 'Galpones, bodegas, fábricas, patio.' },
  { id: 'food', title: 'Restaurant / Café', desc: 'Salón, caja, cocina, terrazas.' },
  { id: 'workshop', title: 'Taller / Servicio técnico', desc: 'Taller mecánico, vulca, herramientas.' },
  { id: 'health', title: 'Centro de salud', desc: 'Clínica, consulta, dental, laboratorio.' },
  { id: 'education', title: 'Educación', desc: 'Colegio, instituto, academia, salas.' },
  { id: 'condo', title: 'Condominio / Comunidad', desc: 'Accesos, portería, espacios comunes.' },
  { id: 'farm', title: 'Parcela / Campo / Obra', desc: 'Perímetro, portón, bodegas, solar.' },
  { id: 'other', title: 'Otro', desc: 'No calza en ninguna o prefieres explicarlo.' },
];

const priorityOptions: Array<{ id: Priority; title: string; desc: string }> = [
  { id: 'price', title: 'Precio', desc: 'Lo más importante es cuidar el presupuesto.' },
  { id: 'quality', title: 'Mejor imagen', desc: 'Prioridad: nitidez, detalle, mejor calidad.' },
  { id: 'remote', title: 'Ver desde el celular', desc: 'Acceso remoto simple y estable.' },
  { id: 'scalable', title: 'Ampliable a futuro', desc: 'Que pueda crecer sin rehacer todo.' },
  { id: 'rugged', title: 'Resistente a clima', desc: 'Lluvia/viento/polvo: más robusto.' },
];

const internetOptions: Array<{ id: InternetType; title: string; desc: string }> = [
  { id: 'fiber', title: 'Internet fijo (Fibra/Router)', desc: 'Tengo router con internet estable.' },
  { id: '4g', title: 'Solo 4G', desc: 'Uso chip / router 4G.' },
  { id: 'none', title: 'Sin internet (solo grabación local)', desc: 'No necesito ver remoto por ahora.' },
];

const distanceOptions: Array<{ id: AvgDistance; title: string; desc: string }> = [
  { id: '0-30', title: '0–30 m', desc: 'Distancias cortas.' },
  { id: '30-70', title: '30–70 m', desc: 'Distancia media.' },
  { id: '70-100', title: '70–100 m', desc: 'Límite típico de cableado simple.' },
  { id: '100+', title: '+100 m', desc: 'Probable solución especial (enlace/fibra/repetición).' },
];

const difficultyOptions: Array<{ id: CableDifficulty; title: string; desc: string }> = [
  { id: 'easy', title: 'Fácil', desc: 'Canaletas/ductos, buen acceso.' },
  { id: 'mid', title: 'Regular', desc: 'Hay que ingeniárselas un poco.' },
  { id: 'hard', title: 'Difícil', desc: 'Varios edificios/campo/galpón/altura.' },
];

// --- Helpers catálogo/tags ---------------------------------------------------

const getTags = (p: any): string[] =>
  Array.isArray(p?.tags) ? p.tags.map((t: any) => normalize(t)) : [];

const hasAllTags = (p: any, required: string[]) => {
  const t = new Set(getTags(p));
  return required.every((x) => t.has(normalize(x)));
};

const anyTag = (p: any, tags: string[]) => {
  const t = new Set(getTags(p));
  return tags.some((x) => t.has(normalize(x)));
};

const isActive = (p: any) => p?.active !== false;

const productText = (p: any) =>
  [
    p?.name,
    p?.brand,
    p?.model,
    ...(Array.isArray(p?.features) ? p.features : []),
    ...(Array.isArray(p?.tags) ? p.tags : []),
  ]
    .filter(Boolean)
    .join(' ');

const isCamera = (p: any, cameraCategoryIds: string[]) => {
  // Prefer tags si existen
  if (anyTag(p, ['camera_ip', 'camera_analog'])) return true;

  // Si hay categorías tipo cámaras
  const catOk = cameraCategoryIds.length > 0 ? cameraCategoryIds.includes(String(p?.categoryId ?? '')) : false;
  if (catOk) return true;

  // Fallback por texto
  const text = productText(p);
  return containsAny(text, ['camara', 'camera', 'cctv', 'dome', 'bullet', 'ptz', 'turret']);
};

const pickCheapest = (items: any[]) => {
  if (!items.length) return null;
  return items
    .slice()
    .sort((a, b) => Number(a?.priceNet ?? 0) - Number(b?.priceNet ?? 0))[0];
};

const findByTagsOrKeywords = (all: any[], opts: { tags?: string[]; anyTags?: string[]; keywords?: string[] }) => {
  const active = all.filter(isActive);

  const byTags =
    opts.tags && opts.tags.length
      ? active.filter((p) => hasAllTags(p, opts.tags!))
      : [];

  const byAnyTags =
    opts.anyTags && opts.anyTags.length
      ? active.filter((p) => anyTag(p, opts.anyTags!))
      : [];

  const byKeywords =
    opts.keywords && opts.keywords.length
      ? active.filter((p) => containsAny(productText(p), opts.keywords!))
      : [];

  // Preferimos match por tags; si no, keywords
  const merged = (byTags.length ? byTags : byAnyTags.length ? byAnyTags : byKeywords).filter(Boolean);
  return pickCheapest(merged);
};

const channelsTag = (n: number) => `channels_${n}`;

// --- Recomendador ------------------------------------------------------------

type BuilderAnswers = {
  priority: Priority | null;
  internetType: InternetType | null;
  recorderSameAsInternet: YesNoNA | null;
  avgDistance: AvgDistance | null;
  cableDifficulty: CableDifficulty | null;
  smartAlerts: boolean;
  wantUps: boolean;
  nightMode: NightMode | null;
};

type SuggestItem = { id: string; qty: number; reason: string; bucket: 'required' | 'recommended' | 'optional' };

const inferSystemType = (a: BuilderAnswers) => {
  // Heurística pro: el cliente responde “problema”, tú resuelves “tecnología”
  if (a.smartAlerts) return 'ip' as const;
  if (a.priority === 'quality' || a.priority === 'scalable' || a.cableDifficulty === 'hard') return 'ip' as const;
  if (a.priority === 'price' && (a.avgDistance === '0-30' || a.avgDistance === '30-70')) return 'analog' as const;
  if (a.internetType === 'none') return 'analog' as const; // por costo/operación típica
  return 'ip' as const;
};

const pickRecorder = (all: any[], system: 'ip' | 'analog', cams: number) => {
  const channels = cams <= 4 ? 4 : cams <= 8 ? 8 : cams <= 16 ? 16 : 32;

  if (system === 'ip') {
    // Prefer tags: recorder_nvr + channels_X
    const byTags = findByTagsOrKeywords(all, { tags: ['recorder_nvr', channelsTag(channels)] });
    if (byTags) return byTags;

    // Fallback keywords
    return findByTagsOrKeywords(all, {
      keywords: ['nvr', 'grabador ip', 'grabador', 'network video recorder', `${channels}ch`, `${channels} canales`],
    });
  }

  const byTags = findByTagsOrKeywords(all, { tags: ['recorder_dvr', channelsTag(channels)] });
  if (byTags) return byTags;

  return findByTagsOrKeywords(all, {
    keywords: ['dvr', 'grabador analog', 'grabador', 'hdtvi', 'cvi', `${channels}ch`, `${channels} canales`],
  });
};

const pickSwitch = (all: any[], cams: number, preferPoe: boolean) => {
  const ports = cams <= 6 ? 8 : cams <= 12 ? 16 : 24;

  if (preferPoe) {
    const byTags = findByTagsOrKeywords(all, { tags: ['switch_poe', `switch_${ports}p`] });
    if (byTags) return byTags;

    // Si no hay tag de tamaño, al menos PoE
    const anyPoe = findByTagsOrKeywords(all, { anyTags: ['switch_poe'] });
    if (anyPoe) return anyPoe;

    return findByTagsOrKeywords(all, { keywords: ['switch poe', 'poe switch'] });
  }

  const byTags = findByTagsOrKeywords(all, { tags: ['switch', `switch_${ports}p`] });
  if (byTags) return byTags;

  const anySwitch = findByTagsOrKeywords(all, { anyTags: ['switch'] });
  if (anySwitch) return anySwitch;

  return findByTagsOrKeywords(all, { keywords: ['switch'] });
};

const pickPowerSupply12v5a = (all: any[]) => {
  const byTags = findByTagsOrKeywords(all, { anyTags: ['power_supply_12v_5a'] });
  if (byTags) return byTags;
  return findByTagsOrKeywords(all, { keywords: ['12v 5a', '12v5a', 'fuente 12v 5a', 'fuente 12v5a'] });
};

const pickWirelessLink = (all: any[]) => {
  // Prefer kit/pair si existe; si no, 2 unidades
  const kit = findByTagsOrKeywords(all, { anyTags: ['wireless_link_pair'] }) || findByTagsOrKeywords(all, { keywords: ['kit enlace', 'par enlace', 'punto a punto', 'ptp'] });
  if (kit) return { product: kit, isKit: true };

  const unit =
    findByTagsOrKeywords(all, { anyTags: ['wireless_link_unit', 'wireless_link'] }) ||
    findByTagsOrKeywords(all, { keywords: ['nanostation', 'loco', 'airmax', 'enlace', 'punto a punto', 'ptp'] });

  if (unit) return { product: unit, isKit: false };
  return { product: null, isKit: false };
};

const pickUps = (all: any[]) => {
  const byTags = findByTagsOrKeywords(all, { anyTags: ['ups'] });
  if (byTags) return byTags;
  return findByTagsOrKeywords(all, { keywords: ['ups', 'respaldo energia', 'no break', 'nobreak'] });
};

const buildSuggestions = (products: any[], answers: BuilderAnswers, camerasCount: number): SuggestItem[] => {
  const suggestions: SuggestItem[] = [];
  if (camerasCount <= 0) return suggestions;

  const system = inferSystemType(answers);

  // 1) Grabador (siempre requerido)
  const recorder = pickRecorder(products, system, camerasCount);
  if (recorder?.id) {
    suggestions.push({
      id: String(recorder.id),
      qty: 1,
      reason: system === 'ip' ? 'Grabación IP (NVR) según cantidad de cámaras.' : 'Grabación análoga (DVR) según cantidad de cámaras.',
      bucket: 'required',
    });
  }

  // 2) Switch / Fuentes según sistema
  if (system === 'ip') {
    const preferPoe = answers.cableDifficulty !== 'easy' || answers.avgDistance !== '0-30' || answers.priority === 'scalable';
    const sw = pickSwitch(products, camerasCount, preferPoe);
    if (sw?.id) {
      suggestions.push({
        id: String(sw.id),
        qty: 1,
        reason: preferPoe ? 'Switch PoE recomendado (menos cableado de energía, instalación más limpia).' : 'Switch para red de cámaras IP.',
        bucket: 'required',
      });
    }
  } else {
    // Regla tuya: cada 3 cámaras -> 1 fuente 12V 5A (ajustable)
    const ps = pickPowerSupply12v5a(products);
    const qty = Math.max(1, Math.ceil(camerasCount / 3));
    if (ps?.id) {
      suggestions.push({
        id: String(ps.id),
        qty,
        reason: `Alimentación análoga: 1 fuente 12V 5A cada 3 cámaras (estimación: ${qty}).`,
        bucket: 'required',
      });
    }
  }

  // 3) Enlaces si grabador e internet están en lugares distintos
  if (answers.recorderSameAsInternet === 'no') {
    const link = pickWirelessLink(products);
    if (link.product?.id) {
      suggestions.push({
        id: String(link.product.id),
        qty: link.isKit ? 1 : 2,
        reason: link.isKit
          ? 'Internet y grabador en lugares distintos: se requiere kit de enlaces (par).'
          : 'Internet y grabador en lugares distintos: se requieren 2 antenas de enlace (par).',
        bucket: 'required',
      });
    }
  }

  // 4) Recomendados por noche
  if (answers.nightMode === 'color') {
    // Aquí no agregamos una cámara (porque el usuario ya eligió las cámaras),
    // pero si tienes productos tipo “iluminación” o similares, podrías sugerir.
    // Lo dejamos como guía sin forzar un producto.
  }

  // 5) UPS si quiere respaldo
  if (answers.wantUps) {
    const ups = pickUps(products);
    if (ups?.id) {
      suggestions.push({
        id: String(ups.id),
        qty: 1,
        reason: 'Respaldo ante cortes de luz (UPS).',
        bucket: 'recommended',
      });
    }
  }

  // 6) Opcional: si distancia +100 o cable difícil, sugerir enlace aunque no lo haya marcado
  if ((answers.avgDistance === '100+' || answers.cableDifficulty === 'hard') && answers.recorderSameAsInternet !== 'no') {
    const link = pickWirelessLink(products);
    if (link.product?.id) {
      suggestions.push({
        id: String(link.product.id),
        qty: link.isKit ? 1 : 2,
        reason: 'Distancias altas / cableado difícil: un enlace puede simplificar la instalación (opcional según visita técnica).',
        bucket: 'optional',
      });
    }
  }

  return suggestions;
};

// --- Componente --------------------------------------------------------------

export default function TraditionalBuilder() {
  const { data } = useSiteData() as any;

  // ✅ Tu catálogo real (según Equipment.tsx)
  const catalog = (data as any).catalog ?? { categories: [], products: [] };
  const categories = (catalog.categories ?? []) as any[];
  const products = (catalog.products ?? []) as any[];

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Paso 1
  const [bizType, setBizType] = useState<BizType | null>(null);

  // Paso 2 (nuevo)
  const [priority, setPriority] = useState<Priority | null>(null);
  const [internetType, setInternetType] = useState<InternetType | null>(null);
  const [recorderSameAsInternet, setRecorderSameAsInternet] = useState<YesNoNA | null>(null);
  const [avgDistance, setAvgDistance] = useState<AvgDistance | null>(null);
  const [cableDifficulty, setCableDifficulty] = useState<CableDifficulty | null>(null);
  const [smartAlerts, setSmartAlerts] = useState(false);
  const [wantUps, setWantUps] = useState(false);

  // Noche (se mantiene)
  const [nightMode, setNightMode] = useState<NightMode | null>(null);

  // carrito: { [productId]: qty }  (ahora sirve para TODO: cámaras + equipos sugeridos)
  const [cart, setCart] = useState<Record<string, number>>({});

  // Detectar categorías “cámaras” por nombre (si existen)
  const cameraCategoryIds = useMemo(() => {
    return categories
      .filter((c: any) => containsAny(c?.name, ['camara', 'camaras', 'cctv', 'camera']))
      .map((c: any) => String(c.id));
  }, [categories]);

  const activeProducts = useMemo(() => products.filter(isActive), [products]);

  // Candidatos cámara (usa tags si existen; fallback por texto/categoría)
  const cameraCandidates = useMemo(() => {
    const base = activeProducts.filter((p: any) => isCamera(p, cameraCategoryIds));

    // filtro por noche a color (si corresponde)
    if (nightMode === 'color') {
      return base.filter((p: any) => {
        if (anyTag(p, ['camera_color_night'])) return true;
        const text = productText(p);
        return containsAny(text, ['colorvu', 'full color', 'hibrida', 'hybrid', 'starlight', 'color de noche']);
      });
    }

    return base;
  }, [activeProducts, cameraCategoryIds, nightMode]);

  const cameraIdsSet = useMemo(() => new Set(cameraCandidates.map((p: any) => String(p?.id))), [cameraCandidates]);

  // Items del carrito (todos)
  const cartItemsAll = useMemo(() => {
    const byId = new Map(activeProducts.map((p: any) => [String(p?.id), p]));
    return Object.entries(cart)
      .map(([id, qty]) => {
        const p = byId.get(String(id));
        if (!p || qty <= 0) return null;
        return { p, qty };
      })
      .filter(Boolean) as Array<{ p: any; qty: number }>;
  }, [cart, activeProducts]);

  // Items cámara del carrito
  const cartItemsCameras = useMemo(() => {
    return cartItemsAll.filter((it) => cameraIdsSet.has(String(it.p?.id)));
  }, [cartItemsAll, cameraIdsSet]);

  const camerasCount = useMemo(() => cartItemsCameras.reduce((acc, it) => acc + it.qty, 0), [cartItemsCameras]);

  const subtotalNet = useMemo(() => {
    return cartItemsAll.reduce((acc, it) => acc + Number(it.p?.priceNet ?? 0) * it.qty, 0);
  }, [cartItemsAll]);

  const installCost = useMemo(() => camerasCount * INSTALL_PER_CAMERA, [camerasCount]);
  const totalNet = useMemo(() => subtotalNet + installCost, [subtotalNet, installCost]);

  const setQty = (id: string, qty: number) => {
    setCart((prev) => {
      const next = { ...prev };
      const q = Math.max(0, Math.min(999, qty));
      if (q <= 0) delete next[id];
      else next[id] = q;
      return next;
    });
  };

  const nextStep = () => setStep((s) => (s < 4 ? ((s + 1) as any) : s));
  const prevStep = () => setStep((s) => (s > 1 ? ((s - 1) as any) : s));

  const canGoNext =
    (step === 1 && !!bizType) ||
    (step === 2 &&
      !!nightMode &&
      !!priority &&
      !!internetType &&
      !!avgDistance &&
      !!cableDifficulty &&
      (!!recorderSameAsInternet || internetType === 'none')) ||
    (step === 3 && camerasCount > 0) ||
    step === 4;

  // WhatsApp
  const phone = String(data?.whatsappConfig?.phoneNumber ?? '').replace(/\D/g, '');
  const waBase = phone ? `https://wa.me/${phone}` : 'https://wa.me/56900000000';

  const bizLabel = bizOptions.find((b) => b.id === bizType)?.title ?? '';
  const nightLabel = nightMode === 'color' ? 'Color (noche a color)' : 'Blanco y negro (IR)';

  const priorityLabel = priorityOptions.find((p) => p.id === priority)?.title ?? '';
  const internetLabel = internetOptions.find((i) => i.id === internetType)?.title ?? '';
  const distLabel = distanceOptions.find((d) => d.id === avgDistance)?.title ?? '';
  const diffLabel = difficultyOptions.find((d) => d.id === cableDifficulty)?.title ?? '';

  const answers: BuilderAnswers = useMemo(
    () => ({
      priority,
      internetType,
      recorderSameAsInternet: internetType === 'none' ? 'na' : recorderSameAsInternet,
      avgDistance,
      cableDifficulty,
      smartAlerts,
      wantUps,
      nightMode,
    }),
    [priority, internetType, recorderSameAsInternet, avgDistance, cableDifficulty, smartAlerts, wantUps, nightMode]
  );

  const systemType = useMemo(() => inferSystemType(answers), [answers]);
  const systemLabel = systemType === 'ip' ? 'IP (NVR + red)' : 'Análogo (DVR + coaxial)';

  const suggestions = useMemo(() => buildSuggestions(activeProducts, answers, camerasCount), [activeProducts, answers, camerasCount]);

  // Para mostrar sugerencias con datos del producto
  const suggestionsWithProduct = useMemo(() => {
    const byId = new Map(activeProducts.map((p: any) => [String(p?.id), p]));
    return suggestions
      .map((s) => {
        const p = byId.get(String(s.id));
        if (!p) return null;
        return { ...s, p };
      })
      .filter(Boolean) as Array<SuggestItem & { p: any }>;
  }, [suggestions, activeProducts]);

  const addSuggestion = (id: string, qty: number) => {
    setCart((prev) => {
      const next = { ...prev };
      next[id] = (next[id] ?? 0) + qty;
      return next;
    });
  };

  const waMessage = useMemo(() => {
    const lines = [
      'Hola! Quiero cotizar un proyecto TRADICIONAL en Mi Pyme Segura.',
      '',
      `Negocio: ${bizLabel || '—'}`,
      `Prioridad: ${priorityLabel || '—'}`,
      `Internet: ${internetLabel || '—'}`,
      `Grabador e internet mismo lugar: ${
        internetType === 'none' ? 'No aplica (sin internet)' : recorderSameAsInternet === 'yes' ? 'Sí' : recorderSameAsInternet === 'no' ? 'No' : '—'
      }`,
      `Distancia: ${distLabel || '—'}`,
      `Cableado: ${diffLabel || '—'}`,
      `Noche: ${nightMode ? nightLabel : '—'}`,
      `Alertas inteligentes: ${smartAlerts ? 'Sí' : 'No'}`,
      `Respaldo energía (UPS): ${wantUps ? 'Sí' : 'No'}`,
      '',
      `Sugerencia sistema: ${systemLabel}`,
      '',
      'Selección:',
      ...cartItemsAll.map(
        (it) =>
          `- ${it.qty} x ${it.p?.name || 'Producto'} (${[it.p?.brand, it.p?.model].filter(Boolean).join(' ')})`
      ),
      '',
      `Subtotal neto equipos: $${subtotalNet.toLocaleString('es-CL')}`,
      `Instalación: $${installCost.toLocaleString('es-CL')} (${camerasCount} x $${INSTALL_PER_CAMERA.toLocaleString('es-CL')})`,
      `TOTAL NETO: $${totalNet.toLocaleString('es-CL')}`,
      '',
      'Quedo atento/a. Gracias!',
    ];
    return encodeURIComponent(lines.join('\n'));
  }, [
    bizLabel,
    priorityLabel,
    internetLabel,
    recorderSameAsInternet,
    internetType,
    distLabel,
    diffLabel,
    nightMode,
    nightLabel,
    smartAlerts,
    wantUps,
    systemLabel,
    cartItemsAll,
    subtotalNet,
    installCost,
    camerasCount,
    totalNet,
  ]);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between gap-4">
          <Link to="/create-project" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black">
            <ArrowLeft size={16} /> Volver
          </Link>
          <div className="text-sm text-gray-500">
            Paso <span className="font-semibold text-black">{step}</span> de 4
          </div>
        </div>

        <h1 className="mt-4 text-3xl md:text-4xl font-black text-gray-900">Crea tu Proyecto (Tradicional)</h1>
        <p className="mt-2 text-gray-600">Arma tu cotización paso a paso. Total neto (sin IVA) + instalación.</p>

        <div className="mt-8 rounded-2xl border border-gray-200 p-5 md:p-7 shadow-sm">
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900">¿Qué negocio protegemos?</h2>
              <p className="text-gray-600 mt-1">Elige la opción que más se parezca. Si no calza, pon “Otro”.</p>

              <div className="mt-5 grid md:grid-cols-2 gap-3">
                {bizOptions.map((opt) => {
                  const selected = bizType === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setBizType(opt.id)}
                      className={[
                        'text-left rounded-2xl border p-4 transition',
                        selected ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400',
                      ].join(' ')}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-extrabold text-gray-900">{opt.title}</div>
                          <div className="text-sm text-gray-600 mt-1">{opt.desc}</div>
                        </div>
                        {selected && <CheckCircle2 className="shrink-0" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900">Cuéntanos del lugar</h2>
              <p className="text-gray-600 mt-1">
                Esto ayuda a recomendarte el sistema correcto (sin marearte con tecnicismos).
              </p>

              {/* Prioridad */}
              <div className="mt-6">
                <div className="font-extrabold text-gray-900">¿Qué es lo más importante para ti?</div>
                <div className="mt-3 grid md:grid-cols-2 gap-3">
                  {priorityOptions.map((opt) => {
                    const selected = priority === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setPriority(opt.id)}
                        className={[
                          'text-left rounded-2xl border p-4 transition',
                          selected ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400',
                        ].join(' ')}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-extrabold text-gray-900">{opt.title}</div>
                            <div className="text-sm text-gray-600 mt-1">{opt.desc}</div>
                          </div>
                          {selected && <CheckCircle2 className="shrink-0" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Internet */}
              <div className="mt-7">
                <div className="font-extrabold text-gray-900">¿Qué internet tienes o tendrás?</div>
                <div className="mt-3 grid md:grid-cols-3 gap-3">
                  {internetOptions.map((opt) => {
                    const selected = internetType === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => {
                          setInternetType(opt.id);
                          if (opt.id === 'none') setRecorderSameAsInternet('na');
                        }}
                        className={[
                          'text-left rounded-2xl border p-4 transition',
                          selected ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400',
                        ].join(' ')}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-extrabold text-gray-900">{opt.title}</div>
                            <div className="text-sm text-gray-600 mt-1">{opt.desc}</div>
                          </div>
                          {selected && <CheckCircle2 className="shrink-0" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {internetType && internetType !== 'none' ? (
                  <div className="mt-4 rounded-2xl border border-gray-200 p-4">
                    <div className="font-bold text-gray-900">¿El grabador quedará en el mismo lugar donde llega el internet?</div>
                    <div className="mt-3 grid sm:grid-cols-2 gap-3">
                      <button
                        onClick={() => setRecorderSameAsInternet('yes')}
                        className={[
                          'rounded-2xl border p-4 text-left transition',
                          recorderSameAsInternet === 'yes' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400',
                        ].join(' ')}
                      >
                        <div className="font-extrabold text-gray-900">Sí</div>
                        <div className="text-sm text-gray-600 mt-1">Perfecto, no deberías necesitar enlaces.</div>
                      </button>
                      <button
                        onClick={() => setRecorderSameAsInternet('no')}
                        className={[
                          'rounded-2xl border p-4 text-left transition',
                          recorderSameAsInternet === 'no' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400',
                        ].join(' ')}
                      >
                        <div className="font-extrabold text-gray-900">No</div>
                        <div className="text-sm text-gray-600 mt-1">Te sugeriremos enlaces (antenas) si hay en catálogo.</div>
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Distancia y dificultad */}
              <div className="mt-7 grid md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-gray-200 p-4">
                  <div className="font-extrabold text-gray-900">Distancia promedio grabador → cámaras</div>
                  <div className="mt-3 grid gap-2">
                    {distanceOptions.map((opt) => {
                      const selected = avgDistance === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => setAvgDistance(opt.id)}
                          className={[
                            'rounded-2xl border p-3 text-left transition',
                            selected ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400',
                          ].join(' ')}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-extrabold text-gray-900">{opt.title}</div>
                              <div className="text-sm text-gray-600 mt-1">{opt.desc}</div>
                            </div>
                            {selected && <CheckCircle2 className="shrink-0" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 p-4">
                  <div className="font-extrabold text-gray-900">¿Qué tan fácil es pasar cable?</div>
                  <div className="mt-3 grid gap-2">
                    {difficultyOptions.map((opt) => {
                      const selected = cableDifficulty === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => setCableDifficulty(opt.id)}
                          className={[
                            'rounded-2xl border p-3 text-left transition',
                            selected ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400',
                          ].join(' ')}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-extrabold text-gray-900">{opt.title}</div>
                              <div className="text-sm text-gray-600 mt-1">{opt.desc}</div>
                            </div>
                            {selected && <CheckCircle2 className="shrink-0" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Noche */}
              <div className="mt-7">
                <div className="flex items-center gap-2">
                  <div className="font-extrabold text-gray-900">¿Cómo quieres ver la noche?</div>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 inline-flex items-center gap-1">
                    <Info size={14} /> filtra cámaras
                  </span>
                </div>

                <p className="text-gray-600 mt-1">
                  Si eliges <b>Color</b>, te mostraremos cámaras tipo <b>ColorVu / Full Color / Híbridas</b> (según tags o features).
                </p>

                <div className="mt-4 grid md:grid-cols-2 gap-3">
                  <button
                    onClick={() => setNightMode('bw')}
                    className={[
                      'rounded-2xl border p-4 text-left transition',
                      nightMode === 'bw' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400',
                    ].join(' ')}
                  >
                    <div className="font-extrabold text-gray-900">Blanco y negro</div>
                    <div className="text-sm text-gray-600 mt-1">Visión infrarroja clásica (IR).</div>
                  </button>

                  <button
                    onClick={() => setNightMode('color')}
                    className={[
                      'rounded-2xl border p-4 text-left transition',
                      nightMode === 'color' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400',
                    ].join(' ')}
                  >
                    <div className="font-extrabold text-gray-900">Color</div>
                    <div className="text-sm text-gray-600 mt-1">Mejor detalle nocturno (ColorVu / Full Color / Híbridas).</div>
                  </button>
                </div>
              </div>

              {/* Extras */}
              <div className="mt-7 grid md:grid-cols-2 gap-3">
                <button
                  onClick={() => setSmartAlerts((v) => !v)}
                  className={[
                    'rounded-2xl border p-4 text-left transition',
                    smartAlerts ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400',
                  ].join(' ')}
                >
                  <div className="font-extrabold text-gray-900">Quiero alertas inteligentes</div>
                  <div className="text-sm text-gray-600 mt-1">Persona/vehículo (si tu catálogo tiene equipos con IA).</div>
                </button>

                <button
                  onClick={() => setWantUps((v) => !v)}
                  className={[
                    'rounded-2xl border p-4 text-left transition',
                    wantUps ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400',
                  ].join(' ')}
                >
                  <div className="font-extrabold text-gray-900">Quiero respaldo de energía</div>
                  <div className="text-sm text-gray-600 mt-1">Agregar UPS (ideal en zonas con cortes).</div>
                </button>
              </div>

              {/* Recomendación “sistema” */}
              {priority && internetType && avgDistance && cableDifficulty ? (
                <div className="mt-7 rounded-2xl border border-gray-200 p-4 bg-gray-50">
                  <div className="flex items-center gap-2 font-bold text-gray-900">
                    <Sparkles size={18} /> Recomendación automática
                  </div>
                  <div className="mt-2 text-sm text-gray-700">
                    Según tus respuestas, el sistema recomendado es:{' '}
                    <b className="text-gray-900">{systemLabel}</b>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    *Esto es una sugerencia. La visita técnica puede ajustar por factibilidad y layout.
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900">Elige tus cámaras (catálogo)</h2>
              <p className="text-gray-600 mt-1">
                Selecciona cantidades. Se sumará el total neto y la instalación ($
                {INSTALL_PER_CAMERA.toLocaleString('es-CL')} por cámara).
              </p>

              {cameraCandidates.length === 0 ? (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
                  No encontré cámaras para mostrar con el filtro actual.
                  <div className="text-sm mt-2">
                    Tip: agrega tags <b>camera_ip</b> / <b>camera_analog</b> y para color noche <b>camera_color_night</b>.
                    Si no, al menos que en <b>features</b> venga “cámara”, “PTZ”, “bullet”, etc.
                  </div>
                </div>
              ) : (
                <div className="mt-5 grid lg:grid-cols-2 gap-3">
                  {cameraCandidates.map((p: any) => {
                    const id = String(p?.id);
                    const qty = cart[id] ?? 0;

                    return (
                      <div key={id} className="rounded-2xl border border-gray-200 p-4">
                        <div className="flex gap-4">
                          <div className="w-24 h-20 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                            {p?.imageUrl ? (
                              <img src={p.imageUrl} alt={p?.name || 'Producto'} className="w-full h-full object-cover" />
                            ) : null}
                          </div>

                          <div className="flex-1">
                            <div className="font-extrabold text-gray-900">{p?.name}</div>
                            <div className="text-sm text-gray-600">{[p?.brand, p?.model].filter(Boolean).join(' ')}</div>
                            <div className="mt-2 text-sm font-semibold text-gray-900">
                              Neto: ${Number(p?.priceNet ?? 0).toLocaleString('es-CL')}
                            </div>

                            <div className="mt-3 flex items-center gap-2">
                              <button
                                onClick={() => setQty(id, qty - 1)}
                                className="p-2 rounded-xl border border-gray-200 hover:border-gray-400"
                              >
                                <Minus size={16} />
                              </button>

                              <div className="min-w-[48px] text-center font-bold">{qty}</div>

                              <button
                                onClick={() => setQty(id, qty + 1)}
                                className="p-2 rounded-xl border border-gray-200 hover:border-gray-400"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          </div>
                        </div>

                        {Array.isArray(p?.features) && p.features.length > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {p.features.slice(0, 6).map((f: string, i: number) => (
                              <span key={i} className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                                {f}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Sugeridos */}
              <div className="mt-7 rounded-2xl border border-gray-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-gray-900">Equipos sugeridos automáticamente</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Basado en tus respuestas y en el número de cámaras ({camerasCount}). Sistema sugerido: <b>{systemLabel}</b>
                    </div>
                  </div>
                </div>

                {camerasCount <= 0 ? (
                  <div className="mt-3 text-sm text-gray-600">Primero elige al menos 1 cámara para calcular sugerencias.</div>
                ) : suggestionsWithProduct.length === 0 ? (
                  <div className="mt-3 text-sm text-gray-600">
                    No encontré productos para sugerir (probablemente faltan tags en tu catálogo).
                    <div className="text-xs text-gray-500 mt-1">
                      Recomendado: taggear grabadores con <b>recorder_nvr</b>/<b>recorder_dvr</b> y canales <b>channels_4/8/16</b>,
                      switches con <b>switch</b>/<b>switch_poe</b> y fuentes <b>power_supply_12v_5a</b>.
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 grid lg:grid-cols-2 gap-3">
                    {suggestionsWithProduct.map((s) => {
                      const id = String(s.p?.id);
                      const inCartQty = cart[id] ?? 0;

                      const badge =
                        s.bucket === 'required'
                          ? 'Obligatorio'
                          : s.bucket === 'recommended'
                          ? 'Recomendado'
                          : 'Opcional';

                      return (
                        <div key={`${s.bucket}-${id}`} className="rounded-2xl border border-gray-200 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">{badge}</span>
                                <div className="text-xs text-gray-500 truncate">{[s.p?.brand, s.p?.model].filter(Boolean).join(' ')}</div>
                              </div>

                              <div className="mt-1 font-extrabold text-gray-900 truncate">{s.p?.name}</div>
                              <div className="mt-1 text-sm text-gray-600">{s.reason}</div>

                              <div className="mt-2 text-sm font-semibold text-gray-900">
                                Neto: ${Number(s.p?.priceNet ?? 0).toLocaleString('es-CL')}
                              </div>
                            </div>

                            <div className="shrink-0 text-right">
                              <button
                                onClick={() => addSuggestion(id, s.qty)}
                                className="rounded-2xl bg-black text-white px-3 py-2 text-sm font-bold"
                              >
                                Agregar {s.qty}
                              </button>
                              <div className="mt-2 text-xs text-gray-500">En carrito: <b>{inCartQty}</b></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Resumen */}
              <div className="mt-6 rounded-2xl border border-gray-200 p-4 bg-gray-50">
                <div className="font-bold text-gray-900">Resumen</div>
                <div className="mt-2 text-sm text-gray-700">
                  Cámaras: <b>{camerasCount}</b> | Equipos neto: <b>${subtotalNet.toLocaleString('es-CL')}</b> | Instalación:{' '}
                  <b>${installCost.toLocaleString('es-CL')}</b> | Total neto: <b>${totalNet.toLocaleString('es-CL')}</b>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900">Finalizar</h2>
              <p className="text-gray-600 mt-1">Revisa tu resumen y envíanos la solicitud.</p>

              <div className="mt-5 rounded-2xl border border-gray-200 p-4">
                <div className="text-sm text-gray-700 space-y-1">
                  <div><b>Negocio:</b> {bizLabel || '—'}</div>
                  <div><b>Prioridad:</b> {priorityLabel || '—'}</div>
                  <div><b>Internet:</b> {internetLabel || '—'}</div>
                  <div>
                    <b>Grabador e internet mismo lugar:</b>{' '}
                    {internetType === 'none'
                      ? 'No aplica (sin internet)'
                      : recorderSameAsInternet === 'yes'
                      ? 'Sí'
                      : recorderSameAsInternet === 'no'
                      ? 'No'
                      : '—'}
                  </div>
                  <div><b>Distancia:</b> {distLabel || '—'}</div>
                  <div><b>Cableado:</b> {diffLabel || '—'}</div>
                  <div><b>Noche:</b> {nightMode ? nightLabel : '—'}</div>
                  <div><b>Alertas inteligentes:</b> {smartAlerts ? 'Sí' : 'No'}</div>
                  <div><b>UPS:</b> {wantUps ? 'Sí' : 'No'}</div>
                  <div className="pt-2">
                    <b>Sistema sugerido:</b> <span className="font-extrabold text-gray-900">{systemLabel}</span>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="font-bold text-gray-900">Selección</div>
                  {cartItemsAll.length === 0 ? (
                    <div className="text-sm text-gray-600 mt-2">No seleccionaste productos.</div>
                  ) : (
                    <ul className="mt-2 space-y-2 text-sm text-gray-700">
                      {cartItemsAll.map((it) => (
                        <li key={String(it.p?.id)} className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <b>{it.qty}x</b> {it.p?.name}{' '}
                            <span className="text-gray-500">({[it.p?.brand, it.p?.model].filter(Boolean).join(' ')})</span>
                          </div>
                          <div className="font-semibold">
                            ${(Number(it.p?.priceNet ?? 0) * it.qty).toLocaleString('es-CL')}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mt-5 border-t pt-4 text-sm text-gray-800">
                  <div className="flex justify-between">
                    <span>Subtotal neto equipos</span>
                    <b>${subtotalNet.toLocaleString('es-CL')}</b>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span>Instalación ({camerasCount} x ${INSTALL_PER_CAMERA.toLocaleString('es-CL')})</span>
                    <b>${installCost.toLocaleString('es-CL')}</b>
                  </div>
                  <div className="flex justify-between mt-2 text-base">
                    <span>Total neto</span>
                    <b>${totalNet.toLocaleString('es-CL')}</b>
                  </div>

                  <div className="text-xs text-gray-500 mt-2">
                    *Valores netos, sin IVA. El total final puede variar según factibilidad, cableados, altura y condiciones del lugar.
                  </div>
                </div>

                <div className="mt-5 flex flex-col sm:flex-row gap-3">
                  <a
                    href={`${waBase}?text=${waMessage}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-black text-white px-4 py-3 font-bold"
                  >
                    <MessageCircle size={18} /> Enviar por WhatsApp
                  </a>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={prevStep}
              disabled={step === 1}
              className={[
                'rounded-2xl px-4 py-3 font-bold border',
                step === 1 ? 'border-gray-200 text-gray-400 cursor-not-allowed' : 'border-gray-300 hover:border-gray-500',
              ].join(' ')}
            >
              Atrás
            </button>

            <button
              onClick={nextStep}
              disabled={!canGoNext || step === 4}
              className={[
                'rounded-2xl px-4 py-3 font-bold',
                !canGoNext || step === 4 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-black text-white',
              ].join(' ')}
            >
              {step === 3 ? 'Continuar' : step === 4 ? 'Listo' : 'Siguiente'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
