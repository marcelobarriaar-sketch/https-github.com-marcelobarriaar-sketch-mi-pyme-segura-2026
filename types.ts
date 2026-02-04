// src/types.ts

// =====================
// ADMIN
// =====================
export type AdminState = {
  isAdmin: boolean;
  setIsAdmin: (val: boolean) => void;
  showLogin: boolean;
  setShowLogin: (val: boolean) => void;
};

// =====================
// LEGACY (lo que tu App.tsx usa hoy)
// =====================
export type Branding = {
  siteName: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  siteNameColor: string;
  fontFamily: string;
  globalBackground: string;
};

export type WhatsAppConfig = {
  phoneNumber: string;
  welcomeMessage: string;
};

export type HomeLegacy = {
  heroTitle: string;
  heroSubtitle: string;
  featuredImage: string;
  heroBgColor?: string;
  heroTextColor?: string;
};

export type AboutLegacy = {
  title: string;
  content: string;
  mission: string;
  vision: string;
  aboutImage?: string;
  bgColor?: string;
  textColor?: string;
};

export type ContactLegacy = {
  title: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  socials: Array<{
    id: string;
    name: string;
    icon: string;
    url: string;
  }>;
  bgColor?: string;
  textColor?: string;
};

export type SimpleHeaderLegacy = {
  title: string;
  subtitle: string;
  bgColor?: string;
  textColor?: string;
};

export type AISettingsLegacy = {
  selectedModel: string;
  systemPrompt: string;
  isBetaEnabled: boolean;
  betaPrompt?: string;
};

export type EquipmentItemLegacy = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category?: string;
};

export type ProjectItemLegacy = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
};

export type BrandLegacy = {
  id: string;
  name: string;
  logo: string;
};

export type CustomPage = {
  id: string;
  title: string;
  slug: string;
  content: string;
  bgColor?: string;
  textColor?: string;
};

export type GithubSettings = {
  token: string;
  owner: string;
  repo: string;
  branch: string;
};

// =====================
// NUEVO ESQUEMA (site_data.json nuevo)
// =====================
export type SiteMeta = {
  siteName?: string;
  lastUpdated?: string;
  version?: number;
};

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

  // por si después agregas más:
  [key: string]: any;
};

export type Media = {
  imagesBasePath?: string;
  assets?: MediaAssets;
};

export type NavItem = {
  label: string;
  path: string;
};

export type Nav = {
  items?: NavItem[];
};

export type PagesHome = {
  title?: string;
  subtitle?: string;
  ctaPrimary?: { label: string; path: string };
  ctaSecondary?: { label: string; path: string };
  highlights?: Array<{ title: string; text: string }>;
};

export type PagesServices = {
  title?: string;
  intro?: string;
  items?: Array<{
    id: string;
    title: string;
    description: string;
    image?: string;
  }>;
};

export type PagesAbout = {
  title?: string;
  intro?: string;
  bullets?: string[];
};

export type PagesContact = {
  title?: string;
  subtitle?: string;
  channels?: {
    phone?: string;
    email?: string;
    whatsapp?: string;
  };
  address?: {
    city?: string;
    region?: string;
    country?: string;
  };
};

export type Pages = {
  home?: PagesHome;
  services?: PagesServices;
  about?: PagesAbout;
  contact?: PagesContact;

  // por si sumas más páginas
  [key: string]: any;
};

export type CatalogEquipment = {
  id: string;
  name: string;
  brand?: string;
  category?: string;
  shortDescription?: string;
  specs?: Record<string, any>;
  price?: {
    currency?: string;
    amount?: number;
    note?: string;
  };
  images?: string[];
  mainImage?: string;
  tags?: string[];
  active?: boolean;
};

export type Catalog = {
  equipments?: CatalogEquipment[];
  [key: string]: any;
};

export type HeroStyle = {
  titleSize?: string;       // "7xl", "6xl", etc
  subtitleSize?: string;    // "2xl", etc
  titleWeight?: string;     // "black", "bold", etc
  subtitleWeight?: string;  // "medium", etc
  align?: "left" | "center" | "right";
  overlayOpacity?: number;  // 0..1
  titleColor?: string;      // "#FFFFFF"
  subtitleColor?: string;   // "#E5E7EB"
};

export type Styles = {
  home?: {
    hero?: HeroStyle;
    [key: string]: any;
  };
  [key: string]: any;
};

// =====================
// SITE DATA FINAL (compat: viejo + nuevo)
// =====================
export type SiteData = {
  // ---- Legacy (requeridos porque App.tsx los usa directo) ----
  branding: Branding;
  whatsappConfig: WhatsAppConfig;

  home: HomeLegacy;
  about: AboutLegacy;
  contact: ContactLegacy;

  equipmentHeader: SimpleHeaderLegacy;
  projectsHeader: SimpleHeaderLegacy;
  createProjectHeader: SimpleHeaderLegacy;

  aiSettings: AISettingsLegacy;

  equipment: EquipmentItemLegacy[];
  projects: ProjectItemLegacy[];
  brands: BrandLegacy[];

  customPages: CustomPage[];

  githubSettings: GithubSettings;

  // ---- Nuevo esquema (opcionales para que no rompa nada) ----
  meta?: SiteMeta;
  media?: Media;
  nav?: Nav;
  pages?: Pages;
  catalog?: Catalog;
  styles?: Styles;

  // por si te llega cualquier cosa adicional desde JSON
  [key: string]: any;
};
