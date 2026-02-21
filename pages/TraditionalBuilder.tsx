import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, CheckCircle2, MessageCircle } from 'lucide-react';
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

export default function TraditionalBuilder() {
  const { data } = useSiteData() as any;

  // ✅ Tu catálogo real (según Equipment.tsx)
  const catalog = (data as any).catalog ?? { categories: [], products: [] };
  const categories = (catalog.categories ?? []) as any[];
  const products = (catalog.products ?? []) as any[];

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [bizType, setBizType] = useState<BizType | null>(null);
  const [nightMode, setNightMode] = useState<NightMode | null>(null);

  // carrito: { [productId]: qty }
  const [cart, setCart] = useState<Record<string, number>>({});

  // Detectar categorías “cámaras” por nombre (si existen)
  const cameraCategoryIds = useMemo(() => {
    return categories
      .filter((c: any) => containsAny(c?.name, ['camara', 'camaras', 'cctv', 'camera']))
      .map((c: any) => String(c.id));
  }, [categories]);

  const cameraCandidates = useMemo(() => {
    const active = products.filter((p: any) => p?.active !== false);

    // Heurística: cámaras por categoryId (si hay categorías tipo cámaras),
    // si no hay, fallback por name/features.
    const base = active.filter((p: any) => {
      const name = String(p?.name ?? '');
      const feats = Array.isArray(p?.features) ? p.features.join(' ') : '';
      const catOk =
        cameraCategoryIds.length > 0 ? cameraCategoryIds.includes(String(p?.categoryId ?? '')) : false;

      const keywordOk = containsAny(`${name} ${feats}`, [
        'camara',
        'camera',
        'cctv',
        'dome',
        'bullet',
        'ptz',
        'turret',
      ]);

      return catOk || keywordOk;
    });

    if (nightMode === 'color') {
      return base.filter((p: any) => {
        const text = [
          p?.name,
          p?.brand,
          p?.model,
          ...(Array.isArray(p?.features) ? p.features : []),
        ].join(' ');
        return containsAny(text, ['colorvu', 'full color', 'hibrida', 'hybrid', 'starlight', 'color de noche']);
      });
    }

    return base;
  }, [products, cameraCategoryIds, nightMode]);

  const cartItems = useMemo(() => {
    const byId = new Map(cameraCandidates.map((p: any) => [String(p?.id), p]));
    return Object.entries(cart)
      .map(([id, qty]) => {
        const p = byId.get(String(id));
        if (!p || qty <= 0) return null;
        return { p, qty };
      })
      .filter(Boolean) as Array<{ p: any; qty: number }>;
  }, [cart, cameraCandidates]);

  const camerasCount = useMemo(() => cartItems.reduce((acc, it) => acc + it.qty, 0), [cartItems]);

  const subtotalNet = useMemo(() => {
    return cartItems.reduce((acc, it) => acc + Number(it.p?.priceNet ?? 0) * it.qty, 0);
  }, [cartItems]);

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
    (step === 2 && !!nightMode) ||
    (step === 3 && camerasCount > 0) ||
    step === 4;

  // WhatsApp
  const phone = String(data?.whatsappConfig?.phoneNumber ?? '').replace(/\D/g, '');
  const waBase = phone ? `https://wa.me/${phone}` : 'https://wa.me/56900000000';

  const bizLabel = bizOptions.find((b) => b.id === bizType)?.title ?? '';
  const nightLabel = nightMode === 'color' ? 'Color (noche a color)' : 'Blanco y negro (IR)';

  const waMessage = useMemo(() => {
    const lines = [
      'Hola! Quiero cotizar un proyecto TRADICIONAL en Mi Pyme Segura.',
      '',
      `Negocio: ${bizLabel || '—'}`,
      `Noche: ${nightMode ? nightLabel : '—'}`,
      '',
      'Cámaras:',
      ...cartItems.map(
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
  }, [bizLabel, nightMode, nightLabel, cartItems, subtotalNet, installCost, camerasCount, totalNet]);

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
        <p className="mt-2 text-gray-600">
          Arma tu cotización paso a paso. Total neto (sin IVA) + instalación.
        </p>

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
              <h2 className="text-xl font-bold text-gray-900">¿Cómo quieres ver la noche?</h2>
              <p className="text-gray-600 mt-1">
                Si eliges <b>Color</b>, te mostraremos solo cámaras tipo <b>ColorVu / Full Color / Híbridas</b> (según
                features).
              </p>

              <div className="mt-5 grid md:grid-cols-2 gap-3">
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
                    Tip: revisa que tus cámaras tengan categoría “Cámaras” o que en <b>features</b> venga “cámara”, “PTZ”,
                    “bullet”, etc. Y para noche a color, tags como “ColorVu”, “Full Color” o “Híbrida”.
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
                            <div className="text-sm text-gray-600">
                              {[p?.brand, p?.model].filter(Boolean).join(' ')}
                            </div>
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
                <div className="text-sm text-gray-700">
                  <div><b>Negocio:</b> {bizLabel || '—'}</div>
                  <div className="mt-1"><b>Noche:</b> {nightMode ? nightLabel : '—'}</div>
                </div>

                <div className="mt-4">
                  <div className="font-bold text-gray-900">Cámaras</div>
                  {cartItems.length === 0 ? (
                    <div className="text-sm text-gray-600 mt-2">No seleccionaste cámaras.</div>
                  ) : (
                    <ul className="mt-2 space-y-2 text-sm text-gray-700">
                      {cartItems.map((it) => (
                        <li key={String(it.p?.id)} className="flex items-start justify-between gap-4">
                          <div>
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
