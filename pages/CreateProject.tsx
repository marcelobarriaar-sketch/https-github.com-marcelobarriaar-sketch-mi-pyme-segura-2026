import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  Check,
  ShoppingBag,
  Bot,
  User,
  Send,
  Sparkles,
  ArrowLeft,
  Zap,
  ShieldCheck,
  Download,
  Wrench,
  Settings2,
} from 'lucide-react';
import { useSiteData, useAdmin } from '../App';

type UIMessage = {
  role: 'user' | 'ai';
  text: string;
};

const ROBOT_NAME = 'MPS Guardian';
const ROBOT_URL =
  'https://raw.githubusercontent.com/marcelobarriaar-sketch/https-github.com-marcelobarriaar-sketch-mi-pyme-segura-2026/refs/heads/main/public/images/MASCOTA%20MPS.png';

const CreateProject = () => {
  const { data, updateData } = useSiteData();
  const { isAdmin } = useAdmin();

  const [mode, setMode] = useState<'selection' | 'ai' | 'finished'>('selection');
  const [currentProfile, setCurrentProfile] = useState<any>(null);

  const initialAIMessage = data.aiSettings.isBetaEnabled
    ? `¡Bienvenido a la experiencia Beta de Mi Pyme Segura! Soy ${ROBOT_NAME}, tu asistente avanzado en seguridad. Antes de proponerte equipos, te voy a hacer algunas preguntas cortitas para entender bien tu proyecto. Partamos simple: ¿qué tipo de lugar o negocio quieres proteger?`
    : `¡Hola! Soy ${ROBOT_NAME}, tu asistente experto en seguridad. Antes de recomendarte una solución, te haré unas preguntas breves para entender bien tu proyecto. Partamos por lo primero: ¿qué tipo de lugar o negocio quieres proteger?`;

  const [messages, setMessages] = useState<UIMessage[]>([
    { role: 'ai', text: initialAIMessage },
  ]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleHeaderEdit = (field: 'title' | 'subtitle', val: string) => {
    updateData({
      ...data,
      createProjectHeader: {
        ...data.createProjectHeader,
        [field]: val,
      },
    });
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const normalizeText = (text: string) =>
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const inferSiteTypeFromText = (text: string): string | null => {
    const t = normalizeText(text);

    if (t.includes('local comercial')) return 'local';
    if (t.includes('comercio')) return 'comercio';
    if (t.includes('tienda')) return 'retail';
    if (t.includes('oficina')) return 'oficina';
    if (t.includes('restaurant') || t.includes('restaurante')) return 'restaurant';
    if (t.includes('cafe')) return 'cafe';
    if (t.includes('taller')) return 'taller';
    if (t.includes('centro de salud') || t.includes('clinica') || t.includes('posta'))
      return 'centro_salud';
    if (t.includes('colegio') || t.includes('liceo') || t.includes('escuela'))
      return 'educacion';
    if (t.includes('condominio')) return 'condominio';
    if (t.includes('comunidad')) return 'comunidad';
    if (t.includes('campo')) return 'campo';
    if (t.includes('obra')) return 'obra';
    if (t.includes('casa')) return 'casa';
    if (t.includes('departamento')) return 'departamento';
    if (t.includes('parcela')) return 'parcela';
    if (t.includes('bodega')) return 'bodega';

    return null;
  };

  const inferCableDifficultyFromText = (text: string): string | null => {
    const t = normalizeText(text);

    if (
      t.includes('facil') ||
      t.includes('sencillo') ||
      t.includes('simple') ||
      t.includes('sin dificultad') ||
      t.includes('poco cableado')
    ) {
      return 'facil';
    }

    if (
      t.includes('regular') ||
      t.includes('normal') ||
      t.includes('intermedio') ||
      t.includes('media dificultad') ||
      t.includes('mas o menos')
    ) {
      return 'regular';
    }

    if (
      t.includes('dificil') ||
      t.includes('complejo') ||
      t.includes('complicado') ||
      t.includes('larga distancia') ||
      t.includes('hay que perforar') ||
      t.includes('mucho cableado') ||
      t.includes('cableado dificil')
    ) {
      return 'dificil';
    }

    return null;
  };

  const inferConnectivityFromText = (text: string): string | null => {
    const t = normalizeText(text);

    if (
      t.includes('starlink') ||
      t.includes('fibra') ||
      t.includes('fibra optica') ||
      t.includes('wifi') ||
      t.includes('internet hogar') ||
      t.includes('tengo internet') ||
      t.includes('router')
    ) {
      return 'fibra';
    }

    if (
      t.includes('internet movil') ||
      t.includes('chip') ||
      t.includes('4g') ||
      t.includes('5g') ||
      t.includes('modem') ||
      t.includes('bam')
    ) {
      return 'movil';
    }

    if (
      t.includes('sin internet') ||
      t.includes('no tengo internet') ||
      t.includes('no hay internet')
    ) {
      return 'sin_internet';
    }

    if (
      t.includes('no se') ||
      t.includes('no sé') ||
      t.includes('por definir')
    ) {
      return 'no_sabe';
    }

    return null;
  };

  const inferDistanceFromText = (text: string): number | null => {
    const t = normalizeText(text);
    const match = t.match(/(\d+)\s*metros?/);
    if (!match) return null;
    return Number(match[1]);
  };

  const applyLocalInferences = (baseProfile: any, userText: string) => {
    const inferredSiteType = inferSiteTypeFromText(userText);
    const inferredCableDifficulty = inferCableDifficultyFromText(userText);
    const inferredConnectivity = inferConnectivityFromText(userText);
    const inferredDistance = inferDistanceFromText(userText);

    const nextProfile = {
      ...(baseProfile || {}),
      site: {
        ...(baseProfile?.site || {}),
      },
      constraints: {
        ...(baseProfile?.constraints || {}),
      },
      risk: {
        ...(baseProfile?.risk || {}),
      },
    };

    if (inferredSiteType && !nextProfile.site?.type) {
      nextProfile.site.type = inferredSiteType;
    }

    if (inferredDistance !== null) {
      nextProfile.distanceMeters = inferredDistance;
    }

    if (inferredCableDifficulty) {
      nextProfile.constraints.cableDifficulty = inferredCableDifficulty;
    }

    if (inferredConnectivity) {
      nextProfile.constraints.internet = inferredConnectivity;
    }

    return nextProfile;
  };

  const extractSummaryFromProfile = (profile: any) => {
    const siteTypeRaw = profile?.site?.type;
    const distanceRaw = profile?.distanceMeters || profile?.site?.distanceMeters || null;
    const cableRaw =
      profile?.constraints?.cableDifficulty ||
      profile?.site?.cableDifficulty ||
      profile?.cableDifficulty ||
      null;
    const internetRaw = profile?.constraints?.internet || null;

    const siteTypeMap: Record<string, string> = {
      comercio: 'Comercio',
      retail: 'Retail',
      oficina: 'Oficina',
      restaurant: 'Restaurant',
      cafe: 'Café',
      taller: 'Taller',
      centro_salud: 'Centro de salud',
      educacion: 'Educación',
      condominio: 'Condominio',
      comunidad: 'Comunidad',
      campo: 'Campo',
      obra: 'Obra',
      casa: 'Casa',
      departamento: 'Departamento',
      parcela: 'Parcela',
      local: 'Local comercial',
      bodega: 'Bodega',
      otro: 'Otro',
    };

    const difficultyMap: Record<string, string> = {
      facil: 'Fácil',
      regular: 'Regular',
      dificil: 'Difícil',
    };

    const connectivityMap: Record<string, string> = {
      fibra: 'Internet disponible',
      movil: 'Internet móvil',
      sin_internet: 'Sin internet',
      no_sabe: 'Por definir',
    };

    const siteType = siteTypeMap[siteTypeRaw] || siteTypeRaw || '';
    const distance = distanceRaw ? `${distanceRaw} metros` : '';
    const cableDifficulty = difficultyMap[cableRaw] || cableRaw || '';
    const connectivity = connectivityMap[internetRaw] || internetRaw || '';

    const checklist = [
      {
        key: 'siteType',
        label: 'Tipo de lugar',
        value: siteType,
      },
      {
        key: 'distance',
        label: 'Distancia grabador - cámaras',
        value: distance,
      },
      {
        key: 'cableDifficulty',
        label: 'Dificultad de cableado',
        value: cableDifficulty,
      },
      {
        key: 'connectivity',
        label: 'Conectividad',
        value: connectivity,
      },
    ];

    const completedItems = checklist.filter(
      (item) => item.value && item.value.trim() !== ''
    ).length;

    const progress = Math.round((completedItems / checklist.length) * 100);

    return {
      siteType: siteType || 'Pendiente',
      distance: distance || 'Pendiente',
      cableDifficulty: cableDifficulty || 'Pendiente',
      connectivity: connectivity || 'Pendiente',
      progress,
      completedItems,
      totalItems: checklist.length,
      checklist,
    };
  };

  const summary = useMemo(
    () => extractSummaryFromProfile(currentProfile),
    [currentProfile]
  );

  const canFinish = (summary.progress ?? 0) >= 75;
  const showFinalRobot = canFinish || mode === 'finished';

  const sendMessage = async () => {
    if (!userInput.trim() || isTyping) return;

    const userMsg = userInput.trim();

    const newMessages: UIMessage[] = [...messages, { role: 'user', text: userMsg }];

    setMessages(newMessages);
    setUserInput('');
    setIsTyping(true);

    try {
      const guardianMessages = newMessages.map((msg) => ({
        role: msg.role === 'ai' ? ('assistant' as const) : ('user' as const),
        content: msg.text,
      }));

      const catalogPayload =
        (data as any)?.catalog && Array.isArray((data as any)?.catalog?.products)
          ? {
              categories: Array.isArray((data as any)?.catalog?.categories)
                ? (data as any).catalog.categories
                : [],
              products: (data as any).catalog.products,
            }
          : {
              categories: Array.isArray((data as any)?.categories)
                ? (data as any).categories
                : [],
              products: Array.isArray((data as any)?.products)
                ? (data as any).products
                : [],
            };

      if (!Array.isArray(catalogPayload.products) || catalogPayload.products.length === 0) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'ai',
            text: `⚠️ ${ROBOT_NAME} no encontró productos en el catálogo cargado del sitio. Revisa site_data.json o la estructura del catálogo.`,
          },
        ]);
        return;
      }

      const res = await fetch('/api/ai/guardian', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: guardianMessages,
          mode: 'pyme',
          catalog: catalogPayload,
          currentProfile: currentProfile ?? undefined,
        }),
      });

      const rawText = await res.text();

      let dataRes: any = null;
      try {
        dataRes = rawText ? JSON.parse(rawText) : null;
      } catch {
        dataRes = null;
      }

      if (!res.ok) {
        console.error('Error en /api/ai/guardian:', rawText);

        const backendMessage =
          dataRes?.details ||
          dataRes?.error ||
          rawText ||
          `Respuesta no OK del servidor (${res.status})`;

        setMessages((prev) => [
          ...prev,
          {
            role: 'ai',
            text: `⚠️ ${ROBOT_NAME} encontró un problema técnico:\n${backendMessage}`,
          },
        ]);
        return;
      }

      let mergedProfile = {
        ...(currentProfile || {}),
        ...((dataRes?.projectPatch || {}) as any),
        site: {
          ...(currentProfile?.site || {}),
          ...(dataRes?.projectPatch?.site || {}),
        },
        constraints: {
          ...(currentProfile?.constraints || {}),
          ...(dataRes?.projectPatch?.constraints || {}),
        },
        risk: {
          ...(currentProfile?.risk || {}),
          ...(dataRes?.projectPatch?.risk || {}),
        },
      };

      mergedProfile = applyLocalInferences(mergedProfile, userMsg);

      setCurrentProfile(mergedProfile);

      const aiText = dataRes?._warning
        ? `${ROBOT_NAME} respondió en modo de respaldo.\n\n${dataRes._warning}\n\n${dataRes?.assistantMessage || ''}`
        : dataRes?.assistantMessage ||
          dataRes?.reply ||
          `${ROBOT_NAME} no pudo generar una respuesta útil en este intento.`;

      setMessages((prev) => [...prev, { role: 'ai', text: aiText }]);
    } catch (error: any) {
      console.error('Error llamando a /api/ai/guardian:', error);

      const fallbackProfile = applyLocalInferences(currentProfile || {}, userMsg);
      setCurrentProfile(fallbackProfile);

      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: `Tuve un problema para responder como ${ROBOT_NAME}.\n\nDetalle: ${error?.message || 'Error desconocido'}`,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleDownloadPdf = () => {
    alert('Aquí luego conectaremos la descarga del proyecto en PDF.');
  };

  const handleRequestInstall = () => {
    window.location.href = '#/contact';
  };

  const handleAdjustParams = () => {
    setMode('ai');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 text-black">
      <div className="mb-12 space-y-4 text-center">
        {isAdmin ? (
          <div className="space-y-4">
            <input
              className="text-5xl font-black tracking-tighter w-full bg-white border-4 border-red-600 p-4 rounded-3xl outline-none text-center"
              value={data.createProjectHeader.title}
              onChange={(e) => handleHeaderEdit('title', e.target.value)}
            />
            <input
              className="text-xl font-bold text-blue-600 w-full bg-white border-2 border-gray-200 p-2 rounded-xl outline-none text-center"
              value={data.createProjectHeader.subtitle}
              onChange={(e) => handleHeaderEdit('subtitle', e.target.value)}
            />
          </div>
        ) : (
          <>
            <h1 className="text-6xl font-black tracking-tighter mb-2">
              {data.createProjectHeader.title}
            </h1>
            <p className="text-xl font-bold text-gray-500 border-b-4 border-yellow-400 inline-block px-4 pb-2">
              {data.createProjectHeader.subtitle}
            </p>

            <div className="pt-4 flex justify-center">
              <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl border-2 border-black bg-white shadow-lg">
                <ShieldCheck size={22} className="text-red-600" />
                <span className="text-sm md:text-base font-black uppercase tracking-wide">
                  Asistencia guiada por <span className="text-red-600">{ROBOT_NAME}</span>
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {mode === 'selection' && (
        <div className="grid md:grid-cols-2 gap-10 animate-in fade-in duration-500 pt-8">
          <Link
            to="/create-project/tradicional"
            className="group bg-white p-12 rounded-[4rem] border-4 border-black shadow-2xl hover:-translate-y-2 transition-all text-left space-y-8 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-2 h-full bg-red-600" />
            <div className="bg-red-50 w-20 h-20 rounded-3xl flex items-center justify-center text-red-600 group-hover:bg-red-600 group-hover:text-white transition-all">
              <ShoppingBag size={40} />
            </div>
            <div>
              <h3 className="text-3xl font-black text-black tracking-tight">
                TRADICIONAL
              </h3>
              <p className="text-gray-500 mt-2 font-bold leading-relaxed">
                Configura paso a paso de forma manual.
              </p>
            </div>
            <div className="flex items-center gap-2 text-red-600 font-black uppercase text-sm">
              SELECCIÓN MANUAL <ChevronRight size={18} />
            </div>
          </Link>

          <button
            onClick={() => setMode('ai')}
            className={`group p-12 rounded-[4rem] shadow-2xl transition-all text-left space-y-8 relative overflow-hidden hover:-translate-y-2 border-4 ${
              data.aiSettings.isBetaEnabled
                ? 'bg-black border-yellow-400'
                : 'bg-blue-600 border-black'
            }`}
          >
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Sparkles size={140} className="text-white" />
            </div>

            <div
              className={`w-20 h-20 rounded-3xl flex items-center justify-center text-white ${
                data.aiSettings.isBetaEnabled
                  ? 'bg-yellow-400 text-black'
                  : 'bg-black'
              }`}
            >
              {data.aiSettings.isBetaEnabled ? <Zap size={40} /> : <Bot size={40} />}
            </div>

            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-3xl font-black tracking-tight text-white">
                  ASESORÍA IA
                </h3>
                {data.aiSettings.isBetaEnabled && (
                  <span className="bg-yellow-400 text-black text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest">
                    BETA
                  </span>
                )}
              </div>
              <p
                className={`mt-2 font-bold leading-relaxed ${
                  data.aiSettings.isBetaEnabled ? 'text-gray-400' : 'text-blue-100'
                }`}
              >
                Conversa con {ROBOT_NAME}, el cerebro técnico de seguridad de Mi Pyme Segura.
              </p>
            </div>

            <div
              className={`flex items-center gap-2 font-black uppercase text-sm ${
                data.aiSettings.isBetaEnabled ? 'text-yellow-400' : 'text-white'
              }`}
            >
              CHATEAR AHORA <ChevronRight size={18} />
            </div>
          </button>
        </div>
      )}

      {mode === 'ai' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <button
            onClick={() => setMode('selection')}
            className={`mb-6 flex items-center gap-2 font-black uppercase text-xs transition-colors ${
              data.aiSettings.isBetaEnabled
                ? 'text-yellow-400 hover:text-white'
                : 'text-blue-600 hover:text-black'
            }`}
          >
            <ArrowLeft size={16} /> CAMBIAR MODO
          </button>

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
            <div
              className={`rounded-[3rem] shadow-2xl border-4 flex flex-col overflow-hidden min-h-[760px] ${
                data.aiSettings.isBetaEnabled
                  ? 'bg-black border-yellow-400'
                  : 'bg-white border-black'
              }`}
            >
              <div
                className={`px-8 py-6 border-b-4 flex items-center justify-between gap-6 ${
                  data.aiSettings.isBetaEnabled
                    ? 'border-white/10 bg-white/5'
                    : 'border-black bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-white border border-gray-200 shadow-xl shrink-0 flex items-center justify-center">
                    <img
                      src={ROBOT_URL}
                      alt={ROBOT_NAME}
                      className="w-full h-full object-cover object-top scale-[1.35]"
                    />
                  </div>

                  <div>
                    <p
                      className={`text-xs uppercase tracking-[0.22em] font-black ${
                        data.aiSettings.isBetaEnabled ? 'text-yellow-400' : 'text-red-600'
                      }`}
                    >
                      Asistente activo
                    </p>
                    <h3
                      className={`text-3xl font-black tracking-tight ${
                        data.aiSettings.isBetaEnabled ? 'text-white' : 'text-black'
                      }`}
                    >
                      {ROBOT_NAME}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
                      <span
                        className={`text-sm font-bold ${
                          data.aiSettings.isBetaEnabled ? 'text-green-300' : 'text-green-600'
                        }`}
                      >
                        Asesor técnico virtual · En línea
                      </span>
                    </div>
                  </div>
                </div>

                {showFinalRobot && (
                  <div className="hidden md:flex items-end justify-end">
                    <img
                      src={ROBOT_URL}
                      alt={`${ROBOT_NAME} completo`}
                      className="w-36 lg:w-44 object-contain drop-shadow-[0_20px_30px_rgba(181,26,0,0.25)]"
                    />
                  </div>
                )}
              </div>

              <div className="flex-1 p-8 overflow-y-auto space-y-8 scrollbar-thin scrollbar-thumb-gray-800 bg-gradient-to-b from-white to-gray-50">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`flex gap-4 max-w-[88%] ${
                        msg.role === 'user' ? 'flex-row-reverse' : ''
                      }`}
                    >
                      {msg.role === 'ai' ? (
                        <div className="w-14 h-14 rounded-full overflow-hidden bg-white border border-gray-200 shadow-lg shrink-0 flex items-center justify-center">
                          <img
                            src={ROBOT_URL}
                            alt={ROBOT_NAME}
                            className="w-full h-full object-cover object-top scale-[1.4]"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xl bg-red-600 text-white">
                          <User size={24} />
                        </div>
                      )}

                      <div
                        className={`p-6 rounded-[2rem] text-sm font-bold leading-relaxed whitespace-pre-wrap ${
                          msg.role === 'user'
                            ? 'bg-red-50 text-black border-2 border-red-100 rounded-tr-none'
                            : data.aiSettings.isBetaEnabled
                            ? 'bg-white/5 text-white border-2 border-white/10 rounded-tl-none'
                            : 'bg-white text-black border-2 border-slate-200 shadow-sm rounded-tl-none'
                        }`}
                      >
                        {msg.role === 'ai' && (
                          <div className="flex items-center gap-3 mb-3">
                            <span className="font-black text-lg">{ROBOT_NAME}</span>
                            <span className="text-xs uppercase tracking-widest text-gray-400 font-black">
                              Diagnóstico técnico
                            </span>
                          </div>
                        )}
                        {msg.text}
                      </div>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex gap-4 max-w-[85%] items-center">
                      <div className="w-14 h-14 rounded-full overflow-hidden bg-white border border-gray-200 shadow-lg shrink-0 flex items-center justify-center">
                        <img
                          src={ROBOT_URL}
                          alt={ROBOT_NAME}
                          className="w-full h-full object-cover object-top scale-[1.4]"
                        />
                      </div>

                      <div
                        className={`p-6 rounded-[2rem] font-black text-xs uppercase tracking-widest ${
                          data.aiSettings.isBetaEnabled
                            ? 'bg-white/5 text-yellow-400 border border-white/10'
                            : 'bg-white text-gray-500 border border-slate-200 shadow-sm'
                        }`}
                      >
                        {ROBOT_NAME} analizando proyecto...
                      </div>
                    </div>
                  </div>
                )}

                {showFinalRobot && (
                  <div
                    className={`rounded-[2rem] border-2 p-6 ${
                      data.aiSettings.isBetaEnabled
                        ? 'bg-white/5 border-white/10 text-white'
                        : 'bg-white border-slate-200 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-14 h-14 rounded-full overflow-hidden bg-white border border-gray-200 shadow-lg shrink-0 flex items-center justify-center">
                        <img
                          src={ROBOT_URL}
                          alt={ROBOT_NAME}
                          className="w-full h-full object-cover object-top scale-[1.4]"
                        />
                      </div>
                      <div>
                        <h4 className="text-xl font-black">Propuesta preliminar de seguridad</h4>
                        <p className="text-sm font-bold text-gray-400">
                          {ROBOT_NAME} · Resultado técnico inicial
                        </p>
                      </div>
                    </div>

                    <div
                      className={`rounded-[1.5rem] border p-5 ${
                        data.aiSettings.isBetaEnabled
                          ? 'bg-white/5 border-yellow-400/20'
                          : 'bg-red-50 border-red-100'
                      }`}
                    >
                      <p className="font-bold leading-relaxed">
                        <span className="font-black">Importante:</span> Los valores mostrados
                        corresponden a una <span className="font-black">estimación técnica inicial</span>{' '}
                        basada en la información entregada.
                      </p>

                      <p className="font-bold leading-relaxed mt-3">
                        El valor final puede variar según:
                      </p>

                      <ul className="mt-3 grid md:grid-cols-2 gap-2 list-disc pl-5 font-bold">
                        <li>condiciones reales del lugar</li>
                        <li>dificultad de instalación</li>
                        <li>distancia efectiva del cableado</li>
                        <li>infraestructura existente</li>
                      </ul>
                    </div>

                    <div className="flex flex-wrap gap-3 mt-5">
                      <button
                        onClick={handleDownloadPdf}
                        className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 transition-all font-black"
                      >
                        <Download size={18} />
                        Descargar proyecto PDF
                      </button>

                      <button
                        onClick={handleRequestInstall}
                        className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 transition-all font-black"
                      >
                        <Wrench size={18} />
                        Solicitar instalación
                      </button>

                      <button
                        onClick={handleAdjustParams}
                        className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 transition-all font-black"
                      >
                        <Settings2 size={18} />
                        Ajustar parámetros
                      </button>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              <div
                className={`p-8 border-t-4 ${
                  data.aiSettings.isBetaEnabled
                    ? 'border-white/10 bg-white/5'
                    : 'border-black bg-gray-50'
                }`}
              >
                <form
                  className="relative"
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                >
                  <input
                    type="text"
                    className={`w-full border-4 rounded-[2rem] p-5 pr-24 outline-none transition-all font-bold ${
                      data.aiSettings.isBetaEnabled
                        ? 'bg-black border-yellow-400/30 text-white focus:border-yellow-400 placeholder-white/20'
                        : 'bg-white border-black text-black focus:border-blue-600 placeholder-gray-400'
                    }`}
                    placeholder={`Escribe tu consulta para ${ROBOT_NAME}...`}
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    disabled={isTyping}
                  />
                  <button
                    type="submit"
                    disabled={isTyping || !userInput.trim()}
                    className={`absolute right-3 top-3 p-3 rounded-2xl transition-all disabled:opacity-50 text-white shadow-xl ${
                      data.aiSettings.isBetaEnabled
                        ? 'bg-yellow-400 text-black hover:scale-105'
                        : 'bg-blue-600 hover:bg-black'
                    }`}
                  >
                    <Send size={28} />
                  </button>
                </form>

                <div className="flex justify-between items-center mt-6 gap-4">
                  <p
                    className={`text-[10px] uppercase font-black tracking-widest ${
                      data.aiSettings.isBetaEnabled ? 'text-yellow-400' : 'text-gray-400'
                    }`}
                  >
                    {data.aiSettings.isBetaEnabled
                      ? `${ROBOT_NAME} · Sistema Beta`
                      : `${ROBOT_NAME} · Core IA Mi Pyme Segura`}
                  </p>

                  <button
                    onClick={() => {
                      if (canFinish) setMode('finished');
                    }}
                    disabled={!canFinish}
                    className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                      canFinish
                        ? data.aiSettings.isBetaEnabled
                          ? 'bg-white/10 text-white hover:bg-yellow-400 hover:text-black'
                          : 'bg-black text-white hover:bg-red-600'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Finalizar
                  </button>
                </div>
              </div>
            </div>

            <aside className="xl:sticky xl:top-24">
              <div className="rounded-[3rem] border-4 border-black bg-white shadow-2xl p-6 space-y-6">
                <div>
                  <h3 className="text-4xl font-black tracking-tight">Estado del Proyecto</h3>
                </div>

                <div className="space-y-4">
                  {summary.checklist.map((item: any) => {
                    const isDone = !!item.value && item.value.trim() !== '';

                    return (
                      <div
                        key={item.key}
                        className={`rounded-[1.5rem] border p-4 transition-all ${
                          isDone
                            ? 'border-green-200 bg-green-50'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-widest font-black text-gray-400 mb-1">
                              {item.label}
                            </p>
                            <p
                              className={`text-2xl font-black ${
                                isDone ? 'text-green-700' : 'text-black'
                              }`}
                            >
                              {isDone ? item.value : 'Pendiente'}
                            </p>
                          </div>

                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-black text-lg ${
                              isDone
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            {isDone ? '✓' : '•'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-[2rem] bg-gray-50 border border-slate-200 p-5">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-black">Avance del diagnóstico</span>
                    <span className="font-black text-red-600">{summary.progress}%</span>
                  </div>

                  <div className="w-full h-4 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-red-700 to-red-500 transition-all duration-500"
                      style={{ width: `${summary.progress}%` }}
                    />
                  </div>

                  <p className="mt-3 text-sm font-bold text-gray-500">
                    {summary.completedItems} de {summary.totalItems} ítems listos
                  </p>
                </div>

                {showFinalRobot && (
                  <div className="rounded-[2rem] bg-gradient-to-b from-red-50 to-white border border-red-100 p-4 text-center">
                    <img
                      src={ROBOT_URL}
                      alt={`${ROBOT_NAME} cuerpo completo`}
                      className="w-40 mx-auto object-contain drop-shadow-[0_14px_24px_rgba(181,26,0,0.20)]"
                    />
                    <p className="mt-3 text-sm font-black text-red-600 uppercase tracking-widest">
                      Proyecto calculado
                    </p>
                    <p className="text-sm font-bold text-gray-500 mt-1">
                      Valores finales referenciales y sujetos a validación técnica.
                    </p>
                  </div>
                )}

                <button
                  onClick={() => {
                    if (canFinish) setMode('finished');
                  }}
                  disabled={!canFinish}
                  className={`w-full py-4 rounded-[1.5rem] font-black uppercase tracking-widest transition-all ${
                    canFinish
                      ? 'bg-gradient-to-r from-red-700 to-red-500 text-white hover:scale-[1.01]'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Finalizar
                </button>
              </div>
            </aside>
          </div>
        </div>
      )}

      {mode === 'finished' && (
        <div className="text-center space-y-10 animate-in zoom-in-95 duration-500 bg-white p-12 md:p-20 rounded-[4rem] shadow-2xl border-4 border-black">
          <div className="max-w-5xl mx-auto grid md:grid-cols-[1fr_340px] gap-10 items-center text-left">
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="bg-yellow-400 text-black w-24 h-24 rounded-[2rem] flex items-center justify-center shadow-2xl rotate-12">
                  <Check size={50} className="font-black" />
                </div>

                <div>
                  <h2 className="text-5xl font-black text-black tracking-tighter uppercase leading-none">
                    PROYECTO
                    <br />
                    <span className="text-red-600">CONSOLIDADO</span>
                  </h2>
                </div>
              </div>

              <p className="text-xl text-gray-500 font-bold leading-relaxed">
                {ROBOT_NAME} preparó una propuesta base según la información ingresada.
                Recuerda que los valores finales son <span className="text-red-600">aproximados</span>{' '}
                y pueden variar después de una validación técnica en terreno.
              </p>

              <div className="rounded-[2rem] border border-red-100 bg-red-50 p-6">
                <p className="font-black mb-3">Factores que pueden modificar el valor final:</p>
                <ul className="grid md:grid-cols-2 gap-2 list-disc pl-5 font-bold text-gray-700">
                  <li>distancia real de cableado</li>
                  <li>dificultad de instalación</li>
                  <li>condiciones del lugar</li>
                  <li>infraestructura existente</li>
                </ul>
              </div>

              <div className="flex flex-wrap gap-4">
                <button
                  onClick={handleDownloadPdf}
                  className="bg-black text-white px-8 py-4 rounded-[1.5rem] font-black hover:bg-red-600 transition-all inline-flex items-center gap-2"
                >
                  <Download size={20} />
                  Descargar PDF
                </button>

                <button
                  onClick={handleRequestInstall}
                  className="bg-gray-100 text-black px-8 py-4 rounded-[1.5rem] font-black hover:bg-gray-200 transition-all inline-flex items-center gap-2"
                >
                  <Wrench size={20} />
                  Solicitar instalación
                </button>

                <button
                  onClick={() => setMode('ai')}
                  className="bg-gray-100 text-black px-8 py-4 rounded-[1.5rem] font-black hover:bg-gray-200 transition-all inline-flex items-center gap-2"
                >
                  <Settings2 size={20} />
                  Ajustar proyecto
                </button>
              </div>
            </div>

            <div className="text-center">
              <img
                src={ROBOT_URL}
                alt={`${ROBOT_NAME} cuerpo completo`}
                className="w-72 mx-auto object-contain drop-shadow-[0_24px_36px_rgba(181,26,0,0.25)]"
              />
              <p className="mt-4 text-sm font-black uppercase tracking-widest text-red-600">
                {ROBOT_NAME}
              </p>
              <p className="text-sm font-bold text-gray-500 mt-1">
                Asesor técnico virtual de Mi Pyme Segura
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateProject;
