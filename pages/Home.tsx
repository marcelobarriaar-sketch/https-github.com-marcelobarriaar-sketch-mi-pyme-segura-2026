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
  const { isAdmin } = useAdmin();
  const d: any = data;

  // ================= HERO DATA =================
  const heroTitle: string =
    d?.pages?.home?.title ??
    d?.home?.heroTitle ??
    'SEGURIDAD INTELIGENTE PARA TU NEGOCIO';

  const heroSubtitle: string =
    d?.pages?.home?.subtitle ??
    d?.home?.heroSubtitle ??
    'Protegemos tu inversión con tecnología de vanguardia y sistemas autónomos diseñados para la realidad de hoy.';

  const heroBgImageUrl: string =
    d?.home?.heroBgImageUrl ??
    d?.media?.assets?.homeHero ??
    d?.home?.featuredImage ??
    '/images/home/hero.jpg';

  const heroStyles = d?.styles?.home?.hero || {};
  const titleWeight = heroStyles.titleWeight || 'black';
  const subtitleWeight = heroStyles.subtitleWeight || 'medium';
  const overlayOpacity =
    typeof heroStyles.overlayOpacity === 'number'
      ? heroStyles.overlayOpacity
      : 0.55;

  const titleColor = heroStyles.titleColor || '#FFFFFF';
  const subtitleColor = heroStyles.subtitleColor || '#E5E7EB';

  const heroAlign =
    heroStyles.align === 'center'
      ? 'items-center text-center'
      : heroStyles.align === 'right'
      ? 'items-end text-right'
      : 'items-start text-left';

  // ================= CLASES RESPONSIVE PRO =================
  const heroTitleClass =
    `text-[clamp(2.2rem,8.5vw,4.2rem)] md:${sizeMap['7xl']} ` +
    `${weightMap[titleWeight]} ` +
    `leading-[0.95] md:leading-tight tracking-tight uppercase drop-shadow-2xl max-w-[22ch]`;

  const heroSubtitleClass =
    `text-[clamp(1rem,3.8vw,1.35rem)] md:${sizeMap['2xl']} ` +
    `${weightMap[subtitleWeight]} ` +
    `max-w-[40ch] border-l-4 md:border-l-8 border-yellow-400 pl-4 md:pl-8 leading-relaxed drop-shadow-2xl`;

  const highlightText = (text: string) => {
    const keywords = ['Protegemos tu inversión', 'tecnología de vanguardia', 'sistemas autónomos'];
    return text
      .split(new RegExp(`(${keywords.join('|')})`, 'gi'))
      .map((part, i) =>
        keywords.some((k) => k.toLowerCase() === String(part).toLowerCase()) ? (
          <span key={i} className="text-yellow-400 font-black">
            {part}
          </span>
        ) : (
          part
        )
      );
  };

  const features = (d?.home?.features || []) as any[];
  const processTitle = d?.home?.processTitle || 'Nuestro proceso';
  const processSubtitle = d?.home?.processSubtitle || 'Instalación clara, rápida y profesional';
  const processSteps = (d?.home?.processSteps || []) as any[];

  return (
    <div className="space-y-0 pb-0">

      {/* ================= HERO ================= */}
      <section className="relative min-h-[78vh] md:min-h-[82vh] flex items-end md:items-center overflow-hidden bg-gray-900">

        {/* Imagen fondo */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroBgImageUrl}
            alt="Hero"
            className="w-full h-full object-cover"
            loading="eager"
          />

          {/* Overlay principal dinámico */}
          <div
            className="absolute inset-0"
            style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity})` }}
          />

          {/* Gradientes refinados */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent md:from-black/55 md:via-black/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        </div>

        {/* Contenido */}
        <div className="relative z-10 max-w-7xl mx-auto w-full px-5 sm:px-8 lg:px-8 pb-10 md:pb-0 text-white">
          <div className={`max-w-4xl space-y-6 md:space-y-8 flex flex-col ${heroAlign}`}>

            <div className="inline-flex items-center gap-3 bg-black/40 backdrop-blur-md border border-yellow-400/40 px-6 py-2 rounded-full font-black text-[10px] md:text-xs uppercase tracking-widest shadow-lg">
              <Shield size={16} className="text-brand" />
              SISTEMA DE PROTECCIÓN <span className="text-yellow-400">PROFESIONAL</span>
            </div>

            <h1 className={heroTitleClass} style={{ color: titleColor }}>
              {heroTitle}
            </h1>

            <p className={heroSubtitleClass} style={{ color: subtitleColor }}>
              {highlightText(heroSubtitle)}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link
                to="/create-project"
                className="bg-brand hover:bg-white hover:text-brand text-white
                           px-7 py-4 md:px-10 md:py-5 rounded-[1.5rem] md:rounded-[2rem]
                           font-black text-base md:text-xl
                           flex items-center justify-center gap-3 transition-all
                           transform hover:scale-[1.02] shadow-2xl"
              >
                DISEÑAR PROYECTO <ArrowRight size={20} />
              </Link>

              <Link
                to="/equipment"
                className="bg-white/10 backdrop-blur-xl hover:bg-white hover:text-black text-white
                           px-7 py-4 md:px-10 md:py-5 rounded-[1.5rem] md:rounded-[2rem]
                           font-black text-base md:text-xl
                           border border-white/30 transition-all text-center"
              >
                CATÁLOGO
              </Link>
            </div>

            {isAdmin && (
              <div className="text-[10px] font-black uppercase tracking-widest text-yellow-400/70">
                Admin: estilos e imagen se controlan desde el Gestor Central
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="relative z-20 -mt-12 md:-mt-16 max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-6 md:gap-8">
        {features.map((item, i) => {
          const Icon = IconMap[item.icon as keyof typeof IconMap] || Shield;

          return (
            <div
              key={item.id || i}
              className="bg-white p-8 md:p-10 rounded-[2rem] md:rounded-[3rem]
                         shadow-lg border border-gray-100 space-y-5
                         hover:-translate-y-1 transition-all"
            >
              <div className="bg-brand/10 w-16 h-16 rounded-xl flex items-center justify-center">
                <Icon className="text-brand" size={30} />
              </div>

              <h3 className="text-2xl md:text-3xl font-black text-black uppercase leading-tight">
                {item.title}
              </h3>

              <p className="text-gray-600 font-medium leading-relaxed">
                {item.desc}
              </p>

              <Link
                to={item.linkUrl || '#'}
                className="flex items-center gap-2 text-brand font-black text-xs uppercase tracking-widest"
              >
                {item.linkLabel || 'Saber más'} <ArrowRight size={12} />
              </Link>
            </div>
          );
        })}
      </section>

      {/* ================= PROCESO ================= */}
      <section className="py-20 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-14 items-center">

          <div className="space-y-8">
            <span className="text-brand font-black uppercase tracking-widest text-sm">
              {processTitle}
            </span>

            <h2 className="text-4xl md:text-5xl font-black text-black leading-tight uppercase">
              {processSubtitle}
            </h2>

            <div className="space-y-6">
              {processSteps.map((step: any, i: number) => (
                <div key={step.id || i} className="flex gap-4">
                  <div className="bg-black text-white w-10 h-10 rounded-lg flex items-center justify-center font-black text-lg">
                    {step.number}
                  </div>

                  <div>
                    <h4 className="text-lg md:text-xl font-black text-black uppercase">
                      {step.title}
                    </h4>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative grid grid-cols-2 gap-4">
            <img
              src="https://images.unsplash.com/photo-1551703599-6b3e8379aa8b?auto=format&fit=crop&q=80&w=600"
              className="rounded-3xl shadow-lg mt-6"
              alt="Cam"
            />
            <img
              src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=600"
              className="rounded-3xl shadow-lg -mt-6"
              alt="Instalación"
            />
          </div>

        </div>
      </section>

    </div>
  );
};

export default Home;
