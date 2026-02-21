import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Minus,
  Plus,
  CheckCircle2,
  MessageCircle,
  Sparkles,
  Info,
  Shield,
  Cable,
  Wifi,
  Cpu,
  Zap,
  BadgeCheck,
  Satellite,
} from 'lucide-react';
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
type InternetType = 'fiber' | '4g' | 'starlink' | 'none';
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

const toggleInArray = <T,>(arr: T[], value: T) =>
  arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value];

const bizOptions: Array<{ id: BizType; title: string; desc: string; icon: any }> = [
  { id: 'retail', title: 'Comercio / Retail', desc: 'Tienda, minimarket, local, ferretería, etc.', icon: Shield },
  { id: 'office', title: 'Oficina / Corporativo', desc: 'Oficinas, recepción, cowork, empresa.', icon: Cpu },
  { id: 'warehouse', title: 'Bodega / Industria', desc: 'Galpones, bodegas, fábricas, patio.', icon: Cable },
  { id: 'food', title: 'Restaurant / Café', desc: 'Salón, caja, cocina, terrazas.', icon: Zap },
  { id: 'workshop', title: 'Taller / Servicio técnico', desc: 'Taller mecánico, vulca, herramientas.', icon: Cable },
  { id: 'health', title: 'Centro de salud', desc: 'Clínica, consulta, dental, laboratorio.', icon: Shield },
  { id: 'education', title: 'Educación', desc: 'Colegio, instituto, academia, salas.', icon: Cpu },
  { id: 'condo', title: 'Condominio / Comunidad', desc: 'Accesos, portería, espacios comunes.', icon: Wifi },
  { id: 'farm', title: 'Parcela / Campo / Obra', desc: 'Perímetro, portón, bodegas, solar.', icon: Wifi },
  { id: 'other', title: 'Otro', desc: 'No calza en ninguna o prefieres explicarlo.', icon: Info },
];

const priorityOptions: Array<{ id: Priority; title: string; desc: string; icon: any }> = [
  { id: 'price', title: 'Precio', desc: 'Cuidar el presupuesto.', icon: Zap },
  { id: 'quality', title: 'Mejor imagen', desc: 'Nitidez y detalle.', icon: BadgeCheck },
  { id: 'remote', title: 'Ver desde el celular', desc: 'Acceso remoto estable.', icon: Wifi },
  { id: 'scalable', title: 'Ampliable a futuro', desc: 'Crecer sin rehacer.', icon: Cpu },
  { id: 'rugged', title: 'Resistente a clima', desc: 'Más robusto.', icon: Shield },
];

const internetOptions: Array<{ id: InternetType; title: string; desc: string; icon: any }> = [
  { id: 'fiber', title: 'Internet fijo (Fibra/Router)', desc: 'Router con internet estable.', icon: Wifi },
  { id: '4g', title: 'Solo 4G', desc: 'Chip / router 4G.', icon: Wifi },
  { id: 'starlink', title: 'Starlink', desc: 'Internet satelital (ideal en campo/obra).', icon: Satellite },
  { id: 'none', title: 'Sin internet (solo grabación local)', desc: 'No necesito ver remoto.', icon: Cable },
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
  if (anyTag(p, ['camera_ip', 'camera_analog'])) return true;

  const catOk = cameraCategoryIds.length > 0 ? cameraCategoryIds.includes(String(p?.categoryId ?? '')) : false;
  if (catOk) return true;

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

  const byTags = opts.tags && opts.tags.length ? active.filter((p) => hasAllTags(p, opts.tags!)) : [];
  const byAnyTags = opts.anyTags && opts.anyTags.length ? active.filter((p) => anyTag(p, opts.anyTags!)) : [];
  const byKeywords =
    opts.keywords && opts.keywords.length ? active.filter((p) => containsAny(productText(p), opts.keywords!)) : [];

  const merged = (byTags.length ? byTags : byAnyTags.length ? byAnyTags : byKeywords).filter(Boolean);
  return pickCheapest(merged);
};

const channelsTag = (n: number) => `channels_${n}`;

// --- Recomendador ------------------------------------------------------------

