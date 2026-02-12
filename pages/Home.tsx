import React from 'react';
import { useSiteData, useAdmin } from '../App';
import { ArrowRight, Shield, Zap, Star, Bell, Cpu, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

const IconMap = {
  Shield,
  Zap,
  Star,
  Bell,
  Cpu,
  Globe,
};

const sizeMap: Record<string, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
  '4xl': 'text-4xl',
  '5xl': 'text-5xl',
  '6xl': 'text-6xl',
  '7xl': 'text-7xl',
  '8xl': 'text-8xl',
  '9xl': 'text-9xl',
};

const weightMap: Record<string, string> = {
  thin: 'font-thin',
  light: 'font-light',
  regular: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
  black: 'font-black',
};

const Home = () => {
  const { data } = useSiteData();
  const { isAdmin } = useAdmin(); // por si quieres mostrar badges/admin helpers más adelante

  // ✅ Compat: leemos data como any para soportar esquemas viejo + nuevo
  const d: any = data;

  // ========= Datos HERO (prioridad: nuevo -> viejo -> fallback) =========
  const heroTitle: string =
    d?.pages?.home?.title ??
    d?.home?.heroTitle ??
    'Mi Pyme Segura';

  const heroSubtitle: string =
    d?.pages?.home?.subtitle ??
    d?.home?.heroSubtitle ??
    'Cámaras, alarmas, control de acceso y proyectos de seguridad a medida.';

  // ✅ Importante: PRIORIDAD para bg “real” (cloud) que guardas desde AdminDashboard
  const heroBgImageUrl: string =
    d?.home?.heroBgImageUrl ?? // NUEVO (cloud)
    d?.media?.assets?.homeHero ?? // alternativo (nuevo esquema)
    d?.home?.featuredImage ?? // viejo
    '/images/home/hero.jpg';

  // ========= Styles (opcional desde site_data.json) =========
  const heroStyles = d?.styles?.home?.hero || {};
  const titleSize = heroStyles.titleSize || '7xl';
  const subtitleSize = heroStyles.subtitleSize || '2xl';
  const titleWeight = heroStyles.titleWeight || 'black';
  const subtitleWeight = heroStyles.subtitleWeight || 'medium';

  const heroAlign =
    heroStyles.align === 'center'
      ? 'text-center items-center'
      : heroStyles.align === 'right'
      ? 'text-right items-end'
      : 'text-left items-start';

  const overlayOpacity =
    typeof heroStyles.overlayOpacity === 'number'
      ? heroStyles.overlayOpacity
      : 0.6;

  const titleColor = heroStyles.titleColor || '#FFFFFF';
  const subtitleColor = heroStyles.subtitleColor || '#E5E7EB';

  // ✅ Clases base (con look del código 1 + control de tamaños del código 2)
  const heroTitleClass =
    `${sizeMap[titleSize] || 'text-7xl'} ` +
    `${weightMap[titleWeight] || 'font-black'} ` +
    `leading-tight tracking-tighter uppercase max-w-3xl drop-shadow-2xl`;

  const heroSubtitleClass =
    `${sizeMap[subtitleSize] || 'text-2xl'} ` +
    `${weightMap[subtitleWeight] || 'font-medium'} ` +
    `text-gray-200 max-w-2xl border-l-8 border-yellow-400 pl-8 leading-tight drop-shadow-2xl`;

  // ========= Highlight del código 1 =========
  const highlightText = (text: string) => {
    const keywords = ['Protegemos tu inversión', 'tecnología de vanguardia', 'sistemas autónomos'];
    return text
      .split(new RegExp(`(${keywords.join('|')})`, 'gi'))
      .map((part, i) =>
        keywords.some((k) => k.toLowerCase() === String(part).toLowerCase()) ? (
          <span
            key={i}
            className="text-yellow-400 font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
          >
            {part}
          </span>
        ) : (
          part
        )
      );
  };

  // ========= Features + Process (código 1) =========
  const features = (d?.home?.features || []) as any[];
  const processTitle = d?.home?.processTitle || 'Nuestro proceso';
  const processSubtitle = d?.home?.processSubtitle || 'Instalación clara, rápida y profesional';
  const processSteps = (d?.home?.processSteps || []) as any[];

  return (
    <div className="space-y-0 pb-0">
      {/* HERO */}
      <section className="relative h-[80vh] flex items-center overflow-hidden bg-gray-900">
        <div className="absolute inset-0 z-0">
          <img
            src={heroBgImageUrl}
            alt="Hero"
            className="w-full h-full object-cover"
            style={{ opacity: overlayOpacity }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white w-full">
          <div
            className={`max-w-4xl space-y-8 animate-in fade-in slide-in-from-left-8 duration-700 flex flex-col ${heroAlign}`}
          >
            {/* Badge estilo código 1 */}
            <div className="inline-flex items-center gap-3 bg-black/40 backdrop-blur-md border-2 border-yellow-400/30 px-6 py-2 rounded-full font-black text-[10px] md:text-xs uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(250,204,21,0.2)]">
              <Shield size={16} className="text-brand" />
              <span>
                SISTEMA DE PROTECCIÓN <span className="text-yellow-400">PROFESIONAL</span>
              </span>
            </div>

            {/* Título: si no hay estilos especiales, aplicamos “palabra intercalada brand” como en código 1 */}
            {heroStyles?.disableWordBrand ? (
              <h1 className={heroTitleClass} style={{ color: titleColor }}>
                {heroTitle}
              </h1>
            ) : (
              <h1 className={heroTitleClass} style={{ color: titleColor }}>
                {String(heroTitle)
                  .split(' ')
                  .map((word, i) => (
                    <span key={i} className={i % 2 === 1 ? 'text-brand' : ''}>
                      {word}{' '}
                    </span>
                  ))}
              </h1>
            )}

            <p className={heroSubtitleClass} style={{ color: subtitleColor }}>
              {highlightText(heroSubtitle)}
            </p>

            <div className="flex flex-col sm:flex-row gap-6 pt-4">
              <Link
                to="/create-project"
                className="bg-brand hover:bg-white hover:text-brand text-white px-10 py-5 rounded-[2rem] font-black text-xl flex items-center justify-center gap-3 transition-all transform hover:scale-105 shadow-2xl"
              >
                DISEÑAR PROYECTO <ArrowRight size={24} />
              </Link>

              <Link
                to="/equipment"
                className="bg-white/10 backdrop-blur-xl hover:bg-white hover:text-black text-white px-10 py-5 rounded-[2rem] font-black text-xl border-2 border-white/20 transition-all text-center"
              >
                CATÁLOGO
              </Link>
            </div>

            {/* (opcional) mini indicador admin, sin edición en vivo */}
            {isAdmin && (
              <div className="text-[10px] font-black uppercase tracking-widest text-yellow-400/80">
                Admin: estilos/imagen se controlan desde el Gestor Central
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FEATURES (dinámicas del código 1) */}
      <section className="relative z-20 -mt-16 max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-8">
        {features.map((item, i) => {
          const Icon = IconMap[item.icon as keyof typeof IconMap] || Shield;
          const bgColors = ['bg-brand/5', 'bg-yellow-400/5', 'bg-blue-600/5'];
          const textColors = ['text-brand', 'text-yellow-400', 'text-blue-600'];

          return (
            <div
              key={item.id || i}
              className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-50 space-y-6 hover:-translate-y-2 transition-all group"
            >
              <div className={`${bgColors[i % bgColors.length]} w-20 h-20 rounded-2xl flex items-center justify-center`}>
                <Icon className={textColors[i % textColors.length]} size={40} />
              </div>

              <div className="space-y-3">
                <h3 className="text-3xl font-black text-black tracking-tight uppercase leading-none">
                  {item.title}
                </h3>
                <p className="text-gray-500 font-semibold leading-snug">{item.desc}</p>
              </div>

              <Link
                to={item.linkUrl || '#'}
                className="pt-2 flex items-center gap-2 text-brand font-black text-xs uppercase tracking-widest"
              >
                {item.linkLabel || 'Saber más'} <ArrowRight size={12} />
              </Link>
            </div>
          );
        })}
      </section>

      {/* PROCESO (código 1 completo) */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-10">
            <div className="space-y-4">
              <span className="text-brand font-black uppercase tracking-widest text-sm">
                {processTitle}
              </span>
              <h2 className="text-5xl font-black text-black tracking-tighter leading-none uppercase">
                {processSubtitle}
              </h2>
            </div>

            <div className="space-y-6">
              {processSteps.map((step: any, i: number) => (
                <div key={step.id || i} className="flex gap-6 group">
                  <div className="bg-black text-white w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl shrink-0 group-hover:bg-brand transition-colors">
                    {step.number}
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xl font-black text-black uppercase">{step.title}</h4>
                    <p className="text-gray-500 font-medium leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Imágenes de apoyo (igual que código 1) */}
          <div className="relative grid grid-cols-2 gap-4">
            <img
              src="https://images.unsplash.com/photo-1551703599-6b3e8379aa8b?auto=format&fit=crop&q=80&w=600"
              className="rounded-[2.5rem] shadow-xl mt-10"
              alt="Cam"
            />
            <img
              src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=600"
              className="rounded-[2.5rem] shadow-xl -mt-10"
              alt="Instalación"
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
