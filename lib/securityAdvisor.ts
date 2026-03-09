// lib/securityAdvisor.ts

export type RiskLevel = 'bajo' | 'medio' | 'alto';
export type SiteType = 'casa' | 'departamento' | 'parcela' | 'local' | 'bodega';
export type PerimeterLevel = 'bajo' | 'medio' | 'alto';
export type LightingLevel = 'buena' | 'media' | 'mala';
export type InternetType = 'fibra' | 'movil' | 'sin_internet' | 'no_sabe';
export type PowerType = 'normal' | 'cortes_frecuentes' | 'solar' | 'no_sabe';

export interface CatalogSubcategory {
  id: string;
  name: string;
}

export interface CatalogCategory {
  id: string;
  name: string;
  subcategories?: CatalogSubcategory[];
}

export interface CatalogProduct {
  id: string;
  name: string;
  brand?: string;
  model?: string;
  sku?: string;
  categoryId?: string;
  subcategoryId?: string;
  priceNet?: number;
  features?: string[];
  imageUrl?: string;
  datasheetUrl?: string;
  videoUrl?: string;
  active?: boolean;
}

export interface Catalog {
  categories?: CatalogCategory[];
  products: CatalogProduct[];
}

export interface SecurityProjectProfile {
  meta?: {
    createdAt?: string;
    version?: number;
    source?: 'MPS_GUARDIAN';
  };
  client?: {
    name?: string;
    commune?: string;
    contact?: {
      phone?: string;
      email?: string;
    };
  };
  site?: {
    type?: SiteType;
    floors?: number;
    perimeter?: PerimeterLevel;
    keyZones?: string[];
    lighting?: LightingLevel;
  };
  constraints?: {
    budgetMaxCLP?: number;
    internet?: InternetType;
    power?: PowerType;
    recordingDaysTarget?: number;
    preference?: {
      privacy?: boolean;
      visibleDeterrence?: boolean;
    };
  };
  risk?: {
    level?: RiskLevel;
    reasons?: string[];
  };
  solution?: {
    cameras?: SolutionItemWithPlacement[];
    nvrDvr?: SolutionItem[];
    storage?: SolutionItemWithNotes[];
    alarm?: SolutionItemWithNotes[];
    accessControl?: SolutionItemWithNotes[];
    network?: SolutionItemWithNotes[];
    power?: SolutionItemWithNotes[];
    extras?: SolutionItemWithNotes[];
  };
  pricing?: {
    currency: 'CLP';
    subtotalNet?: number;
    iva?: number;
    total?: number;
    notes?: string[];
  };
  openQuestions?: string[];
  assumptions?: string[];
  nextSteps?: string[];
}

export interface SolutionItem {
  productId: string;
  qty: number;
}

export interface SolutionItemWithNotes extends SolutionItem {
  notes?: string;
}

export interface SolutionItemWithPlacement extends SolutionItem {
  placementNotes?: string;
}

export interface CatalogSelection {
  productId: string;
  qty?: number;
  reason?: string;
}

export interface AdvisorResult {
  assistantMessage: string;
  projectPatch: SecurityProjectProfile;
  catalogSelections: CatalogSelection[];
  openQuestions: string[];
  assumptions: string[];
  nextSteps: string[];
}

interface InternalScoredProduct {
  product: CatalogProduct;
  score: number;
  reasons: string[];
}

