import React, { useRef } from "react";
import { useSiteData, useAdmin } from "../App";
import { ArrowRight, Shield, Star, Zap, Upload } from "lucide-react";
import { Link } from "react-router-dom";

type HeroField = "title" | "subtitle" | "heroImage";

const Home = () => {
  const { data, updateData } = useSiteData();
  const { isAdmin } = useAdmin();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ✅ FIX TS: SiteData no declara pages/media/styles → leemos como any (compat)
  const d: any = data;

  // ========= Compat: lee NUEVO primero y cae a VIEJO =========
  const heroTitle =
    d?.pages?.home?.title ??
    d?.home?.heroTitle ??
    "Mi Pyme Segura";

  const heroSubtitle =
    d?.pages?.home?.subtitle ??
    d?.home?.heroSubtitle ??
    "Cámaras, alarmas, control de acceso y proyectos de seguridad a medida.";

  const heroImage =
    d?.media?.assets?.homeHero ??
    d?.home?.featuredImage ??
    "/images/home/hero.jpg";

  // ========= STYLES (desde site_data.json) =========
  const heroStyles = d?.styles?.home?.hero || {};

  const sizeMap: Record<string, string> = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
    "2xl": "text-2xl",
    "3xl": "text-3xl",
    "4xl": "text-4xl",
    "5xl": "text-5xl",
    "6xl": "text-6xl",
    "7xl": "text-7xl",
    "8xl": "text-8xl",
    "9xl": "text-9xl",
  };

  const weightMap: Record<string, string> = {
    thin: "font-thin",
    light: "font-light",
    regular: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
    black: "font-black",
  };

  const titleSize = heroStyles.titleSize || "7xl";
  const subtitleSize = heroStyles.subtitleSize || "2xl";
  const titleWeight = heroStyles.titleWeight || "black";
  const subtitleWeight = heroStyles.subtitleWeight || "medium";

  const heroTitleClass =
    `${sizeMap[titleSize] || "text-7xl"} ` +
    `${weightMap[titleWeight] || "font-black"} ` +
    `leading-tight tracking-tighter uppercase max-w-3xl drop-shadow-2xl`;

  const heroSubtitleClass =
    `${sizeMap[subtitleSize] || "text-2xl"} ` +
    `${weightMap[subtitleWeight] || "font-medium"} ` +
    `max-w-2xl border-l-4 border-brand pl-6 leading-relaxed drop-shadow-lg`;

  const heroAlign =
    heroStyles.align === "center"
      ? "text-center items-center"
      : heroStyles.align === "right"
      ? "text-right items-end"
      : "text-left items-start";

  const overlayOpacity =
    typeof heroStyles.overlayOpacity === "number"
      ? heroStyles.overlayOpacity
      : 0.6;

  const titleColor = heroStyles.titleColor || "#FFFFFF";
  const subtitleColor = heroStyles.subtitleColor || "#E5E7EB";

  // ========= Update helpers =========
  const setHeroField = (field: HeroField, val: string) => {
    const next: any = { ...(d || {}) };

    // Nuevo esquema
    next.pages = next.pages || {};
    next.pages.home = next.pages.home || {};
    next.media = next.media || {};
    next.media.assets = next.media.assets || {};

    // Viejo esquema (compat)
    next.home = next.home || {};

    if (field === "title") {
      next.pages.home.title = val;
      next.home.heroTitle = val; // compat
    }

    if (field === "subtitle") {
      next.pages.home.subtitle = val;
      next.home.heroSubtitle = val; // compat
    }

    if (field === "heroImage") {
      next.media.assets.homeHero = val;
      next.home.featuredImage = val; // compat
    }

    // housekeeping opcional
    next.meta = next.meta || {};
    next.meta.lastUpdated = new Date().toISOString();

    updateData(next);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setHeroField("heroImage", reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-0 pb-0">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center overflow-hidden bg-gray-900">
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            alt="Hero Background"
            className="w-full h-full object-cover"
            style={{ opacity: overlayOpacity }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        </div>

        {isAdmin && (
          <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
            <div className="bg-yellow-400 text-black px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2 border-2 border-black animate-in fade-in slide-in-from-top-2">
              <span className="animate-pulse">●</span> Edición en Vivo Activa
            </div>
            <input
              type="file"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-white/10 backdrop-blur-md text-white border border-white/20 p-4 rounded-2xl flex items-center gap-3 font-black text-xs hover:bg-brand hover:border-brand transition-all"
            >
              <Upload size={18} /> CAMBIAR FONDO
            </button>
          </div>
        )}

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white w-full">
          <div
            className={`max-w-4xl space-y-8 animate-in fade-in slide-in-from-left-8 duration-700 flex flex-col ${heroAlign}`}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-3 bg-black/40 backdrop-blur-md border border-white/10 px-6 py-2 rounded-full font-black text-[10px] md:text-xs uppercase tracking-[0.2em] shadow-2xl">
              <Shield size={16} className="text-brand" />
              <span>
                SISTEMA DE PROTECCIÓN{" "}
                <span className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]">
                  PROFESIONAL
                </span>
              </span>
            </div>

            {isAdmin ? (
              <textarea
                value={heroTitle}
                onChange={(e) => setHeroField("title", e.target.value)}
                className="w-full bg-white/5 border-4 border-brand p-6 rounded-[3rem] outline-none text-white tracking-tighter text-4xl md:text-6xl font-black"
                style={{ color: titleColor }}
              />
            ) : (
              <h1 className={heroTitleClass} style={{ color: titleColor }}>
                {heroTitle}
              </h1>
            )}

            {isAdmin ? (
              <textarea
                value={heroSubtitle}
                onChange={(e) => setHeroField("subtitle", e.target.value)}
                className="w-full bg-white/5 border-2 border-white/20 p-6 rounded-3xl outline-none"
                style={{ color: subtitleColor }}
              />
            ) : (
              <p className={heroSubtitleClass} style={{ color: subtitleColor }}>
                {heroSubtitle}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-6 pt-4">
              <Link
                to="/create-project"
                className="bg-brand hover:bg-white hover:text-brand text-white px-10 py-5 rounded-[2rem] font-black text-xl flex items-center justify-center gap-3 transition-all transform hover:scale-105 shadow-2xl shadow-brand/30"
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
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="relative z-20 -mt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-3 gap-8">
        {[
          {
            icon: Shield,
            title: "Máxima Seguridad",
            color: "text-brand",
            bg: "bg-brand/5",
            desc: "Monitoreo 24/7 con sistemas anti-sabotaje integrados.",
          },
          {
            icon: Zap,
            title: "Energía Solar",
            color: "text-yellow-400",
            bg: "bg-yellow-400/5",
            desc: "Independencia eléctrica absoluta para zonas rurales extremas.",
          },
          {
            icon: Star,
            title: "Inteligencia IA",
            color: "text-blue-600",
            bg: "bg-blue-600/5",
            desc: "Análisis predictivo de movimiento para evitar falsas alarmas.",
          },
        ].map((item, i) => (
          <div
            key={i}
            className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-50 space-y-6 hover:-translate-y-2 transition-all duration-300 group relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1.5 h-full bg-brand opacity-0 group-hover:opacity-100 transition-opacity" />
            <div
              className={`${item.bg} w-20 h-20 rounded-2xl flex items-center justify-center group-hover:rotate-3 transition-transform`}
            >
              <item.icon className={`${item.color}`} size={40} />
            </div>
            <div className="space-y-3">
              <h3 className="text-3xl font-black text-black tracking-tight uppercase leading-none">
                {item.title}
              </h3>
              <p className="text-gray-500 font-semibold leading-snug text-base">
                {item.desc}
              </p>
            </div>
            <div className="pt-2 flex items-center gap-2 text-brand font-black text-xs uppercase tracking-widest">
              Saber más <ArrowRight size={12} />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default Home;
