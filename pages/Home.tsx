import React, { useRef } from 'react';
import { useSiteData, useAdmin } from '../App';
import { ArrowRight, Shield, Star, Zap, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';

type HeroField = 'title' | 'subtitle' | 'heroImage';

const Home = () => {
  const { data, updateData } = useSiteData();
  const { isAdmin } = useAdmin();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ========= Compat: lee NUEVO primero y cae a VIEJO =========
  const heroTitle =
    data?.pages?.home?.title ??
    data?.home?.heroTitle ??
    'Mi Pyme Segura';

  const heroSubtitle =
    data?.pages?.home?.subtitle ??
    data?.home?.heroSubtitle ??
    'Cámaras, alarmas, control de acceso y proyectos de seguridad a medida.';

  const heroImage =
    data?.media?.assets?.homeHero ??
    data?.home?.featuredImage ??
    '/images/home/hero.jpg';

  // ========= STYLES (desde site_data.json) =========
  const heroStyles = data?.styles?.home?.hero || {};

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
    heroStyles.align === "center" ? "text-center items-center" :
    heroStyles.align === "right" ? "text-right items-end" :
    "text-left items-start";

  const overlayOpacity =
    typeof heroStyles.overlayOpacity === "number"
      ? heroStyles.overlayOpacity
      : 0.6;

  const titleColor = heroStyles.titleColor || "#FFFFFF";
  const subtitleColor = heroStyles.subtitleColor || "#E5E7EB";

  // ========= Update helpers (escribe en formato NUEVO; opcional: también en viejo) =========
  const setHeroField = (field: HeroField, val: string) => {
    // Clon base
    const next = { ...data };

    // Asegura ramas del nuevo esquema
    next.pages = next.pages || {};
    next.pages.home = next.pages.home || {};
    next.media = next.media || {};
    next.media.assets = next.media.assets || {};

    if (fiel
