// =========================
// ADMIN
// =========================

export type AdminState = {
  isAdmin: boolean;
  setIsAdmin: (v: boolean) => void;
  showLogin: boolean;
  setShowLogin: (v: boolean) => void;
};

// =========================
// BRANDING
// =========================

export type Branding = {
  siteName: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  siteNameColor: string;
  fontFamily: string;
  globalBackground: string;

  // ✅ NUEVOS (opcionales) — usados por AdminDashboard
  footerText?: string;
  footerSubText?: string;
};

// =========================
// WHATSAPP
// =========================

export type WhatsAppConfig = {
  phoneNumber: string;
  welcomeMessage: string;
};

// =========================
// HOME (LEGACY)
// =========================

export type HomeFeatureItem = {
  title: string;

  // ✅ compat: en algunos lados usan description, en AdminDashboard usa desc
  description?: string;
  desc?: string;

  icon?: string;

  // ✅ CTA/Link desde admin
  linkLabel?: string;
  linkUrl?: string;
};

export type HomeProcessStep = {
  title: string;
  description?: string;

  // ✅ numeración (AdminDashboard usa number)
  number?: number | string;
};

export type HomeLegacy = {
  heroTitle: string;
  heroSubtitle: string;
  featuredImage: string;
  heroBgColor?: string;
  heroTextColor?: string;

  // ✅ NUEVOS (opcionales para compat con legacy)
  features?: HomeFeatureItem[];

  processTitle?: string;
  processSubtitle?: string;
  processSteps?: HomeProcessStep[];
};

// =========================
// ABOUT / CONTACT / HEADERS
// =========================

// ✅ NUEVO: ALIADOS (ABOUT)
export type AllyItem = {
  id: string;
  name: string;
  logo: string;
  url?: string;
};

export type AlliesBlock = {
  eyebrow: string;
  title: string;
  subtitle: string;
  items: AllyItem[];
};

export type AboutData = {
  title: string;
  content: string;
  mission: string;
  vision: string;
  aboutImage: string;
  bgColor?: string;
  textColor?: string;

  // ✅ NUEVO: Aliados dentro de About
  allies?: AlliesBlock;
};

export type ContactData = {
  title: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  socials: {
    id: string;
    name: string;
    icon: string;
    url: string;
  }[];
  bgColor?: string;
  textColor?: string;
};

export type SimpleHeader = {
  title: string;
  subtitle: string;
  bgColor?: string;
  textColor?: string;

  // ✅ NUEVOS (opcionales)
  installationInfo?: string;
  evaluationInfo?: string;
};

// =========================
// EQUIPMENT / PROJECTS
// =========================

export type EquipmentItem = {
  id: string;
  title: string;
  description: string;

  // ✅ opcional — el AdminDashboard crea items sin imagen al inicio
  imageUrl?: string;

  category: string;

  // ✅ acepta número o string (inputs del admin)
  price?: number | string;

  fileUrl?: string;
  videoUrl?: string;
};

export type ProjectItem = {
  id: string;
  title: string;
  description: string;

  // ✅ opcional por compat con creación inicial
  imageUrl?: string;
};

// =========================
// BRANDS (FIX DEL ERROR)
// =========================

export type BrandLegacy = {
  id: string;
  name: string;

  // 👇 compatibilidad doble — About.tsx usa url, INITIAL_DATA usa logo
  logo?: string;
  url?: string;

  // ✅ NUEVO (para el error footerSubText)
  footerSubText?: string;
};

// =========================
// CUSTOM PAGES
// =========================

export type CustomPage = {
  id: string;
  slug: string;
  title: string;
  content: string;
  bgColor?: string;
  textColor?: string;
};

// =========================
// AI SETTINGS
// =========================

export type AISettings = {
  selectedModel: string;
  systemPrompt: string;
  isBetaEnabled: boolean;
  betaPrompt: string;
};

// =========================
// GITHUB SETTINGS
// =========================

export type GithubSettings = {
  token: string;
  owner: string;
  repo: string;
  branch: string;
};

// =========================
// NUEVO SITE_DATA.JSON SCHEMA
// =========================

export type MediaAssets = {
  logo?: string;
  logoAlt?: string;
  favicon?: string;

  homeHero?: string;
  homeHeroAlt?: string;

  aboutHero?: string;
  aboutHeroAlt?: string;

  contactHero?: string;
  contactHeroAlt?: string;

  fallbackImage?: string;
};

export type StylesHero = {
  titleSize?: string;
  subtitleSize?: string;
  titleWeight?: string;
  subtitleWeight?: string;
  align?: 'left' | 'center' | 'right';
  overlayOpacity?: number;
  titleColor?: string;
  subtitleColor?: string;
};

export type StylesConfig = {
  home?: {
    hero?: StylesHero;
  };
};

export type PagesConfig = {
  home?: {
    title?: string;
    subtitle?: string;
  };
};

// =========================
// SITE DATA ROOT
// =========================

export type SiteData = {
  // --- core actual ---
  branding: Branding;
  whatsappConfig: WhatsAppConfig;

  home: HomeLegacy;
  about: AboutData;
  contact: ContactData;

  equipmentHeader: SimpleHeader;
  projectsHeader: SimpleHeader;
  createProjectHeader: SimpleHeader;

  aiSettings: AISettings;

  equipment: EquipmentItem[];
  projects: ProjectItem[];
  brands: BrandLegacy[];
  customPages: CustomPage[];

  githubSettings: GithubSettings;

  // --- nuevo esquema (opcionales para compat) ---
  pages?: PagesConfig;
  media?: {
    imagesBasePath?: string;
    assets?: MediaAssets;
  };
  styles?: StylesConfig;

  meta?: {
    siteName?: string;
    lastUpdated?: string;
    version?: number;
  };
};
