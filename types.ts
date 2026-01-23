
export interface ContentBlock {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  fileUrl?: string;
  category?: string;
}

export interface SocialNetwork {
  id: string;
  name: string;
  icon: string;
  url: string;
}

export interface Brand {
  id: string;
  name: string;
  logo: string;
}

export interface Branding {
  siteName: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  siteNameColor: string;
  fontFamily: string;
  globalBackground: string;
}

export interface GitHubSettings {
  token: string;
  owner: string;
  repo: string;
  branch: string;
}

export interface SiteData {
  branding: Branding;
  whatsappConfig: {
    phoneNumber: string;
    welcomeMessage: string;
  };
  home: {
    heroTitle: string;
    heroSubtitle: string;
    featuredImage: string;
    heroBgColor: string;
    heroTextColor: string;
  };
  about: {
    title: string;
    content: string;
    mission: string;
    vision: string;
    aboutImage: string;
    bgColor: string;
    textColor: string;
  };
  contact: {
    title: string;
    description: string;
    phone: string;
    email: string;
    address: string;
    socials: SocialNetwork[];
    bgColor: string;
    textColor: string;
  };
  equipmentHeader: {
    title: string;
    subtitle: string;
    bgColor: string;
    textColor: string;
  };
  projectsHeader: {
    title: string;
    subtitle: string;
    bgColor: string;
    textColor: string;
  };
  createProjectHeader: {
    title: string;
    subtitle: string;
    bgColor: string;
    textColor: string;
  };
  aiSettings: {
    selectedModel: string;
    systemPrompt: string;
    isBetaEnabled: boolean;
    betaPrompt: string;
  };
  equipment: ContentBlock[];
  projects: ContentBlock[];
  brands: Brand[];
  customPages: {
    id: string;
    title: string;
    content: string;
    slug: string;
    bgColor?: string;
    textColor?: string;
  }[];
  githubSettings: GitHubSettings;
}

export interface AdminState {
  isAdmin: boolean;
  setIsAdmin: (val: boolean) => void;
  showLogin: boolean;
  setShowLogin: (v: boolean) => void;
}
