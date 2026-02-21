import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, useParams } from 'react-router-dom';
import {
  ShieldCheck,
  Menu,
  X,
  Settings,
  Lock,
  Key,
  LogOut,
  Phone,
  Save,
  CheckCircle,
  Star,
  Plus,
  AlertCircle,
  CloudDownload,
  Loader2,
  MessageCircle,
} from 'lucide-react';

import Home from './pages/Home';
import About from './pages/About';
import Equipment from './pages/Equipment';
import Projects from './pages/Projects';
import CreateProject from './pages/CreateProject';
import Suscripcion from './pages/Suscripcion';
import Contact from './pages/Contact';
import AdminDashboard from './pages/AdminDashboard';
import { SiteData, AdminState } from './types';

const RED_LOCK_LOGO =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAB8klEQVR4nO2YvUoDQRSFv7NBEAsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsL/8A3vH8K6R0fXNoAAAAASUVORK5CYII=';

const INITIAL_DATA: SiteData = {
  branding: {
    siteName: 'Mi Pyme Segura',
    logoUrl: RED_LOCK_LOGO,
    primaryColor: '#E02424',
    secondaryColor: '#111827',
    textColor: '#1F2937',
    siteNameColor: '#000000',
    fontFamily: "'Inter', sans-serif",
    globalBackground: '#F9FAFB',

    // ✅ editable desde panel
    footerTagline: 'Líderes en seguridad inteligente para PYMES.',
  },
  whatsappConfig: {
    phoneNumber: '+56912345678',
    welcomeMessage: 'Hola Mi Pyme Segura, necesito asesoría.',
  },
  home: {
    heroTitle: 'SEGURIDAD INTELIGENTE PARA TU NEGOCIO',
    heroSubtitle:
      'Protegemos tu inversión con tecnología de vanguardia y sistemas autónomos diseñados para la realidad de hoy.',
    featuredImage: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1600',
    heroBgColor: '#111827',
    heroTextColor: '#FFFFFF',
  },
  about: {
    title: 'Sobre Mi Pyme Segura',
    content:
      'En Mi Pyme Segura llevamos más de una década dedicados a un propósito claro: proteger lo que más importa. Nacimos desde la realidad que nos rodea y desde el sur de Chile levantamos una propuesta seria, moderna y al alcance de todos.',
    mission: 'Proteger a personas, hogares y organizaciones mediante soluciones de seguridad inteligentes.',
    vision: 'Ser referentes en el sur de Chile en soluciones de seguridad inteligentes.',
    aboutImage: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&q=80&w=800',
    bgColor: '#FFFFFF',
    textColor: '#1F2937',
  },
  contact: {
    title: 'Hablemos de tu Seguridad',
    description:
      'Estamos listos para blindar tu negocio. Completa el formulario o utiliza cualquiera de nuestros canales directos.',
    phone: '+56912345678',
    email: 'hola@mipymesegura.cl',
    address: 'Av. Providencia 1234, Santiago',
    socials: [{ id: '1', name: 'Instagram', icon: 'Instagram', url: 'https://instagram.com' }],
    bgColor: '#F9FAFB',
    textColor: '#1F2937',
  },
  equipmentHeader: {
    title: 'Nuestro Equipamiento',
    subtitle: 'Tecnología de última generación seleccionada por expertos.',
    bgColor: '#FFFFFF',
    textColor: '#1F2937',
  },
  projectsHeader: {
    title: 'Proyectos Instalados',
    subtitle: 'Historias reales de seguridad y crecimiento.',
    bgColor: '#FFFFFF',
    textColor: '#1F2937',
  },
  createProjectHeader: {
    title: 'Crea tu propio Proyecto',
    subtitle: 'Personaliza tu seguridad paso a paso.',
    bgColor: '#FFFFFF',
    textColor: '#1F2937',
  },
  aiSettings: {
    selectedModel: 'gemini-3-flash-preview',
    systemPrompt: 'Eres un asesor experto en seguridad para "Mi Pyme Segura".',
    isBetaEnabled: false,
    betaPrompt: 'Asistente Beta.',
  },
  equipment: [
    {
      id: 'eq1',
      title: 'Cámara Bullet Solar 4K',
      description: 'Autonomía total con panel solar integrado y conectividad 4G. Ideal para perímetros rurales.',
      imageUrl: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&q=80&w=800',
      category: 'Cámaras',
    },
  ],
  projects: [
    {
      id: 'pr1',
      title: 'Instalación en Bodega Industrial',
      description:
        'Implementación de circuito cerrado con IA para detección de intrusos en tiempo real en la zona sur.',
      imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=1200',
    },
  ],
  brands: [
    {
      id: 'b1',
      name: 'Hikvision',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Hikvision_logo.svg/1200px-Hikvision_logo.svg.png',
    },
    {
      id: 'b2',
      name: 'Dahua',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Dahua_Technology_logo.svg/1200px-Dahua_Technology_logo.svg.png',
    },
    {
      id: 'b3',
      name: 'Ubiquiti',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Ubiquiti_Networks_logo.svg/1200px-Ubiquiti_Networks_logo.svg.png',
    },
    {
      id: 'b4',
      name: 'Ruijie',
      logo: 'https://www.ruijienetworks.com/resources/kindeditor/attached/image/20211124/20211124112933_349.png',
    },
    {
      id: 'b5',
      name: 'Bosch',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Bosch-logo.svg/1200px-Bosch-logo.svg.png',
    },
  ],
  customPages: [],
  githubSettings: {
    token: '',
    owner: '',
    repo: '',
    branch: 'main',
  },
};