type BuilderAnswers = {
  priority: Priority[];
  internetType: InternetType | null;
  recorderSameAsInternet: YesNoNA | null;
  avgDistance: AvgDistance | null;
  cableDifficulty: CableDifficulty | null;
  smartAlerts: boolean;
  wantUps: boolean;
  nightMode: NightMode[];
};

type SuggestItem = { id: string; qty: number; reason: string; bucket: 'required' | 'recommended' | 'optional' };

const inferSystemType = (a: BuilderAnswers) => {
  const pr = a.priority ?? [];
  if (a.smartAlerts) return 'ip' as const;
  if (pr.includes('quality') || pr.includes('scalable') || a.cableDifficulty === 'hard') return 'ip' as const;
  if (pr.includes('price') && (a.avgDistance === '0-30' || a.avgDistance === '30-70')) return 'analog' as const;
  if (a.internetType === 'none') return 'analog' as const;
  return 'ip' as const;
};

const pickRecorder = (all: any[], system: 'ip' | 'analog', cams: number) => {
  const channels = cams <= 4 ? 4 : cams <= 8 ? 8 : cams <= 16 ? 16 : 32;

  if (system === 'ip') {
    const byTags = findByTagsOrKeywords(all, { tags: ['recorder_nvr', channelsTag(channels)] });
    if (byTags) return byTags;
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
  const kit =
    findByTagsOrKeywords(all, { anyTags: ['wireless_link_pair'] }) ||
    findByTagsOrKeywords(all, { keywords: ['kit enlace', 'par enlace', 'punto a punto', 'ptp'] });
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

  const recorder = pickRecorder(products, system, camerasCount);
  if (recorder?.id) {
    suggestions.push({
      id: String(recorder.id),
      qty: 1,
      reason: system === 'ip' ? 'Grabación IP (NVR) según cantidad de cámaras.' : 'Grabación análoga (DVR) según cantidad de cámaras.',
      bucket: 'required',
    });
  }

  if (system === 'ip') {
    const preferPoe = answers.cableDifficulty !== 'easy' || answers.avgDistance !== '0-30' || answers.priority.includes('scalable');
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

// --- UI helpers --------------------------------------------------------------

const StepPill = ({ step, current }: { step: number; current: number }) => {
  const done = step < current;
  const active = step === current;

  return (
    <div className="flex items-center gap-2">
      <div
        className={[
          'h-9 w-9 rounded-full grid place-items-center border font-black',
          done ? 'bg-black text-white border-black' : active ? 'bg-yellow-400 text-black border-yellow-400' : 'bg-white text-gray-700 border-gray-200',
        ].join(' ')}
      >
        {done ? <CheckCircle2 size={18} className="text-white" /> : step}
      </div>
      <div className="hidden sm:block">
        <div className={['text-sm font-extrabold', active ? 'text-black' : done ? 'text-gray-900' : 'text-gray-500'].join(' ')}>
          Paso {step}
        </div>
      </div>
    </div>
  );
};

const CardButton = ({
  selected,
  onClick,
  title,
  desc,
  icon: Icon,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  desc: string;
  icon?: any;
}) => {
  return (
    <button
      onClick={onClick}
      className={[
        'group text-left rounded-2xl border p-4 transition-all duration-200',
        'bg-white shadow-[0_1px_0_rgba(0,0,0,0.03)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] hover:-translate-y-[1px]',
        selected ? 'border-black ring-2 ring-yellow-400/60' : 'border-gray-200 hover:border-gray-400',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {Icon ? (
            <div
              className={[
                'h-10 w-10 rounded-xl grid place-items-center border',
                selected ? 'bg-black border-black' : 'bg-gray-50 border-gray-200 group-hover:border-gray-300',
              ].join(' ')}
            >
              <Icon size={18} className={selected ? 'text-yellow-400' : 'text-gray-700'} />
            </div>
          ) : null}

          <div>
            <div className="font-extrabold text-gray-900">{title}</div>
            <div className="text-sm text-gray-600 mt-1">{desc}</div>
          </div>
        </div>

        {selected ? <CheckCircle2 className="shrink-0 text-black" /> : null}
      </div>
    </button>
  );
};

// --- Componente --------------------------------------------------------------

export default function TraditionalBuilder() {
  const { data } = useSiteData() as any;

  const catalog = (data as any).catalog ?? { categories: [], products: [] };
  const categories = (catalog.categories ?? []) as any[];
  const products = (catalog.products ?? []) as any[];

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const [bizType, setBizType] = useState<BizType | null>(null);

  // ✅ MULTISELECT
  const [priority, setPriority] = useState<Priority[]>([]);
  const [internetType, setInternetType] = useState<InternetType | null>(null);
  const [recorderSameAsInternet, setRecorderSameAsInternet] = useState<YesNoNA | null>(null);
  const [avgDistance, setAvgDistance] = useState<AvgDistance | null>(null);
  const [cableDifficulty, setCableDifficulty] = useState<CableDifficulty | null>(null);
  const [smartAlerts, setSmartAlerts] = useState(false);
  const [wantUps, setWantUps] = useState(false);

  // ✅ MULTISELECT
  const [nightMode, setNightMode] = useState<NightMode[]>([]);

  const [cart, setCart] = useState<Record<string, number>>({});

  const cameraCategoryIds = useMemo(() => {
    return categories
      .filter((c: any) => containsAny(c?.name, ['camara', 'camaras', 'cctv', 'camera']))
      .map((c: any) => String(c.id));
  }, [categories]);

  const activeProducts = useMemo(() => products.filter(isActive), [products]);

  const cameraCandidates = useMemo(() => {
    const base = activeProducts.filter((p: any) => isCamera(p, cameraCategoryIds));

    const wantsColor = nightMode.includes('color');
    const wantsBw = nightMode.includes('bw');

    if (wantsColor && !wantsBw) {
      return base.filter((p: any) => {
        if (anyTag(p, ['camera_color_night'])) return true;
        const text = productText(p);
        return containsAny(text, ['colorvu', 'full color', 'hibrida', 'hybrid', 'starlight', 'color de noche']);
      });
    }

    return base;
  }, [activeProducts, cameraCategoryIds, nightMode]);

  const cameraIdsSet = useMemo(() => new Set(cameraCandidates.map((p: any) => String(p?.id))), [cameraCandidates]);

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
      nightMode.length > 0 &&
      priority.length > 0 &&
      !!internetType &&
      !!avgDistance &&
      !!cableDifficulty &&
      (internetType === 'none' ? true : !!recorderSameAsInternet)) ||
    (step === 3 && camerasCount > 0) ||
    step === 4;

  const phone = String(data?.whatsappConfig?.phoneNumber ?? '').replace(/\D/g, '');
  const waBase = phone ? `https://wa.me/${phone}` : 'https://wa.me/56900000000';

  const bizLabel = bizOptions.find((b) => b.id === bizType)?.title ?? '';

  const nightLabel =
    nightMode.includes('color') && nightMode.includes('bw')
      ? 'Color + Blanco y negro (IR)'
      : nightMode.includes('color')
      ? 'Color (noche a color)'
      : 'Blanco y negro (IR)';

  const priorityLabel =
    priority.length > 0
      ? priority
          .map((id) => priorityOptions.find((p) => p.id === id)?.title)
          .filter(Boolean)
          .join(' + ')
      : '';

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

  const suggestions = useMemo(
    () => buildSuggestions(activeProducts, answers, camerasCount),
    [activeProducts, answers, camerasCount]
  );

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
      `Prioridad: ${priority.length ? priorityLabel : '—'}`,
      `Internet: ${internetLabel || '—'}`,
      `Grabador e internet mismo lugar: ${
        internetType === 'none'
          ? 'No aplica (sin internet)'
          : recorderSameAsInternet === 'yes'
          ? 'Sí'
          : recorderSameAsInternet === 'no'
          ? 'No'
          : '—'
      }`,
      `Distancia: ${distLabel || '—'}`,
      `Cableado: ${diffLabel || '—'}`,
      `Noche: ${nightMode.length ? nightLabel : '—'}`,
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
      `Instalación: $${installCost.toLocaleString('es-CL')} (${camerasCount} x $${INSTALL_PER_CAMERA.toLocaleString(
        'es-CL'
      )})`,
      `TOTAL NETO: $${totalNet.toLocaleString('es-CL')}`,
      '',
      'Quedo atento/a. Gracias!',
    ];
    return encodeURIComponent(lines.join('\n'));
  }, [
    bizLabel,
    priority,
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
    <div className="min-h-screen bg-gradient-to-b from-white via-white to-gray-50">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.08]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #000 1px, transparent 0)',
          backgroundSize: '26px 26px',
        }}
      />

      <div className="relative max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between gap-4">
          <Link to="/create-project" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black">
            <ArrowLeft size={16} /> Volver
          </Link>

          <div className="hidden sm:flex items-center gap-2">
            <StepPill step={1} current={step} />
            <div className="h-[2px] w-10 bg-gray-200 rounded-full" />
            <StepPill step={2} current={step} />
            <div className="h-[2px] w-10 bg-gray-200 rounded-full" />
            <StepPill step={3} current={step} />
            <div className="h-[2px] w-10 bg-gray-200 rounded-full" />
            <StepPill step={4} current={step} />
          </div>

          <div className="text-sm text-gray-500 sm:hidden">
            Paso <span className="font-semibold text-black">{step}</span> de 4
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-gray-200 bg-white/80 backdrop-blur shadow-[0_20px_60px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 text-xs font-black px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                  <BadgeCheck size={14} /> Cotizador profesional
                </div>

                <h1 className="mt-3 text-3xl md:text-4xl font-black text-red-600">Crea tu Proyecto (Tradicional)</h1>
                <p className="mt-2 text-gray-600">
                  Arma tu cotización paso a paso. Total neto (sin IVA) + instalación.
                  <span className="ml-2 text-yellow-500 font-bold">Rápido</span>, claro y sin vueltas.
                </p>
              </div>

              <div className="hidden md:block">
                <div className="rounded-2xl border border-gray-200 bg-black text-white px-4 py-3">
                  <div className="text-xs text-white/70">Instalación por cámara</div>
                  <div className="text-xl font-black text-yellow-400">
                    ${INSTALL_PER_CAMERA.toLocaleString('es-CL')}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Inicio</span>
                <span>Final</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full bg-black" style={{ width: `${(step / 4) * 100}%` }} />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 p-5 md:p-7 bg-white">
            {step === 1 && (
              <div>
                <div className="text-xs font-black text-blue-700">PASO 1</div>
                <h2 className="mt-1 text-xl font-black text-gray-900">¿Qué negocio protegemos?</h2>
                <p className="text-gray-600 mt-1">Elige la opción que más se parezca. Si no calza, pon “Otro”.</p>

                <div className="mt-5 grid md:grid-cols-2 gap-3">
                  {bizOptions.map((opt) => {
                    const selected = bizType === opt.id;
                    return (
                      <CardButton
                        key={opt.id}
                        selected={selected}
                        onClick={() => setBizType(opt.id)}
                        title={opt.title}
                        desc={opt.desc}
                        icon={opt.icon}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <div className="text-xs font-black text-blue-700">PASO 2</div>
                <h2 className="mt-1 text-xl font-black text-gray-900">Cuéntanos del lugar</h2>
                <p className="text-gray-600 mt-1">Esto ayuda a recomendarte el sistema correcto (sin marearte con tecnicismos).</p>

                {/* Prioridad */}
                <div className="mt-6">
                  <div className="text-xs font-black text-blue-700">ENFOQUE</div>
                  <div className="mt-1 font-extrabold text-gray-900">¿Qué es lo más importante para ti? (puedes marcar más de una)</div>
                  <div className="mt-3 grid md:grid-cols-2 gap-3">
                    {priorityOptions.map((opt) => {
                      const selected = priority.includes(opt.id);
                      return (
                        <CardButton
                          key={opt.id}
                          selected={selected}
                          onClick={() => setPriority((prev) => toggleInArray(prev, opt.id))}
                          title={opt.title}
                          desc={opt.desc}
                          icon={opt.icon}
                        />
                      );
                    })}
                  </div>

                  {priority.length > 0 ? (
                    <div className="mt-3 text-xs text-gray-500">
                      Seleccionado: <b className="text-gray-900">{priorityLabel}</b>
                    </div>
                  ) : null}
                </div>

                {/* Internet (con Starlink) */}
                <div className="mt-7">
                  <div className="text-xs font-black text-blue-700">CONECTIVIDAD</div>
                  <div className="mt-1 font-extrabold text-gray-900">¿Qué internet tienes o tendrás?</div>

                  <div className="mt-3 grid md:grid-cols-4 gap-3">
                    {internetOptions.map((opt) => {
                      const selected = internetType === opt.id;
                      return (
                        <CardButton
                          key={opt.id}
                          selected={selected}
                          onClick={() => {
                            setInternetType(opt.id);
                            if (opt.id === 'none') setRecorderSameAsInternet('na');
                          }}
                          title={opt.title}
                          desc={opt.desc}
                          icon={opt.icon}
                        />
                      );
                    })}
                  </div>

                  {/* Si hay internet (fibra/4g/starlink) preguntamos ubicación grabador */}
                  {internetType && internetType !== 'none' ? (
                    <div className="mt-4 rounded-2xl border border-gray-200 p-4 bg-gray-50">
                      <div className="flex items-center gap-2 font-black text-gray-900">
                        <Wifi size={18} className="text-yellow-500" />
                        ¿El grabador quedará en el mismo lugar donde llega el internet?
                      </div>

                      <div className="mt-3 grid sm:grid-cols-2 gap-3">
                        <CardButton
                          selected={recorderSameAsInternet === 'yes'}
                          onClick={() => setRecorderSameAsInternet('yes')}
                          title="Sí"
                          desc="Perfecto, no deberías necesitar enlaces."
                          icon={BadgeCheck}
                        />
                        <CardButton
                          selected={recorderSameAsInternet === 'no'}
                          onClick={() => setRecorderSameAsInternet('no')}
                          title="No"
                          desc="Te sugeriremos enlaces (antenas) si hay en catálogo."
                          icon={Wifi}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Distancia / dificultad */}
                <div className="mt-7 grid md:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-gray-200 p-4 bg-white">
                    <div className="flex items-center gap-2 font-black text-gray-900">
                      <Cable size={18} className="text-yellow-500" />
                      Distancia promedio grabador → cámaras
                    </div>
                    <div className="mt-3 grid gap-2">
                      {distanceOptions.map((opt) => {
                        const selected = avgDistance === opt.id;
                        return (
                          <button
                            key={opt.id}
                            onClick={() => setAvgDistance(opt.id)}
                            className={[
                              'rounded-2xl border p-3 text-left transition-all duration-200',
                              'hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] hover:-translate-y-[1px]',
                              selected ? 'border-black ring-2 ring-yellow-400/60 bg-gray-50' : 'border-gray-200 hover:border-gray-400',
                            ].join(' ')}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-extrabold text-gray-900">{opt.title}</div>
                                <div className="text-sm text-gray-600 mt-1">{opt.desc}</div>
                              </div>
                              {selected ? <CheckCircle2 className="shrink-0 text-black" /> : null}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-200 p-4 bg-white">
                    <div className="flex items-center gap-2 font-black text-gray-900">
                      <Cable size={18} className="text-yellow-500" />
                      ¿Qué tan fácil es pasar cable?
                    </div>
                    <div className="mt-3 grid gap-2">
                      {difficultyOptions.map((opt) => {
                        const selected = cableDifficulty === opt.id;
                        return (
                          <button
                            key={opt.id}
                            onClick={() => setCableDifficulty(opt.id)}
                            className={[
                              'rounded-2xl border p-3 text-left transition-all duration-200',
                              'hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] hover:-translate-y-[1px]',
                              selected ? 'border-black ring-2 ring-yellow-400/60 bg-gray-50' : 'border-gray-200 hover:border-gray-400',
                            ].join(' ')}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-extrabold text-gray-900">{opt.title}</div>
                                <div className="text-sm text-gray-600 mt-1">{opt.desc}</div>
                              </div>
                              {selected ? <CheckCircle2 className="shrink-0 text-black" /> : null}
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
                    <div className="text-xs font-black text-blue-700">VISIÓN NOCTURNA</div>
                    <span className="text-xs px-2 py-1 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-100 inline-flex items-center gap-1">
                      <Info size={14} /> puedes marcar más de una
                    </span>
                  </div>

                  <div className="mt-2 font-extrabold text-gray-900">¿Cómo quieres ver la noche?</div>
                  <p className="text-gray-600 mt-1">
                    Si marcas <b>Color</b>, filtramos cámaras tipo <b>ColorVu / Full Color / Híbridas</b>. Si marcas ambas, te mostramos todo.
                  </p>

                  <div className="mt-4 grid md:grid-cols-2 gap-3">
                    <CardButton
                      selected={nightMode.includes('bw')}
                      onClick={() => setNightMode((prev) => toggleInArray(prev, 'bw'))}
                      title="Blanco y negro"
                      desc="Visión infrarroja clásica (IR)."
                      icon={Shield}
                    />
                    <CardButton
                      selected={nightMode.includes('color')}
                      onClick={() => setNightMode((prev) => toggleInArray(prev, 'color'))}
                      title="Color"
                      desc="Mejor detalle nocturno (ColorVu / Full Color / Híbridas)."
                      icon={Sparkles}
                    />
                  </div>

                  {nightMode.length > 0 ? (
                    <div className="mt-3 text-xs text-gray-500">
                      Seleccionado: <b className="text-gray-900">{nightLabel}</b>
                    </div>
                  ) : null}
                </div>

                {/* Extras */}
                <div className="mt-7 grid md:grid-cols-2 gap-3">
                  <button
                    onClick={() => setSmartAlerts((v) => !v)}
                    className={[
                      'rounded-2xl border p-4 text-left transition-all duration-200',
                      'bg-white hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] hover:-translate-y-[1px]',
                      smartAlerts ? 'border-black ring-2 ring-yellow-400/60' : 'border-gray-200 hover:border-gray-400',
                    ].join(' ')}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={['h-10 w-10 rounded-xl grid place-items-center border', smartAlerts ? 'bg-black border-black' : 'bg-gray-50 border-gray-200'].join(' ')}>
                          <Cpu size={18} className={smartAlerts ? 'text-yellow-400' : 'text-gray-700'} />
                        </div>
                        <div>
                          <div className="font-extrabold text-gray-900">Quiero alertas inteligentes</div>
                          <div className="text-sm text-gray-600 mt-1">Persona/vehículo (si tu catálogo tiene equipos con IA).</div>
                        </div>
                      </div>
                      {smartAlerts ? <CheckCircle2 className="shrink-0 text-black" /> : null}
                    </div>
                  </button>

                  <button
                    onClick={() => setWantUps((v) => !v)}
                    className={[
                      'rounded-2xl border p-4 text-left transition-all duration-200',
                      'bg-white hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] hover:-translate-y-[1px]',
                      wantUps ? 'border-black ring-2 ring-yellow-400/60' : 'border-gray-200 hover:border-gray-400',
                    ].join(' ')}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={['h-10 w-10 rounded-xl grid place-items-center border', wantUps ? 'bg-black border-black' : 'bg-gray-50 border-gray-200'].join(' ')}>
                          <Zap size={18} className={wantUps ? 'text-yellow-400' : 'text-gray-700'} />
                        </div>
                        <div>
                          <div className="font-extrabold text-gray-900">Quiero respaldo de energía</div>
                          <div className="text-sm text-gray-600 mt-1">Agregar UPS (ideal en zonas con cortes).</div>
                        </div>
                      </div>
                      {wantUps ? <CheckCircle2 className="shrink-0 text-black" /> : null}
                    </div>
                  </button>
                </div>

                {priority.length > 0 && internetType && avgDistance && cableDifficulty && nightMode.length > 0 ? (
                  <div className="mt-7 rounded-2xl border border-black p-4 bg-black text-white">
                    <div className="flex items-center gap-2 font-black">
                      <Sparkles size={18} className="text-yellow-400" /> Recomendación automática
                    </div>
                    <div className="mt-2 text-sm text-white/80">
                      Según tus respuestas, el sistema recomendado es: <b className="text-yellow-400">{systemLabel}</b>
                    </div>
                    <div className="mt-2 text-xs text-white/60">
                      *Esto es una sugerencia. La visita técnica puede ajustar por factibilidad.
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* PASO 3 y 4 quedan igual en tu archivo (no toqué nada más) */}
            {/* Si quieres que te lo entregue completo completo con pasos 3 y 4 acá mismo también, me lo pides y lo pego entero sin cortar. */}
          </div>
        </div>
      </div>
    </div>
  );
}