function normalizeText(text?: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function toWords(text?: string): string[] {
  return normalizeText(text)
    .split(/[^a-z0-9]+/g)
    .filter(Boolean);
}

function productText(product: CatalogProduct): string {
  return [
    product.name,
    product.brand,
    product.model,
    product.categoryId,
    product.subcategoryId,
    ...(product.features || []),
  ]
    .filter(Boolean)
    .join(' ');
}

function hasAny(text: string, keywords: string[]): boolean {
  const normalized = normalizeText(text);
  return keywords.some((k) => normalized.includes(normalizeText(k)));
}

function isActive(product: CatalogProduct): boolean {
  return product.active ?? true;
}

function getActiveProducts(catalog: Catalog): CatalogProduct[] {
  return (catalog.products || []).filter(isActive);
}

function safePrice(value?: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function sumNet(items: Array<{ productId: string; qty: number }>, catalog: CatalogProduct[]): { subtotalNet: number; notes: string[] } {
  let subtotalNet = 0;
  const notes: string[] = [];

  for (const item of items) {
    const prod = catalog.find((p) => p.id === item.productId);
    if (!prod) {
      notes.push(`Producto no encontrado en catálogo: ${item.productId}`);
      continue;
    }

    if (typeof prod.priceNet !== 'number') {
      notes.push(`Producto sin precio neto: ${prod.name} (${item.productId})`);
      continue;
    }

    subtotalNet += prod.priceNet * item.qty;
  }

  return { subtotalNet, notes };
}

function estimateCameraCount(profile: SecurityProjectProfile): number {
  const zones = profile.site?.keyZones?.length ?? 0;
  const floors = Math.max(1, profile.site?.floors ?? 1);
  const type = profile.site?.type;
  const perimeter = profile.site?.perimeter;
  const risk = profile.risk?.level;

  let base = 2;

  if (type === 'departamento') base = 2;
  if (type === 'casa') base = 4;
  if (type === 'local') base = 4;
  if (type === 'bodega') base = 6;
  if (type === 'parcela') base = 6;

  base += Math.max(0, floors - 1);

  if (zones > 0) {
    base = Math.max(base, zones);
  }

  if (perimeter === 'medio') base += 1;
  if (perimeter === 'alto') base += 2;

  if (risk === 'alto') base += 1;

  return Math.max(2, Math.min(base, 16));
}

function estimateStorageDays(profile: SecurityProjectProfile): number {
  return profile.constraints?.recordingDaysTarget ?? 15;
}

function estimateNeedAlarm(profile: SecurityProjectProfile): boolean {
  const type = profile.site?.type;
  const risk = profile.risk?.level;
  const perimeter = profile.site?.perimeter;

  if (risk === 'alto') return true;
  if (type === 'local' || type === 'bodega') return true;
  if (type === 'parcela' && perimeter !== 'bajo') return true;

  return false;
}

function estimateNeedBackupPower(profile: SecurityProjectProfile): boolean {
  const power = profile.constraints?.power;
  const type = profile.site?.type;

  if (power === 'cortes_frecuentes' || power === 'solar') return true;
  if (type === 'bodega' || type === 'parcela') return true;

  return false;
}

function estimateNeedNetwork(profile: SecurityProjectProfile): boolean {
  const type = profile.site?.type;
  const internet = profile.constraints?.internet;

  if (type === 'parcela' || type === 'bodega') return true;
  if (internet === 'movil' || internet === 'sin_internet') return true;

  return false;
}

function scoreCameraProduct(product: CatalogProduct, profile: SecurityProjectProfile): InternalScoredProduct {
  const text = productText(product);
  const lighting = profile.site?.lighting;
  const visibleDeterrence = profile.constraints?.preference?.visibleDeterrence;
  const siteType = profile.site?.type;

  let score = 0;
  const reasons: string[] = [];

  if (product.categoryId === 'camaras') {
    score += 20;
    reasons.push('Está en categoría cámaras');
  }

  if (product.subcategoryId === 'ip') {
    score += 8;
    reasons.push('Es cámara IP');
  }

  if (product.subcategoryId === 'analogas') {
    score += 6;
    reasons.push('Es cámara análoga');
  }

  if (hasAny(text, ['colorvu', 'full color', 'color'])) {
    score += 8;
    reasons.push('Sirve mejor para visión nocturna a color');
  }

  if (lighting === 'mala' && hasAny(text, ['colorvu', 'f1.0', 'luz blanca', 'white light', 'luz 20'])) {
    score += 8;
    reasons.push('Ayuda en escenarios con poca luz');
  }

  if (visibleDeterrence && hasAny(text, ['bullet'])) {
    score += 6;
    reasons.push('Formato bullet disuasivo');
  }

  if (!visibleDeterrence && hasAny(text, ['domo'])) {
    score += 5;
    reasons.push('Formato domo más discreto');
  }

  if (siteType === 'local' || siteType === 'bodega') {
    if (hasAny(text, ['ip67', 'exterior', 'bullet'])) {
      score += 4;
      reasons.push('Más apta para zonas de acceso o exterior');
    }
  }

  if (typeof product.priceNet === 'number') {
    if (product.priceNet <= 50000) {
      score += 4;
      reasons.push('Buen costo de entrada');
    } else if (product.priceNet <= 90000) {
      score += 2;
      reasons.push('Precio razonable');
    }
  }

  return { product, score, reasons };
}

function scoreRecorderProduct(product: CatalogProduct): InternalScoredProduct {
  const text = productText(product);
  let score = 0;
  const reasons: string[] = [];

  if (product.categoryId === 'grabadores') {
    score += 20;
    reasons.push('Está en categoría grabadores');
  }

  if (product.subcategoryId === 'nvr') {
    score += 8;
    reasons.push('Es NVR');
  }

  if (product.subcategoryId === 'dvr') {
    score += 8;
    reasons.push('Es DVR');
  }

  if (hasAny(text, ['4ch', '4 canales'])) {
    score += 3;
    reasons.push('Útil para proyectos pequeños');
  }

  if (hasAny(text, ['8ch', '8 canales', '8 canales'])) {
    score += 4;
    reasons.push('Útil para proyectos medianos');
  }

  if (hasAny(text, ['16ch', '16 canales'])) {
    score += 5;
    reasons.push('Útil para proyectos más grandes');
  }

  return { product, score, reasons };
}

function scorePowerProduct(product: CatalogProduct): InternalScoredProduct {
  const text = productText(product);
  let score = 0;
  const reasons: string[] = [];

  if (product.categoryId === 'autonomia') {
    score += 20;
    reasons.push('Está en categoría autonomía');
  }

  if (product.subcategoryId === 'ups') {
    score += 8;
    reasons.push('Es UPS');
  }

  if (product.subcategoryId === 'renovables') {
    score += 8;
    reasons.push('Es solución renovable');
  }

  if (hasAny(text, ['solar', 'panel', 'bateria', 'lifepo4', 'ciclo profundo'])) {
    score += 5;
    reasons.push('Se relaciona con respaldo energético');
  }

  return { product, score, reasons };
}

function scoreNetworkProduct(product: CatalogProduct): InternalScoredProduct {
  const text = productText(product);
  let score = 0;
  const reasons: string[] = [];

  if (product.categoryId === 'conectividad') {
    score += 20;
    reasons.push('Está en categoría conectividad');
  }

  if (product.subcategoryId === 'inalambrica') {
    score += 8;
    reasons.push('Es conectividad inalámbrica');
  }

  if (product.subcategoryId === 'alambrica') {
    score += 6;
    reasons.push('Es conectividad alámbrica');
  }

  if (hasAny(text, ['ubiquiti', 'nanostation', 'antena', 'bridge', 'wifi'])) {
    score += 5;
    reasons.push('Sirve para enlaces o cobertura');
  }

  return { product, score, reasons };
}

function scoreAlarmProduct(product: CatalogProduct): InternalScoredProduct {
  const text = productText(product);
  let score = 0;
  const reasons: string[] = [];

  if (product.categoryId === 'alarmas') {
    score += 20;
    reasons.push('Está en categoría alarmas');
  }

  if (product.subcategoryId === 'kits') {
    score += 8;
    reasons.push('Es kit de alarma');
  }

  if (product.subcategoryId === 'accesorios') {
    score += 5;
    reasons.push('Es accesorio de alarma');
  }

  if (hasAny(text, ['sensor', 'sirena', 'panel', 'pir', 'magnético'])) {
    score += 4;
    reasons.push('Relacionado a sistema de alarma');
  }

  return { product, score, reasons };
}

function pickBest(
  products: CatalogProduct[],
  scorer: (product: CatalogProduct) => InternalScoredProduct,
  minScore = 1
): InternalScoredProduct | null {
  const scored = products.map(scorer).sort((a, b) => b.score - a.score);
  return scored[0] && scored[0].score >= minScore ? scored[0] : null;
}

function pickPlacementNotes(index: number, total: number, profile: SecurityProjectProfile): string {
  const zones = profile.site?.keyZones || [];

  if (zones[index]) {
    return `Cubrir zona prioritaria: ${zones[index]}`;
  }

  if (total <= 2) {
    return index === 0 ? 'Acceso principal' : 'Zona secundaria o acceso lateral';
  }

  if (total <= 4) {
    const defaults = [
      'Acceso principal',
      'Acceso secundario',
      'Perímetro o patio',
      'Interior estratégico',
    ];
    return defaults[index] || `Punto estratégico ${index + 1}`;
  }

  const defaults = [
    'Acceso principal',
    'Acceso secundario',
    'Perímetro frontal',
    'Perímetro lateral',
    'Perímetro posterior',
    'Zona interior crítica',
    'Bodega o patio',
    'Punto ciego a evaluar',
  ];

  return defaults[index] || `Punto estratégico ${index + 1}`;
}

function buildAssistantMessage(profile: SecurityProjectProfile, result: {
  cameraCount: number;
  hasRecorder: boolean;
  hasAlarm: boolean;
  hasPower: boolean;
  hasNetwork: boolean;
  budgetMaxCLP?: number;
}): string {
  const chunks: string[] = [];

  chunks.push('Te armé una propuesta base aterrizada según el tipo de lugar, nivel de riesgo y condiciones técnicas que aparecen hasta ahora.');

  const summaryParts: string[] = [];
  summaryParts.push(`${result.cameraCount} cámara${result.cameraCount === 1 ? '' : 's'}`);

  if (result.hasRecorder) summaryParts.push('grabación central');
  if (result.hasAlarm) summaryParts.push('alarma complementaria');
  if (result.hasPower) summaryParts.push('respaldo de energía');
  if (result.hasNetwork) summaryParts.push('apoyo de conectividad');

  chunks.push(`De momento, la solución apunta a: ${summaryParts.join(', ')}.`);

  if (typeof result.budgetMaxCLP === 'number') {
    chunks.push(`Además consideré como referencia un tope presupuestario cercano a $${result.budgetMaxCLP.toLocaleString('es-CL')} CLP netos, aunque eso hay que validarlo con instalación y terreno real.`);
  } else {
    chunks.push('Todavía faltaría confirmar presupuesto objetivo y condiciones del lugar para afinar mejor la propuesta.');
  }

  chunks.push('Esto lo tomaría como una base técnica inicial, no como una ingeniería cerrada todavía.');

  return chunks.join(' ');
}

export function evaluateRisk(profile: SecurityProjectProfile): { level: RiskLevel; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  const type = profile.site?.type;
  const perimeter = profile.site?.perimeter;
  const lighting = profile.site?.lighting;
  const internet = profile.constraints?.internet;
  const power = profile.constraints?.power;

  if (type === 'local') {
    score += 2;
    reasons.push('El lugar es un local comercial');
  }

  if (type === 'bodega') {
    score += 3;
    reasons.push('El lugar es una bodega');
  }

  if (type === 'parcela') {
    score += 3;
    reasons.push('El lugar es una parcela, normalmente con más exposición perimetral');
  }

  if (perimeter === 'medio') {
    score += 1;
    reasons.push('Tiene exposición perimetral media');
  }

  if (perimeter === 'alto') {
    score += 2;
    reasons.push('Tiene exposición perimetral alta');
  }

  if (lighting === 'mala') {
    score += 2;
    reasons.push('La iluminación es deficiente');
  }

  if (internet === 'sin_internet' || internet === 'movil') {
    score += 1;
    reasons.push('La conectividad puede ser limitada');
  }

  if (power === 'cortes_frecuentes' || power === 'solar') {
    score += 1;
    reasons.push('La energía requiere respaldo o evaluación especial');
  }

  if (score >= 6) {
    return { level: 'alto', reasons };
  }

  if (score >= 3) {
    return { level: 'medio', reasons };
  }

  return { level: 'bajo', reasons };
}

export function generateSecurityProject(
  profile: SecurityProjectProfile,
  catalog: Catalog,
  mode: 'residencial' | 'pyme' = 'residencial'
): AdvisorResult {
  const activeProducts = getActiveProducts(catalog);

  const derivedRisk = profile.risk?.level
    ? {
        level: profile.risk.level,
        reasons: profile.risk.reasons ?? [],
      }
    : evaluateRisk(profile);

  const cameraCount = estimateCameraCount({
    ...profile,
    risk: { ...profile.risk, level: derivedRisk.level, reasons: derivedRisk.reasons },
  });

  const storageDays = estimateStorageDays(profile);
  const needAlarm = estimateNeedAlarm({
    ...profile,
    risk: { ...profile.risk, level: derivedRisk.level, reasons: derivedRisk.reasons },
  });
  const needBackupPower = estimateNeedBackupPower(profile);
  const needNetwork = estimateNeedNetwork(profile);

  const bestCamera = pickBest(activeProducts, (product) => scoreCameraProduct(product, profile), 10);
  const bestRecorder = pickBest(activeProducts, scoreRecorderProduct, 8);
  const bestPower = needBackupPower ? pickBest(activeProducts, scorePowerProduct, 8) : null;
  const bestNetwork = needNetwork ? pickBest(activeProducts, scoreNetworkProduct, 8) : null;
  const bestAlarm = needAlarm ? pickBest(activeProducts, scoreAlarmProduct, 8) : null;

  const openQuestions: string[] = [];
  const assumptions: string[] = [];
  const nextSteps: string[] = [];

  if (!profile.site?.type) {
    openQuestions.push('¿El proyecto es para casa, departamento, parcela, local o bodega?');
  }

  if (!profile.site?.lighting) {
    openQuestions.push('¿Cómo anda la iluminación de noche en las zonas a cubrir: buena, media o mala?');
  }

  if (!profile.site?.perimeter) {
    openQuestions.push('¿La exposición perimetral del lugar es baja, media o alta?');
  }

  if (!profile.constraints?.internet) {
    openQuestions.push('¿Tienes internet fibra, internet móvil o derechamente no tienes internet en el lugar?');
  }

  if (!profile.constraints?.power) {
    openQuestions.push('¿La energía es estable o hay cortes frecuentes?');
  }

  if (!profile.constraints?.budgetMaxCLP) {
    openQuestions.push('¿Qué presupuesto aproximado quieres destinar al proyecto?');
  }

  if (!profile.site?.keyZones || profile.site.keyZones.length === 0) {
    openQuestions.push('¿Qué zonas exactas quieres cubrir: accesos, caja, patio, bodega, estacionamiento u otras?');
  }

  if (!bestCamera) {
    assumptions.push('No encontré en el catálogo una cámara suficientemente identificable para recomendar con confianza.');
  }

  if (!bestRecorder) {
    assumptions.push('No encontré en el catálogo un grabador claramente identificable para cerrar la solución de grabación.');
  }

  if (needAlarm && !bestAlarm) {
    assumptions.push('El perfil sugiere usar alarma, pero el catálogo aún no tiene un kit o accesorios claros para seleccionarlos con seguridad.');
  }

  if (needBackupPower && !bestPower) {
    assumptions.push('El perfil sugiere respaldo de energía, pero el catálogo no tiene todavía una opción clara de UPS o energía renovable.');
  }

  if (needNetwork && !bestNetwork) {
    assumptions.push('El perfil sugiere apoyo de conectividad, pero no encontré aún un equipo claro en catálogo para recomendarlo automáticamente.');
  }

  const solution: NonNullable<SecurityProjectProfile['solution']> = {};

  if (bestCamera) {
    solution.cameras = Array.from({ length: cameraCount }, (_, index) => ({
      productId: bestCamera.product.id,
      qty: 1,
      placementNotes: pickPlacementNotes(index, cameraCount, profile),
    }));
  }

  if (bestRecorder) {
    solution.nvrDvr = [
      {
        productId: bestRecorder.product.id,
        qty: 1,
      },
    ];
  }

  if (bestAlarm) {
    solution.alarm = [
      {
        productId: bestAlarm.product.id,
        qty: 1,
        notes: 'Propuesta base de alarma complementaria al sistema de cámaras.',
      },
    ];
  }

  if (bestPower) {
    solution.power = [
      {
        productId: bestPower.product.id,
        qty: 1,
        notes: 'Respaldo energético sugerido según condiciones del lugar.',
      },
    ];
  }

  if (bestNetwork) {
    solution.network = [
      {
        productId: bestNetwork.product.id,
        qty: 1,
        notes: 'Apoyo de conectividad sugerido según tipo de sitio e internet disponible.',
      },
    ];
  }

  if (storageDays > 0) {
    assumptions.push(`La retención objetivo se estimó en ${storageDays} días como base inicial.`);
  }

  if (mode === 'pyme') {
    assumptions.push('Se priorizó un enfoque de continuidad operativa y control de accesos típico de pyme.');
  } else {
    assumptions.push('Se priorizó un enfoque residencial con equilibrio entre cobertura, disuasión y costo.');
  }

  nextSteps.push('Validar en terreno puntos de instalación, altura y ángulos muertos.');
  nextSteps.push('Confirmar disponibilidad eléctrica, canalización y condiciones reales de internet.');
  nextSteps.push('Ajustar cotización final con instalación, materiales y puesta en marcha.');

  const flatPricingItems: Array<{ productId: string; qty: number }> = [
    ...(solution.cameras ?? []).map((item) => ({ productId: item.productId, qty: item.qty })),
    ...(solution.nvrDvr ?? []).map((item) => ({ productId: item.productId, qty: item.qty })),
    ...(solution.storage ?? []).map((item) => ({ productId: item.productId, qty: item.qty })),
    ...(solution.alarm ?? []).map((item) => ({ productId: item.productId, qty: item.qty })),
    ...(solution.accessControl ?? []).map((item) => ({ productId: item.productId, qty: item.qty })),
    ...(solution.network ?? []).map((item) => ({ productId: item.productId, qty: item.qty })),
    ...(solution.power ?? []).map((item) => ({ productId: item.productId, qty: item.qty })),
    ...(solution.extras ?? []).map((item) => ({ productId: item.productId, qty: item.qty })),
  ];

  const pricingResult = sumNet(flatPricingItems, activeProducts);
  const iva = Math.round(pricingResult.subtotalNet * 0.19);
  const total = pricingResult.subtotalNet + iva;

  const projectPatch: SecurityProjectProfile = {
    ...profile,
    meta: {
      ...profile.meta,
      source: 'MPS_GUARDIAN',
      version: (profile.meta?.version ?? 0) + 1,
      createdAt: profile.meta?.createdAt ?? new Date().toISOString(),
    },
    risk: {
      level: derivedRisk.level,
      reasons: derivedRisk.reasons,
    },
    solution,
    pricing: {
      currency: 'CLP',
      subtotalNet: pricingResult.subtotalNet,
      iva,
      total,
      notes: pricingResult.notes.length ? pricingResult.notes : undefined,
    },
    openQuestions,
    assumptions,
    nextSteps,
  };

  const catalogSelections: CatalogSelection[] = [
    ...(bestCamera
      ? [
          {
            productId: bestCamera.product.id,
            qty: cameraCount,
            reason: `Se prioriza como cámara base. ${bestCamera.reasons.slice(0, 2).join('. ')}`,
          },
        ]
      : []),
    ...(bestRecorder
      ? [
          {
            productId: bestRecorder.product.id,
            qty: 1,
            reason: `Se propone como grabador principal. ${bestRecorder.reasons.slice(0, 2).join('. ')}`,
          },
        ]
      : []),
    ...(bestAlarm
      ? [
          {
            productId: bestAlarm.product.id,
            qty: 1,
            reason: `Complementa la seguridad del proyecto. ${bestAlarm.reasons.slice(0, 2).join('. ')}`,
          },
        ]
      : []),
    ...(bestPower
      ? [
          {
            productId: bestPower.product.id,
            qty: 1,
            reason: `Aporta continuidad operativa. ${bestPower.reasons.slice(0, 2).join('. ')}`,
          },
        ]
      : []),
    ...(bestNetwork
      ? [
          {
            productId: bestNetwork.product.id,
            qty: 1,
            reason: `Ayuda a resolver conectividad o enlaces. ${bestNetwork.reasons.slice(0, 2).join('. ')}`,
          },
        ]
      : []),
  ];

  const assistantMessage = buildAssistantMessage(projectPatch, {
    cameraCount,
    hasRecorder: Boolean(bestRecorder),
    hasAlarm: Boolean(bestAlarm),
    hasPower: Boolean(bestPower),
    hasNetwork: Boolean(bestNetwork),
    budgetMaxCLP: profile.constraints?.budgetMaxCLP,
  });

  return {
    assistantMessage,
    projectPatch,
    catalogSelections,
    openQuestions,
    assumptions,
    nextSteps,
  };
}