const SiteDataContext = createContext<{ data: SiteData; updateData: (newData: SiteData) => void } | null>(null);
const AdminContext = createContext<AdminState | null>(null);

export const useSiteData = () => {
  const context = useContext(SiteDataContext);
  if (!context) throw new Error('useSiteData must be used within Provider');
  return context;
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) throw new Error('useAdmin must be used within Provider');
  return context;
};

const CustomPage = () => {
  const { data } = useSiteData();
  const { slug } = useParams();
  const page = data.customPages.find((p) => p.slug === slug);

  if (!page) return <div className="py-40 text-center font-black text-4xl uppercase">Página no encontrada</div>;

  return (
    <div
      className="min-h-screen animate-in fade-in duration-500"
      style={{
        backgroundColor: page.bgColor || data.branding.globalBackground,
        color: page.textColor || data.branding.textColor,
      }}
    >
      <div className="max-w-4xl mx-auto px-4 py-20">
        <h1 className="text-6xl font-black tracking-tighter mb-12 uppercase border-b-8 border-brand inline-block">
          {page.title}
        </h1>
        <div className="prose prose-xl max-w-none">
          <div className="whitespace-pre-wrap text-xl leading-relaxed font-medium">{page.content}</div>
        </div>
      </div>
    </div>
  );
};

const FloatingSaveButton = () => {
  const { data } = useSiteData();
  const { isAdmin } = useAdmin();
  const [showStatus, setShowStatus] = useState(false);

  const handleSave = () => {
    localStorage.setItem('site_data', JSON.stringify(data));
    setShowStatus(true);
    setTimeout(() => setShowStatus(false), 3000);
  };

  if (!isAdmin) return null;

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-3 pointer-events-none">
      {showStatus && (
        <div className="bg-green-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-2xl border-2 border-white animate-bounce">
          <CheckCircle size={18} /> ¡Sincronizado!
        </div>
      )}
      <button
        onClick={handleSave}
        className="pointer-events-auto bg-brand text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all border-4 border-white group"
      >
        <Save size={28} />
      </button>
    </div>
  );
};

