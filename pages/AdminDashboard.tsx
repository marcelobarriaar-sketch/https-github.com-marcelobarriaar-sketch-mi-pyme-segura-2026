import React, { useMemo, useState } from 'react';
import { useSiteData, useAdmin } from '../App';
import {
  Save,
  Plus,
  ArrowLeft,
  Download,
  Upload,
  Database,
  Zap,
  Palette,
  ImageIcon,
  Layers,
  Wrench,
  Github,
  Lock,
  BrainCircuit,
  MessageCircle,
  Type,
  ChevronRight,
  Trash2,
  Image as IconImage,
  Smartphone,
  X,
  DollarSign,
  ListOrdered,
  Star,
  Bell,
  Shield,
  Globe,
  PlusCircle,
  RefreshCw, // ✅ FALTABA
} from 'lucide-react';
import { Link } from 'react-router-dom';

type AnyObj = Record<string, any>;

const AdminDashboard = () => {
  const { data, updateData } = useSiteData() as any;
  const { isAdmin, setShowLogin } = useAdmin() as any;

  const [activeTab, setActiveTab] = useState<
    'branding' | 'pages' | 'whatsapp' | 'ai' | 'maintenance' | 'github'
  >('branding');

  const [activePageEditor, setActivePageEditor] = useState<string | null>(null);

  // ✅ estados “cloud”
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  // -----------------------------
  // GUARDADO: local + GitHub
  // -----------------------------
  const handleManualSave = async (payload?: any) => {
    const toSave = payload ?? data;

    // Helper: corrige URLs de GitHub tipo /blob/ a raw (para que <img> funcione)
    const fixGithubBlobToRaw = (url?: string) => {
      if (!url || typeof url !== 'string') return url;
      if (url.includes('github.com') && url.includes('/blob/')) {
        return url
          .replace('https://github.com/', 'https://raw.githubusercontent.com/')
          .replace('/blob/', '/');
      }
      // También corrige si te llega con "refs/heads/main" en raw
      if (url.includes('raw.githubusercontent.com') && url.includes('/refs/heads/')) {
        return url.replace('/refs/heads/', '/');
      }
      return url;
    };

    // 1) Guardar local (payload exacto)
    localStorage.setItem('site_data', JSON.stringify(toSave));

    // 2) Guardar nube/GitHub
    try {
      setIsSyncing(true);
      setSaveStatus('Sincronizando con la nube...');

      // Normalización defensiva (solo si existen estas rutas)
      const normalized = (() => {
        const next = { ...toSave } as AnyObj;

        // 🔧 Arregla imágenes en catálogo (si existe)
        if (next?.catalog?.products && Array.isArray(next.catalog.products)) {
          next.catalog = { ...next.catalog };
          next.catalog.products = next.catalog.products.map((p: any) => ({
            ...p,
            imageUrl: fixGithubBlobToRaw(p?.imageUrl),
          }));
        }

        // 🔧 Arregla heroBgImageUrl (si existe)
        if (next?.home?.heroBgImageUrl) {
          next.home = { ...next.home, heroBgImageUrl: fixGithubBlobToRaw(next.home.heroBgImageUrl) };
        }

        // 🔧 Arregla aboutImage (si existe)
        if (next?.about?.aboutImage) {
          next.about = { ...next.about, aboutImage: fixGithubBlobToRaw(next.about.aboutImage) };
        }

        return next;
      })();

      const res = await fetch('/api/save-site-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalized),
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error('Error API /api/save-site-data:', res.status, result);
        setSaveStatus('⚠️ Error al guardar en GitHub');
      } else {
        console.log('Sync OK:', result);
        setSaveStatus('✅ Guardado en GitHub');
      }
    } catch (err) {
      console.error('Error inesperado:', err);
      setSaveStatus('⚠️ Error de conexión');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSaveStatus(null), 4000);
    }
  };

  // -----------------------------
  // Upload base64 (compatibilidad)
  // -----------------------------
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    callback: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => callback(reader.result as string);
    reader.readAsDataURL(file);
  };

  // -----------------------------
  // Upload REAL a GitHub (public/...)
  // -----------------------------
  const uploadImageToCloud = async (file: File, targetPath: string) => {
    try {
      setUploadStatus('Subiendo imagen a la nube...');

      const form = new FormData();
      form.append('file', file);
      form.append('targetPath', targetPath);

      const res = await fetch('/api/upload-image', {
        method: 'POST',
        body: form,
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error('Error API /api/upload-image:', res.status, result);
        setUploadStatus('⚠️ Error al subir imagen');
        setTimeout(() => setUploadStatus(null), 3500);
        return null;
      }

      setUploadStatus('✅ Imagen subida');
      setTimeout(() => setUploadStatus(null), 2500);

      // Debe venir algo tipo "/images/home/hero-123.jpg"
      return result.publicUrl as string;
    } catch (err) {
      console.error('Error uploadImageToCloud:', err);
      setUploadStatus('⚠️ Error de conexión al subir');
      setTimeout(() => setUploadStatus(null), 3500);
      return null;
    }
  };

  // -----------------------------
  // Acceso
  // -----------------------------
  if (!isAdmin) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 bg-gray-50 animate-in fade-in duration-500">
        <div className="bg-black p-10 rounded-[4rem] border-4 border-brand shadow-2xl space-y-8 max-w-md w-full text-center">
          <div className="bg-brand text-white w-24 h-24 rounded-3xl flex items-center justify-center mx-auto shadow-xl border-4 border-white rotate-3">
            <Lock size={48} />
          </div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
            Acceso <span className="text-brand">Privado</span>
          </h2>
          <button
            onClick={() => setShowLogin(true)}
            className="w-full bg-brand text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl"
          >
            INICIAR SESIÓN
          </button>
          <Link
            to="/"
            className="block text-gray-400 font-black text-[10px] uppercase hover:text-white transition-colors"
          >
            Volver al Inicio
          </Link>
        </div>
      </div>
    );
  }

  // fallback si no hay hero bg
  const heroFallback = '/images/default-hero.jpg';

  const pageIds = useMemo(() => ['home', 'about', 'equipment', 'projects', 'contact'], []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 text-black">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="p-3 bg-gray-100 hover:bg-black hover:text-white rounded-2xl transition-all"
          >
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-5xl font-black tracking-tighter uppercase text-site-name">
            Gestor <span className="text-brand">Central</span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {saveStatus && (
            <span
              className={`font-black animate-pulse ${
                saveStatus.includes('Error') ? 'text-red-600' : 'text-green-600'
              }`}
            >
              {saveStatus}
            </span>
          )}

          <button
            onClick={() => handleManualSave()}
            disabled={isSyncing}
            className={`bg-black text-white px-10 py-4 rounded-2xl font-black flex items-center gap-3 hover:bg-brand transition-all shadow-xl ${
              isSyncing ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            <Save size={20} /> {isSyncing ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-10">
        {/* SIDEBAR */}
        <aside className="space-y-3">
          {[
            { id: 'branding', label: 'Marca y Estilo', icon: Palette },
            { id: 'pages', label: 'Sub-Páginas (CMS)', icon: Layers },
            { id: 'whatsapp', label: 'WhatsApp Directo', icon: MessageCircle },
            { id: 'ai', label: 'Cerebro IA', icon: BrainCircuit },
            { id: 'github', label: 'GitHub Cloud', icon: Github },
            { id: 'maintenance', label: 'Mantenimiento', icon: Wrench },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setActivePageEditor(null);
              }}
              className={`w-full flex items-center gap-4 px-6 py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest transition-all ${
                activeTab === tab.id
                  ? 'bg-brand text-white shadow-xl scale-105'
                  : 'bg-white border-2 border-gray-100 text-gray-400 hover:border-black'
              }`}
            >
              <tab.icon size={20} /> {tab.label}
            </button>
          ))}
        </aside>

        {/* MAIN */}
        <main className="md:col-span-3 space-y-10">
          {/* TAB: BRANDING */}
          {activeTab === 'branding' && (
            <div className="bg-white p-10 rounded-[3rem] border-4 border-black shadow-xl space-y-12 animate-in fade-in duration-500">
              <h2 className="text-3xl font-black uppercase flex items-center gap-4 text-brand">
                <Palette /> MARCA Y ESTILO
              </h2>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-gray-400">
                    Nombre de la Pyme
                  </label>
                  <input
                    className="w-full bg-gray-50 border-2 p-4 rounded-xl font-black text-xl outline-none focus:border-brand"
                    value={(data.branding?.siteName ?? '')}
                    onChange={(e) =>
                      updateData({
                        ...data,
                        branding: { ...(data.branding ?? {}), siteName: e.target.value },
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-gray-400">
                    Color Primario
                  </label>
                  <div className="flex gap-4 items-center">
                    <input
                      type="color"
                      className="w-12 h-12 rounded-lg cursor-pointer"
                      value={(data.branding?.primaryColor ?? '#b51a00')}
                      onChange={(e) =>
                        updateData({
                          ...data,
                          branding: { ...(data.branding ?? {}), primaryColor: e.target.value },
                        })
                      }
                    />
                    <span className="font-mono text-xs">{data.branding?.primaryColor}</span>
                  </div>
                </div>
              </div>

              {/* Logo (local + URL) */}
              <div className="space-y-3 pt-6 border-t border-gray-100">
                <h3 className="text-xl font-black uppercase text-gray-400 flex items-center gap-2">
                  <IconImage /> LOGO
                </h3>

                <div className="grid md:grid-cols-2 gap-6 items-start">
                  {/* Preview */}
                  <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-4">
                    <div className="text-xs font-black uppercase text-gray-400 mb-3">
                      Vista previa
                    </div>

                    <div className="h-28 bg-white rounded-2xl border border-gray-200 flex items-center justify-center overflow-hidden p-3">
                      <img
                        src={data.branding?.logoUrl || '/images/logo.png'}
                        className="max-w-full max-h-full object-contain"
                        alt="Logo"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/images/logo.png';
                        }}
                      />
                    </div>

                    <div className="mt-3 text-xs text-gray-500">
                      Tip: usa una URL pública (GitHub raw, Cloudinary, etc.). Formatos:
                      PNG/JPG/WebP.
                    </div>
                  </div>

                  {/* Controles */}
                  <div className="space-y-4">
                    {/* Subida local */}
                    <div>
                      <input
                        type="file"
                        className="hidden"
                        id="logo-upload"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(e) =>
                          handleFileUpload(e, (url) =>
                            updateData({
                              ...data,
                              branding: { ...(data.branding ?? {}), logoUrl: url },
                            })
                          )
                        }
                      />

                      <button
                        onClick={() => document.getElementById('logo-upload')?.click()}
                        className="bg-black text-white px-8 py-3 rounded-xl font-black text-xs hover:bg-brand transition-all flex items-center gap-2"
                        type="button"
                      >
                        <Upload size={16} /> SUBIR LOGO (LOCAL)
                      </button>
                    </div>

                    {/* URL del logo */}
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase text-gray-400">
                        Logo (URL)
                      </label>

                      <input
                        className="w-full bg-gray-50 border-2 p-4 rounded-xl font-black text-sm outline-none focus:border-brand"
                        value={(data.branding?.logoUrl ?? '')}
                        onChange={(e) =>
                          updateData({
                            ...data,
                            branding: { ...(data.branding ?? {}), logoUrl: e.target.value },
                          })
                        }
                        placeholder="https://.../logo.png"
                      />

                      <div className="flex gap-3">
                        <button
                          type="button"
                          className="px-5 py-2 rounded-xl font-black text-xs bg-white border-2 border-black hover:bg-gray-50 transition"
                          onClick={() =>
                            updateData({
                              ...data,
                              branding: { ...(data.branding ?? {}), logoUrl: '' },
                            })
                          }
                          title="Vaciar URL del logo"
                        >
                          LIMPIAR URL
                        </button>

                        <button
                          type="button"
                          className="px-5 py-2 rounded-xl font-black text-xs bg-black text-white hover:bg-brand transition flex items-center gap-2"
                          onClick={() => {
                            updateData({
                              ...data,
                              branding: {
                                ...(data.branding ?? {}),
                                logoUrl: (data.branding?.logoUrl ?? '').trim(),
                              },
                            });
                          }}
                          title="Aplicar URL"
                        >
                          <RefreshCw size={14} /> USAR URL
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Texto inferior (Footer) */}
              <div className="space-y-3 pt-6 border-t border-gray-100">
                <h3 className="text-xl font-black uppercase text-gray-400 flex items-center gap-2">
                  <Type /> TEXTO INFERIOR (FOOTER)
                </h3>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-gray-400">
                    Frase del pie de página
                  </label>

                  <input
                    className="w-full bg-gray-50 border-2 p-4 rounded-xl font-black text-sm outline-none focus:border-brand"
                    value={(data.branding?.footerTagline ?? '')}
                    onChange={(e) =>
                      updateData({
                        ...data,
                        branding: { ...(data.branding ?? {}), footerTagline: e.target.value },
                      })
                    }
                    placeholder="Líderes en seguridad inteligente para PYMES."
                  />

                  <div className="text-xs text-gray-500">
                    Si lo dejas vacío, puedes mantener un texto por defecto en el Footer.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: PAGES */}
          {activeTab === 'pages' && (
            <div className="space-y-8">
              <div className="bg-white p-10 rounded-[3rem] border-4 border-black shadow-xl space-y-8">
                <h2 className="text-3xl font-black uppercase flex items-center gap-4 text-orange-500">
                  <Layers /> GESTOR DE CONTENIDOS
                </h2>

                <div className="grid gap-4">
                  {pageIds.map((pid) => (
                    <button
                      key={pid}
                      onClick={() => setActivePageEditor(pid)}
                      className="w-full flex items-center justify-between p-6 bg-gray-50 rounded-2xl border-2 border-transparent hover:border-black transition-all group"
                    >
                      <span className="font-black uppercase text-sm tracking-widest">
                        {pid === 'home' ? 'Página de Inicio' : pid.toUpperCase()}
                      </span>
                      <ChevronRight />
                    </button>
                  ))}
                </div>
              </div>

              {activePageEditor && (
                <div className="bg-white p-10 rounded-[4rem] border-4 border-brand shadow-2xl space-y-12 animate-in slide-in-from-top-10 duration-500">
                  <div className="flex justify-between items-center border-b pb-6">
                    <h3 className="text-3xl font-black uppercase">
                      Editando: {activePageEditor.toUpperCase()}
                    </h3>
                    <button
                      onClick={() => setActivePageEditor(null)}
                      className="p-2 bg-gray-100 rounded-xl"
                      title="Cerrar editor"
                    >
                      <X />
                    </button>
                  </div>

                  {/* HOME */}
                  {activePageEditor === 'home' && (
                    <div className="space-y-12">
                      <div className="p-8 bg-gray-50 rounded-3xl space-y-6">
                        <h4 className="text-xl font-black uppercase text-brand flex items-center gap-2">
                          <IconImage size={24} /> PORTADA (HERO)
                        </h4>

                        <div className="grid md:grid-cols-2 gap-8">
                          <div className="space-y-4">
                            <label className="text-xs font-black uppercase text-gray-400">
                              Título Principal
                            </label>
                            <textarea
                              className="w-full bg-white p-4 border-2 rounded-xl font-black text-2xl h-32"
                              value={data.home?.heroTitle ?? ''}
                              onChange={(e) =>
                                updateData({
                                  ...data,
                                  home: { ...(data.home ?? {}), heroTitle: e.target.value },
                                })
                              }
                            />
                          </div>

                          <div className="space-y-4">
                            <label className="text-xs font-black uppercase text-gray-400">
                              Subtítulo
                            </label>
                            <textarea
                              className="w-full bg-white p-4 border-2 rounded-xl font-bold h-32"
                              value={data.home?.heroSubtitle ?? ''}
                              onChange={(e) =>
                                updateData({
                                  ...data,
                                  home: { ...(data.home ?? {}), heroSubtitle: e.target.value },
                                })
                              }
                            />
                          </div>
                        </div>

                        {/* Featured image (base64 compat) */}
                        <div className="space-y-4">
                          <label className="text-xs font-black uppercase text-gray-400">
                            Imagen de Portada (Featured)
                          </label>
                          <div className="flex items-center gap-6">
                            <img
                              src={data.home?.featuredImage ?? ''}
                              className="w-40 h-24 object-cover rounded-xl border-2 border-black"
                              alt="Featured"
                            />
                            <div className="flex-1">
                              <input
                                type="file"
                                className="hidden"
                                id="home-featured-upload"
                                accept="image/png,image/jpeg,image/webp"
                                onChange={(e) =>
                                  handleFileUpload(e, (url) =>
                                    updateData({
                                      ...data,
                                      home: { ...(data.home ?? {}), featuredImage: url },
                                    })
                                  )
                                }
                              />
                              <button
                                onClick={() =>
                                  document.getElementById('home-featured-upload')?.click()
                                }
                                className="bg-black text-white px-8 py-3 rounded-xl font-black text-xs hover:bg-brand transition-all flex items-center gap-2"
                              >
                                <Upload size={16} /> CAMBIAR FOTO (LOCAL)
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* ✅ HERO BG (cloud real) */}
                        <div className="space-y-4 pt-6 border-t border-gray-200">
                          <label className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                            <ImageIcon size={16} /> Imagen de Fondo (Hero) — permanente (GitHub)
                          </label>

                          <div className="grid md:grid-cols-2 gap-6 items-start">
                            <div className="space-y-3">
                              <div className="w-full h-40 bg-gray-100 rounded-2xl overflow-hidden border-2 border-dashed border-gray-300">
                                <img
                                  src={(data.home?.heroBgImageUrl as string) || heroFallback}
                                  className="w-full h-full object-cover"
                                  alt="Hero background preview"
                                />
                              </div>

                              {uploadStatus && (
                                <div className="text-xs font-black text-gray-600">
                                  {uploadStatus}
                                </div>
                              )}

                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                className="hidden"
                                id="hero-bg-upload"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;

                                  const maxMB = 0.6;
                                  if (file.size > maxMB * 1024 * 1024) {
                                    setUploadStatus(`⚠️ Muy pesada. Ideal < ${maxMB}MB`);
                                    setTimeout(() => setUploadStatus(null), 3500);
                                    return;
                                  }

                                  const ext = (() => {
                                    const name = file.name.toLowerCase();
                                    if (name.endsWith('.webp')) return 'webp';
                                    if (name.endsWith('.png')) return 'png';
                                    if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'jpg';
                                    return 'jpg';
                                  })();

                                  const targetPath = `public/images/home/hero-${Date.now()}.${ext}`;
                                  const publicUrl = await uploadImageToCloud(file, targetPath);
                                  if (!publicUrl) return;

                                  updateData({
                                    ...data,
                                    home: { ...(data.home ?? {}), heroBgImageUrl: publicUrl },
                                  });
                                }}
                              />

                              <button
                                onClick={() => document.getElementById('hero-bg-upload')?.click()}
                                className="w-full bg-black text-white py-3 rounded-xl font-black text-xs hover:bg-brand transition-all"
                              >
                                SUBIR IMAGEN HERO (CLOUD)
                              </button>

                              <p className="text-[10px] text-gray-400 font-bold">
                                Recomendado: 1920×900 aprox, ideal &lt; 350KB (máx 600KB).
                              </p>
                            </div>

                            <div className="space-y-3">
                              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                URL actual (debe ser /images/...)
                              </label>
                              <input
                                className="w-full bg-gray-50 border-2 border-gray-100 p-3 rounded-xl text-xs outline-none"
                                value={(data.home?.heroBgImageUrl as string) || ''}
                                onChange={(e) =>
                                  updateData({
                                    ...data,
                                    home: { ...(data.home ?? {}), heroBgImageUrl: e.target.value },
                                  })
                                }
                                placeholder="/images/home/hero.jpg"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ABOUT */}
                  {activePageEditor === 'about' && (
                    <div className="p-8 bg-gray-50 rounded-3xl space-y-6">
                      <h4 className="text-xl font-black uppercase text-brand flex items-center gap-2">
                        <Type size={24} /> ABOUT
                      </h4>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase text-gray-400">
                            Título
                          </label>
                          <input
                            className="w-full bg-white border-2 p-4 rounded-xl font-black outline-none"
                            value={data.about?.title ?? ''}
                            onChange={(e) =>
                              updateData({
                                ...data,
                                about: { ...(data.about ?? {}), title: e.target.value },
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase text-gray-400">
                            Contenido
                          </label>
                          <textarea
                            className="w-full bg-white border-2 p-4 rounded-xl font-bold outline-none h-28"
                            value={data.about?.content ?? ''}
                            onChange={(e) =>
                              updateData({
                                ...data,
                                about: { ...(data.about ?? {}), content: e.target.value },
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ✅ EQUIPMENT */}
                  {activePageEditor === 'equipment' && (
                    <div className="space-y-12">
                      <div className="p-8 bg-black text-white rounded-3xl space-y-6">
                        <h4 className="text-xl font-black uppercase text-yellow-400 flex items-center gap-2">
                          <DollarSign /> Política de Precios e Instalación
                        </h4>

                        <div className="space-y-4">
                          <label className="text-[10px] uppercase font-black text-gray-500">
                            Texto sobre Instalación
                          </label>
                          <textarea
                            className="w-full bg-white/10 p-4 rounded-xl text-sm"
                            value={data.equipmentHeader?.installationInfo || ''}
                            onChange={(e) =>
                              updateData({
                                ...data,
                                equipmentHeader: {
                                  ...(data.equipmentHeader || {}),
                                  installationInfo: e.target.value,
                                },
                              })
                            }
                          />

                          <label className="text-[10px] uppercase font-black text-gray-500">
                            Texto sobre Visitas Técnicas
                          </label>
                          <textarea
                            className="w-full bg-white/10 p-4 rounded-xl text-sm"
                            value={data.equipmentHeader?.evaluationInfo || ''}
                            onChange={(e) =>
                              updateData({
                                ...data,
                                equipmentHeader: {
                                  ...(data.equipmentHeader || {}),
                                  evaluationInfo: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-8">
                        <h4 className="text-2xl font-black uppercase flex items-center gap-2 text-brand">
                          <PlusCircle /> Catálogo de Equipos
                        </h4>

                        <EquipmentAdminEditorCatalog
                          categories={data.catalog?.categories ?? []}
                          products={data.catalog?.products ?? []}
                          uploadImageToCloud={uploadImageToCloud}
                          uploadStatus={uploadStatus}
                          setUploadStatus={setUploadStatus}
                          setProducts={(nextProducts) => {
                            updateData({
                              ...data,
                              catalog: {
                                ...(data.catalog ?? { categories: [], products: [] }),
                                products: nextProducts,
                              },
                            });
                          }}
                          onSave={async (nextProducts) => {
                            const nextData = {
                              ...data,
                              catalog: {
                                ...(data.catalog ?? { categories: [], products: [] }),
                                products: nextProducts,
                              },
                            };

                            updateData(nextData);
                            await handleManualSave(nextData);
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="pt-8 flex justify-end">
                    <button
                      onClick={() => setActivePageEditor(null)}
                      className="bg-black text-white px-10 py-4 rounded-2xl font-black uppercase text-sm shadow-xl hover:bg-brand transition-all"
                    >
                      TERMINAR EDICIÓN SECCIÓN
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: WHATSAPP */}
          {activeTab === 'whatsapp' && (
            <div className="bg-white p-10 rounded-[3rem] border-4 border-black shadow-xl space-y-12 animate-in fade-in duration-500">
              <h2 className="text-3xl font-black uppercase flex items-center gap-4 text-green-500">
                <MessageCircle size={32} /> CONFIGURACIÓN DE CONTACTO DIRECTO
              </h2>

              <div className="grid md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                    <Smartphone size={14} /> WhatsApp
                  </label>
                  <input
                    className="w-full bg-gray-50 border-2 border-gray-200 p-5 rounded-2xl font-black text-2xl outline-none focus:border-green-500"
                    placeholder="+56912345678"
                    value={data.whatsappConfig?.phoneNumber ?? ''}
                    onChange={(e) =>
                      updateData({
                        ...data,
                        whatsappConfig: { ...(data.whatsappConfig ?? {}), phoneNumber: e.target.value },
                      })
                    }
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                    <Type size={14} /> Mensaje de Bienvenida
                  </label>
                  <textarea
                    className="w-full bg-gray-50 border-2 border-gray-200 p-5 rounded-2xl font-bold outline-none focus:border-green-500 h-32"
                    value={data.whatsappConfig?.welcomeMessage ?? ''}
                    onChange={(e) =>
                      updateData({
                        ...data,
                        whatsappConfig: { ...(data.whatsappConfig ?? {}), welcomeMessage: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB: AI */}
          {activeTab === 'ai' && (
            <div className="bg-white p-10 rounded-[3rem] border-4 border-black shadow-xl space-y-10 animate-in fade-in duration-500">
              <h2 className="text-3xl font-black uppercase flex items-center gap-4 text-blue-600">
                <BrainCircuit /> CONFIGURACIÓN CEREBRO IA
              </h2>

              <div className="space-y-4">
                <label className="text-xs font-black uppercase text-gray-400">
                  Instrucción del Sistema (Contexto de Ventas)
                </label>
                <textarea
                  className="w-full bg-gray-50 border-2 p-6 rounded-[2.5rem] h-64 font-medium"
                  value={data.aiSettings?.systemPrompt ?? ''}
                  onChange={(e) =>
                    updateData({
                      ...data,
                      aiSettings: { ...(data.aiSettings ?? {}), systemPrompt: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          )}

          {/* TAB: MAINTENANCE */}
          {activeTab === 'maintenance' && (
            <div className="bg-white p-12 rounded-[4rem] border-4 border-black shadow-xl space-y-12 animate-in fade-in duration-500">
              <h2 className="text-4xl font-black tracking-tighter uppercase flex items-center gap-4">
                <Database className="text-brand" size={36} /> Soporte{' '}
                <span className="text-brand">Técnico</span>
              </h2>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="p-8 bg-gray-50 rounded-[3rem] border-2 border-transparent hover:border-brand transition-all flex flex-col items-center text-center gap-4">
                  <Download className="text-brand" size={32} />
                  <h3 className="font-black tracking-tight uppercase text-sm">Descargar Copia</h3>
                  <button
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                      const link = document.createElement('a');
                      link.href = URL.createObjectURL(blob);
                      link.download = `mipymesegura_backup_${Date.now()}.json`;
                      link.click();
                    }}
                    className="w-full bg-black text-white py-3 rounded-xl font-black uppercase text-[10px] hover:bg-brand transition-all"
                  >
                    Exportar JSON
                  </button>
                </div>

                <div className="p-8 bg-gray-50 rounded-[3rem] border-2 border-transparent hover:border-blue-600 transition-all flex flex-col items-center text-center gap-4">
                  <Upload className="text-blue-600" size={32} />
                  <h3 className="font-black tracking-tight uppercase text-sm">Cargar Copia</h3>
                  <input
                    type="file"
                    accept=".json"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        try {
                          updateData(JSON.parse(ev.target?.result as string));
                          setSaveStatus('¡Restaurado!');
                          setTimeout(() => setSaveStatus(null), 3000);
                        } catch {
                          alert('Error en el archivo');
                        }
                      };
                      reader.readAsText(file);
                    }}
                    className="hidden"
                    id="import-data"
                  />
                  <button
                    onClick={() => document.getElementById('import-data')?.click()}
                    className="w-full bg-black text-white py-3 rounded-xl font-black uppercase text-[10px] hover:bg-blue-600 transition-all"
                  >
                    Importar JSON
                  </button>
                </div>

                <div className="p-8 bg-gray-50 rounded-[3rem] border-2 border-transparent hover:border-yellow-400 transition-all flex flex-col items-center text-center gap-4">
                  <Zap className="text-yellow-500" size={32} />
                  <h3 className="font-black tracking-tight uppercase text-sm">Limpiar Caché</h3>
                  <button
                    onClick={() => {
                      if (confirm('¿Resetear caché local? Se perderán cambios no guardados.')) {
                        localStorage.removeItem('site_data');
                        window.location.reload();
                      }
                    }}
                    className="w-full bg-black text-white py-3 rounded-xl font-black uppercase text-[10px] hover:bg-yellow-400 hover:text-black transition-all"
                  >
                    Reiniciar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: GITHUB */}
          {activeTab === 'github' && (
            <div className="bg-black text-white p-12 rounded-[4rem] border-4 border-yellow-400 shadow-xl space-y-8">
              <h2 className="text-3xl font-black tracking-tighter uppercase flex items-center gap-4">
                <Github className="text-yellow-400" size={32} /> GitHub{' '}
                <span className="text-yellow-400">Cloud Sync</span>
              </h2>

              <div className="grid md:grid-cols-2 gap-8">
                <input
                  className="bg-white/5 border-2 border-white/10 p-4 rounded-xl text-white outline-none focus:border-yellow-400"
                  placeholder="Token"
                  type="password"
                  value={data.githubSettings?.token ?? ''}
                  onChange={(e) =>
                    updateData({
                      ...data,
                      githubSettings: { ...(data.githubSettings ?? {}), token: e.target.value },
                    })
                  }
                />
                <input
                  className="bg-white/5 border-2 border-white/10 p-4 rounded-xl text-white outline-none focus:border-yellow-400"
                  placeholder="Owner"
                  value={data.githubSettings?.owner ?? ''}
                  onChange={(e) =>
                    updateData({
                      ...data,
                      githubSettings: { ...(data.githubSettings ?? {}), owner: e.target.value },
                    })
                  }
                />
                <input
                  className="bg-white/5 border-2 border-white/10 p-4 rounded-xl text-white outline-none focus:border-yellow-400"
                  placeholder="Repo"
                  value={data.githubSettings?.repo ?? ''}
                  onChange={(e) =>
                    updateData({
                      ...data,
                      githubSettings: { ...(data.githubSettings ?? {}), repo: e.target.value },
                    })
                  }
                />
              </div>

              <p className="text-[10px] text-white/60 font-bold">
                Nota: el guardado real lo hace el endpoint <code>/api/save-site-data</code> usando estos datos.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;

/* =======================================================================================
   EQUIPMENT ADMIN EDITOR (catalog.products)
   ======================================================================================= */

type CatalogCategory = { id: string; name: string; subcategories?: { id: string; name: string }[] };
type CatalogProduct = {
  id: string;
  name: string;
  brand: string;
  model: string;
  sku: string;
  categoryId: string;
  subcategoryId: string;
  priceNet: number;
  features: string[];
  imageUrl: string;
  datasheetUrl: string;
  videoUrl: string;
  active: boolean;
};

function EquipmentAdminEditorCatalog(props: {
  categories: CatalogCategory[];
  products: CatalogProduct[];
  setProducts: (next: CatalogProduct[]) => void;
  onSave: (next: CatalogProduct[]) => Promise<void>;
  uploadImageToCloud: (file: File, targetPath: string) => Promise<string | null>;
  uploadStatus: string | null;
  setUploadStatus: (s: string | null) => void;
}) {
  const { categories, products, setProducts, onSave, uploadImageToCloud, uploadStatus, setUploadStatus } = props;

  const [selectedId, setSelectedId] = useState<string | null>(products?.[0]?.id ?? null);
  const selected = useMemo(
    () => products.find((p) => p.id === selectedId) || null,
    [products, selectedId]
  );

  const selectedCategory = useMemo(() => {
    if (!selected) return null;
    return categories.find((c) => c.id === selected.categoryId) || null;
  }, [categories, selected]);

  const subcats = selectedCategory?.subcategories ?? [];

  const updateProduct = (patch: Partial<CatalogProduct>) => {
    if (!selected) return;
    const next = products.map((p) => (p.id === selected.id ? { ...p, ...patch } : p));
    setProducts(next);
  };

  const addNewProduct = () => {
    const firstCat = categories?.[0]?.id ?? 'camaras';
    const firstSub = categories?.[0]?.subcategories?.[0]?.id ?? '';
    const np: CatalogProduct = {
      id: `prod-${Date.now()}`,
      name: 'Nuevo Producto',
      brand: '',
      model: '',
      sku: '',
      categoryId: firstCat,
      subcategoryId: firstSub,
      priceNet: 0,
      features: [],
      imageUrl: '',
      datasheetUrl: '',
      videoUrl: '',
      active: true,
    };
    const next = [...products, np];
    setProducts(next);
    setSelectedId(np.id);
  };

  const deleteSelected = () => {
    if (!selected) return;
    const next = products.filter((p) => p.id !== selected.id);
    setProducts(next);
    setSelectedId(next?.[0]?.id ?? null);
  };

  const saveNow = async () => {
    await onSave(products);
  };

  return (
    <div className="grid gap-8">
      <div className="grid md:grid-cols-3 gap-6">
        {/* LISTA */}
        <div className="md:col-span-1 bg-gray-50 border-2 rounded-[2rem] p-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="font-black uppercase text-xs tracking-widest text-gray-500">
              Productos ({products.length})
            </div>
            <button
              onClick={addNewProduct}
              className="bg-black text-white px-4 py-2 rounded-xl font-black text-[10px] hover:bg-brand transition-all flex items-center gap-2"
            >
              <Plus size={14} /> NUEVO
            </button>
          </div>

          <div className="space-y-2 max-h-[520px] overflow-auto pr-1">
            {products.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={`w-full text-left p-3 rounded-2xl border-2 transition-all ${
                  selectedId === p.id ? 'bg-white border-brand' : 'bg-white/60 border-transparent hover:border-black'
                }`}
              >
                <div className="font-black">{p.name || 'Sin nombre'}</div>
                <div className="text-[10px] font-bold text-gray-500">
                  {p.categoryId} {p.subcategoryId ? `• ${p.subcategoryId}` : ''}
                </div>
                <div className="text-[10px] font-black">
                  {p.active ? (
                    <span className="text-green-600">Activo</span>
                  ) : (
                    <span className="text-gray-400">Inactivo</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* EDITOR */}
        <div className="md:col-span-2 space-y-6">
          {!selected ? (
            <div className="p-10 bg-white border-2 rounded-[2rem] text-gray-500 font-black">
              No hay producto seleccionado.
            </div>
          ) : (
            <>
              {/* PREVIEW */}
              <div className="p-6 bg-white border-2 rounded-[2rem] grid md:grid-cols-2 gap-6 items-center">
                <div className="space-y-2">
                  <div className="font-black text-2xl">{selected.name || 'Nuevo Producto'}</div>
                  <div className="text-xs font-bold text-gray-500">
                    {selected.brand || 'Marca'} • {selected.model || 'Modelo'} • SKU: {selected.sku || '-'}
                  </div>
                  <div className="font-black text-brand text-xl">
                    ${Number(selected.priceNet || 0).toLocaleString('es-CL')}
                  </div>
                  <div className="text-[10px] font-black text-gray-500 uppercase">
                    {selected.categoryId} {selected.subcategoryId ? `• ${selected.subcategoryId}` : ''}
                  </div>
                </div>

                <div className="w-full h-48 bg-gray-50 rounded-2xl border-2 border-dashed overflow-hidden flex items-center justify-center">
                  {selected.imageUrl ? (
                    <img src={selected.imageUrl} className="w-full h-full object-contain" alt="preview" />
                  ) : (
                    <div className="text-gray-400 font-black text-xs">SIN IMAGEN</div>
                  )}
                </div>
              </div>

              {/* FORM */}
              <div className="p-8 bg-gray-50 border-2 rounded-[2rem] space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="font-black uppercase text-xs tracking-widest text-gray-500">
                    Editando: {selected.id}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={deleteSelected}
                      className="px-4 py-2 rounded-xl font-black text-[10px] bg-white border-2 hover:border-red-500 hover:text-red-600 transition-all flex items-center gap-2"
                      title="Eliminar producto"
                    >
                      <Trash2 size={14} /> ELIMINAR
                    </button>
                    <button
                      onClick={saveNow}
                      className="px-5 py-2 rounded-xl font-black text-[10px] bg-black text-white hover:bg-brand transition-all flex items-center gap-2"
                      title="Guardar catálogo"
                    >
                      <Save size={14} /> GUARDAR
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-500">Nombre</label>
                    <input
                      className="w-full bg-white p-3 rounded-xl border-2 font-black"
                      value={selected.name || ''}
                      onChange={(e) => updateProduct({ name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-500">Precio neto</label>
                    <input
                      type="number"
                      className="w-full bg-white p-3 rounded-xl border-2 font-black"
                      value={Number(selected.priceNet || 0)}
                      onChange={(e) => updateProduct({ priceNet: Number(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-500">Marca</label>
                    <input
                      className="w-full bg-white p-3 rounded-xl border-2 font-bold"
                      value={selected.brand || ''}
                      onChange={(e) => updateProduct({ brand: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-500">Modelo</label>
                    <input
                      className="w-full bg-white p-3 rounded-xl border-2 font-bold"
                      value={selected.model || ''}
                      onChange={(e) => updateProduct({ model: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-500">SKU</label>
                    <input
                      className="w-full bg-white p-3 rounded-xl border-2 font-mono text-xs"
                      value={selected.sku || ''}
                      onChange={(e) => updateProduct({ sku: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-500">Activo</label>
                    <select
                      className="w-full bg-white p-3 rounded-xl border-2 font-black text-xs"
                      value={selected.active ? '1' : '0'}
                      onChange={(e) => updateProduct({ active: e.target.value === '1' })}
                    >
                      <option value="1">Sí, activo</option>
                      <option value="0">No, inactivo</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-500">Categoría</label>
                    <select
                      className="w-full bg-white p-3 rounded-xl border-2 font-black text-xs"
                      value={selected.categoryId || ''}
                      onChange={(e) => {
                        const newCat = e.target.value;
                        const cat = categories.find((c) => c.id === newCat);
                        const firstSub = cat?.subcategories?.[0]?.id ?? '';
                        updateProduct({ categoryId: newCat, subcategoryId: firstSub });
                      }}
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-500">Subcategoría</label>
                    <select
                      className="w-full bg-white p-3 rounded-xl border-2 font-black text-xs"
                      value={selected.subcategoryId || ''}
                      onChange={(e) => updateProduct({ subcategoryId: e.target.value })}
                    >
                      <option value="">Sin subcategoría</option>
                      {subcats.map((sc) => (
                        <option key={sc.id} value={sc.id}>
                          {sc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-500">
                    Características (una por línea)
                  </label>
                  <textarea
                    className="w-full bg-white p-3 rounded-xl border-2 font-medium text-sm min-h-[120px]"
                    value={(selected.features || []).join('\n')}
                    onChange={(e) =>
                      updateProduct({
                        features: e.target.value
                          .split('\n')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </div>

                {/* Imagen + upload */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-500">
                    Imagen (URL /images/... o URL completa)
                  </label>

                  <input
                    className="w-full bg-white p-3 rounded-xl border-2 font-mono text-xs"
                    placeholder="/images/products/camara.jpg"
                    value={selected.imageUrl || ''}
                    onChange={(e) => updateProduct({ imageUrl: e.target.value })}
                  />

                  <div className="grid md:grid-cols-2 gap-3 items-start">
                    <div className="space-y-2">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        id="catalog-image-upload"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          const maxMB = 0.6;
                          if (file.size > maxMB * 1024 * 1024) {
                            setUploadStatus(`⚠️ Muy pesada. Ideal < ${maxMB}MB`);
                            setTimeout(() => setUploadStatus(null), 3500);
                            return;
                          }

                          const ext = (() => {
                            const name = file.name.toLowerCase();
                            if (name.endsWith('.webp')) return 'webp';
                            if (name.endsWith('.png')) return 'png';
                            if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'jpg';
                            return 'jpg';
                          })();

                          const safe = (selected.name || 'producto')
                            .toString()
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, '-')
                            .replace(/^-|-$/g, '');

                          const targetPath = `public/images/products/${safe}-${Date.now()}.${ext}`;
                          const publicUrl = await uploadImageToCloud(file, targetPath);
                          if (!publicUrl) return;

                          updateProduct({ imageUrl: publicUrl });
                        }}
                      />

                      <button
                        onClick={() => document.getElementById('catalog-image-upload')?.click()}
                        className="w-full bg-black text-white py-3 rounded-xl font-black text-xs hover:bg-brand transition-all"
                      >
                        SUBIR IMAGEN (CLOUD)
                      </button>

                      {uploadStatus && (
                        <div className="text-[10px] font-black text-gray-600">{uploadStatus}</div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-500">
                        URL ficha técnica (PDF)
                      </label>
                      <input
                        className="w-full bg-white p-3 rounded-xl border-2 font-mono text-xs"
                        placeholder="https://...pdf"
                        value={selected.datasheetUrl || ''}
                        onChange={(e) => updateProduct({ datasheetUrl: e.target.value })}
                      />

                      <label className="text-[10px] font-black uppercase text-gray-500">
                        URL video (YouTube/Vimeo)
                      </label>
                      <input
                        className="w-full bg-white p-3 rounded-xl border-2 font-mono text-xs"
                        placeholder="https://youtube.com/..."
                        value={selected.videoUrl || ''}
                        onChange={(e) => updateProduct({ videoUrl: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="text-[10px] font-black text-gray-500">
                  Tip: para que se vea en todos lados, la imagen debe ser <b>/images/...</b> o una URL directa (raw), no “github.com/.../blob/...”.
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
