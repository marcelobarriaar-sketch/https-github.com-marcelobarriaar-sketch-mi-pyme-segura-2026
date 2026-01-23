
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
  siteNameColor: string;
}

export interface GitHubSettings {
  token: string;
  owner: string;
  repo: string;
  branch: string;
}

export interface SiteData {
  branding: Branding;
  home: {
    heroTitle: string;
    heroSubtitle: string;
    featuredImage: string;
  };
  about: {
    title: string;
    content: string;
    mission: string;
    vision: string;
    aboutImage: string;
  };
  contact: {
    title: string;
    description: string;
    phone: string;
    email: string;
    address: string;
    socials: SocialNetwork[];
  };
  equipmentHeader: {
    title: string;
    subtitle: string;
  };
  projectsHeader: {
    title: string;
    subtitle: string;
  };
  createProjectHeader: {
    title: string;
    subtitle: string;
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
  }[];
  githubSettings: GitHubSettings;
}

export interface AdminState {
  isAdmin: boolean;
  setIsAdmin: (val: boolean) => void;
}