const WhatsAppButton = () => {
  const { data } = useSiteData();
  const phone = data.whatsappConfig.phoneNumber.replace(/\D/g, '');
  const msg = encodeURIComponent(data.whatsappConfig.welcomeMessage);

  return (
    <a
      href={`https://wa.me/${phone}?text=${msg}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-8 left-8 z-[100] bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all border-4 border-white group flex items-center justify-center animate-bounce-slow"
    >
      <MessageCircle size={32} />
      <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-3 transition-all duration-500 font-black uppercase text-xs whitespace-nowrap">
        ¡Hablemos ahora!
      </span>
    </a>
  );
};

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { data } = useSiteData();
  const { isAdmin, setIsAdmin, showLogin, setShowLogin } = useAdmin();
  const [credentials, setCredentials] = useState({ user: '', pass: '' });
  const location = useLocation();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (credentials.user === 'admin' && credentials.pass === 'segura2024') {
      setIsAdmin(true);
      setShowLogin(false);
      setCredentials({ user: '', pass: '' });
    } else {
      alert('Credenciales incorrectas.');
    }
  };

  const navItems = [
    { name: 'Inicio', path: '/' },
    { name: 'Sobre Nosotros', path: '/about' },
    { name: 'Equipos', path: '/equipment' },
    { name: 'Proyectos Ejecutados', path: '/projects' },
    { name: 'Crea tu Proyecto', path: '/create-project' },
    { name: 'Seguridad por Suscripción', path: '/suscripcion' }, // ✅ NUEVO (entre Create y Contact)
    { name: 'Contacto', path: '/contact' },
    ...data.customPages.map((p) => ({ name: p.title, path: `/p/${p.slug}` })),
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b-2 border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center gap-2">
              <Link to="/" className="flex items-center group">
                <div className="bg-brand p-1 rounded-lg transition-all duration-300 w-10 h-10 flex items-center justify-center overflow-hidden border border-white/20">
                  <img
                    src={data?.branding?.logoUrl || '/images/logo.png'}
                    alt="Logo"
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/images/logo.png';
                    }}
                  />
                </div>
                <span className="ml-3 text-2xl font-black tracking-tighter uppercase text-site-name">
                  {data?.branding?.siteName || 'Mi Pyme Segura'}
                </span>
              </Link>
            </div>

            <div className="hidden md:flex items-center space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-xs font-black uppercase tracking-widest transition-all hover:text-brand relative py-1 ${
                    location.pathname === item.path ? 'text-brand' : 'text-gray-900'
                  }`}
                >
                  {item.name}
                  {location.pathname === item.path && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand rounded-full" />
                  )}
                </Link>
              ))}

              {!isAdmin ? (
                <button
                  onClick={() => setShowLogin(true)}
                  className="p-2 rounded-xl bg-gray-900 text-white hover:bg-brand transition-all"
                  type="button"
                >
                  <Lock size={16} />
                </button>
              ) : (
                <Link
                  to="/admin"
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-black transition-all"
                >
                  <Settings size={14} /> GESTOR
                </Link>
              )}
            </div>

            <div className="md:hidden flex items-center">
              <button onClick={() => setIsOpen(!isOpen)} className="text-black" type="button">
                {isOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden bg-white border-t-2 border-gray-100 animate-in slide-in-from-top duration-300">
            <div className="px-4 pt-4 pb-8 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`block px-4 py-4 rounded-2xl text-sm font-black uppercase tracking-widest ${
                    location.pathname === item.path ? 'bg-brand text-white' : 'text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              <div className="pt-4 mt-4 border-t-2 border-gray-100 flex flex-col gap-3">
                {!isAdmin ? (
                  <button
                    onClick={() => {
                      setShowLogin(true);
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-3 bg-gray-900 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest"
                    type="button"
                  >
                    <Lock size={18} /> Acceso Administrador
                  </button>
                ) : (
                  <Link
                    to="/admin"
                    onClick={() => setIsOpen(false)}
                    className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest"
                  >
                    <Settings size={18} /> Panel Gestor
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] p-10 max-w-sm w-full shadow-2xl border-4 border-black relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full -mr-16 -mt-16" />

            <h2 className="text-4xl font-black text-black tracking-tight mb-2 uppercase">
              Acceso <span className="text-brand">Admin</span>
            </h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8">
              Usa tus credenciales de seguridad
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Usuario</label>
                <input
                  type="text"
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 outline-none focus:border-brand font-bold text-black"
                  placeholder="Usuario"
                  value={credentials.user}
                  onChange={(e) => setCredentials({ ...credentials, user: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Contraseña</label>
                <input
                  type="password"
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 outline-none focus:border-brand font-bold text-black"
                  placeholder="••••••••"
                  value={credentials.pass}
                  onChange={(e) => setCredentials({ ...credentials, pass: e.target.value })}
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-brand transition-all shadow-xl"
              >
                ENTRAR AL SISTEMA
              </button>
              <button
                type="button"
                onClick={() => setShowLogin(false)}
                className="w-full text-gray-400 font-black text-[10px] uppercase pt-2 hover:text-black transition-colors"
              >
                Cerrar Ventana
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

const Footer = () => {
  const { data } = useSiteData();

  return (
    <footer className="bg-black text-white py-16 px-4 border-t-8 border-brand">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="space-y-6">
          <div className="flex items-center">
            <div className="bg-brand p-1 rounded-lg w-10 h-10 flex items-center justify-center overflow-hidden">
              <img
                src={data?.branding?.logoUrl || '/images/logo.png'}
                alt="Logo"
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/images/logo.png';
                }}
              />
            </div>

            <span className="ml-3 text-2xl font-black tracking-tighter uppercase text-site-name">
              {data?.branding?.siteName || 'Mi Pyme Segura'}
            </span>
          </div>

          <p className="text-gray-400 text-sm font-medium">
            {data?.branding?.footerTagline?.trim() || 'Líderes en seguridad inteligente para PYMES.'}
          </p>
        </div>

        {/* acá sigue el resto de tu footer si quieres (links, contacto, etc) */}
      </div>
    </footer>
  );
};

const App = () => {
  const [data, setData] = useState<SiteData | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsCloudSyncing(true);

      try {
        const res = await fetch(
          'https://raw.githubusercontent.com/marcelobarriaar-sketch/https-github.com-marcelobarriaar-sketch-mi-pyme-segura-2026/main/site_data.json?ts=' +
            Date.now()
        );

        if (res.ok) {
          const json = await res.json();
          setData(json);
          localStorage.setItem('site_data', JSON.stringify(json));
          return;
        }

        const saved = localStorage.getItem('site_data');
        if (saved) {
          setData(JSON.parse(saved));
          return;
        }

        console.warn('No se encontró site_data.json en GitHub, usando INITIAL_DATA');
        setData(INITIAL_DATA);
        localStorage.setItem('site_data', JSON.stringify(INITIAL_DATA));
      } catch (err) {
        console.error('Error cargando configuración, usando backup local/inicial:', err);

        const saved = localStorage.getItem('site_data');
        if (saved) {
          setData(JSON.parse(saved));
        } else {
          setData(INITIAL_DATA);
          localStorage.setItem('site_data', JSON.stringify(INITIAL_DATA));
        }
      } finally {
        setIsCloudSyncing(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (!data) return;
    localStorage.setItem('site_data', JSON.stringify(data));
  }, [data]);

  const updateData = (newData: SiteData) => setData(newData);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center space-y-4">
          <div className="text-2xl font-black">Cargando Mi Pyme Segura...</div>
          <div className="text-xs uppercase tracking-[0.3em] text-gray-400">Sincronizando configuración</div>
        </div>
      </div>
    );
  }

  return (
    <SiteDataContext.Provider value={{ data, updateData }}>
      <AdminContext.Provider value={{ isAdmin, setIsAdmin, showLogin, setShowLogin }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700;900&family=Montserrat:wght@300;400;700;900&family=Playfair+Display:wght@400;700;900&family=Fira+Code:wght@300;400;700&display=swap');

          :root {
            --brand-primary: ${data.branding.primaryColor};
            --brand-secondary: ${data.branding.secondaryColor};
            --site-text: ${data.branding.textColor};
            --site-name-color: ${data.branding.siteNameColor};
            --global-font: ${data.branding.fontFamily};
          }

          body {
            font-family: var(--global-font);
            background-color: ${data.branding.globalBackground};
            color: var(--site-text);
          }

          @keyframes bounce-slow {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          .animate-bounce-slow { animation: bounce-slow 3s infinite ease-in-out; }

          .text-brand { color: var(--brand-primary) !important; }
          .bg-brand { background-color: var(--brand-primary) !important; }
          .border-brand { border-color: var(--brand-primary) !important; }
          .text-site-name { color: var(--site-name-color) !important; }

          .hover\\:text-brand:hover { color: var(--brand-primary) !important; }
          .hover\\:bg-brand:hover { background-color: var(--brand-primary) !important; }
          .hover\\:border-brand:hover { border-color: var(--brand-primary) !important; }
          .focus\\:border-brand:focus { border-color: var(--brand-primary) !important; }

          .selection\\:bg-brand::selection { background-color: var(--brand-primary); color: white; }
        `}</style>

        {isCloudSyncing && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] bg-black text-white px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest flex items-center gap-2 border border-white/20 shadow-2xl animate-in fade-in slide-in-from-top-4">
            <Loader2 size={12} className="animate-spin text-brand" /> Sincronizando Cloud...
          </div>
        )}

        <HashRouter>
          <div className="min-h-screen flex flex-col relative selection:bg-brand selection:text-white">
            <Navbar />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/equipment" element={<Equipment />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/create-project" element={<CreateProject />} />
                <Route path="/suscripcion" element={<Suscripcion />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/p/:slug" element={<CustomPage />} />
              </Routes>
            </main>
            <Footer />
            <FloatingSaveButton />
            <WhatsAppButton />
          </div>
        </HashRouter>
      </AdminContext.Provider>
    </SiteDataContext.Provider>
  );
};

export default App;
