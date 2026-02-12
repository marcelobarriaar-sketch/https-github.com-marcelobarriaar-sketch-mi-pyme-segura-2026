import React, { useState } from 'react';
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
  Cpu,
  RefreshCw,
  MessageCircle,
  Type,
  ChevronRight,
  Trash2,
  Settings,
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
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const { data, updateData } = useSiteData();
  const { isAdmin, setShowLogin } = useAdmin();

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
  const handleManualSave = async () => {
    // 1) Guardar local
    localStorage.setItem('site_data', JSON.stringify(data));

    // 2) Guardar nube/GitHub
    try {
      setIsSyncing(true);
      setSaveStatus('Sincronizando con la nube...');

      const res = await fetch('/api/save-site-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
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
            <span className={`font-black animate-pulse ${saveStatus.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
              {saveStatus}
            </span>
          )}

          <button
            onClick={handleManualSave}
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
          {/* TAB: BRANDING (del primer código, simple y funcional) */}
          {activeTab === 'branding' && (
            <div className="bg-white p-10 rounded-[3rem] border-4 border-black shadow-xl space-y-12 animate-in fade-in duration-500">
              <h2 className="text-3xl font-black uppercase flex items-center gap-4 text-brand">
                <Palette /> MARCA Y ESTILO
              </h2>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-gray-400">Nombre de la Pyme</label>
                  <input
                    className="w-full bg-gray-50 border-2 p-4 rounded-xl font-black text-xl outline-none focus:border-brand"
                    value={data.branding.siteName}
                    onChange={(e) =>
                      updateData({ ...data, branding: { ...data.branding, siteName: e.target.value } })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-gray-400">Color Primario</label>
                  <div className="flex gap-4 items-center">
                    <input
                      type="color"
                      className="w-12 h-12 rounded-lg cursor-pointer"
                      value={data.branding.primaryColor}
                      onChange={(e) =>
                        updateData({ ...data, branding: { ...data.branding, primaryColor: e.target.value } })
                      }
                    />
                    <span className="font-mono text-xs">{data.branding.primaryColor}</span>
                  </div>
                </div>
              </div>

              {/* Logo (base64 compat) */}
              <div className="space-y-3 pt-6 border-t border-gray-100">
                <h3 className="text-xl font-black uppercase text-gray-400 flex items-center gap-2">
                  <IconImage /> LOGO
                </h3>

                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center p-2 border-2 border-dashed border-gray-300 overflow-hidden">
                    <img src={data.branding.logoUrl} className="max-w-full max-h-full object-contain" />
                  </div>

                  <div className="flex-1">
                    <input
                      type="file"
                      className="hidden"
                      id="logo-upload"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) =>
                        handleFileUpload(e, (url) =>
                          updateData({ ...data, branding: { ...data.branding, logoUrl: url } })
                        )
                      }
                    />
                    <button
                      onClick={() => document.getElementById('logo-upload')?.click()}
                      className="bg-black text-white px-8 py-3 rounded-xl font-black text-xs hover:bg-brand transition-all flex items-center gap-2"
                    >
                      <Upload size={16} /> SUBIR LOGO (LOCAL)
                    </button>
                    <p className="text-[10px] text-gray-400 mt-2 font-black uppercase">
                      Tip: si querís que el logo sea permanente en otros dispositivos, súbelo por /api/upload-image y pega la URL /images/...
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer texts */}
              <div className="space-y-6 pt-6 border-t border-gray-100">
                <h3 className="text-xl font-black uppercase text-gray-400 flex items-center gap-2">
                  <Type /> FOOTER
                </h3>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-gray-400">Texto Principal</label>
                    <input
                      className="w-full bg-gray-50 border-2 p-4 rounded-xl font-bold outline-none focus:border-brand"
                      value={data.branding.footerText}
                      onChange={(e) =>
                        updateData({ ...data, branding: { ...data.branding, footerText: e.target.value } })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-gray-400">Razón Social / Secundario</label>
                    <input
                      className="w-full bg-gray-50 border-2 p-4 rounded-xl font-bold outline-none focus:border-brand"
                      value={data.branding.footerSubText}
                      onChange={(e) =>
                        updateData({
                          ...data,
                          branding: { ...data.branding, footerSubText: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: PAGES (merge: mantiene Home/Equipment del primer código + Hero BG cloud del segundo) */}
          {activeTab === 'pages' && (
            <div className="space-y-8">
              <div className="bg-white p-10 rounded-[3rem] border-4 border-black shadow-xl space-y-8">
                <h2 className="text-3xl font-black uppercase flex items-center gap-4 text-orange-500">
                  <Layers /> GESTOR DE CONTENIDOS
                </h2>

                <div className="grid gap-4">
                  {['home', 'about', 'equipment', 'projects', 'contact'].map((pid) => (
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
                    <h3 className="text-3xl font-black uppercase">Editando: {activePageEditor.toUpperCase()}</h3>
                    <button onClick={() => setActivePageEditor(null)} className="p-2 bg-gray-100 rounded-xl">
                      <X />
                    </button>
                  </div>

                  {/* HOME */}
                  {activePageEditor === 'home' && (
                    <div className="space-y-12">
                      {/* HERO EDITOR (primero: título/subtítulo + featuredImage) */}
                      <div className="p-8 bg-gray-50 rounded-3xl space-y-6">
                        <h4 className="text-xl font-black uppercase text-brand flex items-center gap-2">
                          <IconImage size={24} /> PORTADA (HERO)
                        </h4>

                        <div className="grid md:grid-cols-2 gap-8">
                          <div className="space-y-4">
                            <label className="text-xs font-black uppercase text-gray-400">Título Principal</label>
                            <textarea
                              className="w-full bg-white p-4 border-2 rounded-xl font-black text-2xl h-32"
                              value={data.home.heroTitle}
                              onChange={(e) =>
                                updateData({ ...data, home: { ...data.home, heroTitle: e.target.value } })
                              }
                            />
                          </div>

                          <div className="space-y-4">
                            <label className="text-xs font-black uppercase text-gray-400">Subtítulo</label>
                            <textarea
                              className="w-full bg-white p-4 border-2 rounded-xl font-bold h-32"
                              value={data.home.heroSubtitle}
                              onChange={(e) =>
                                updateData({ ...data, home: { ...data.home, heroSubtitle: e.target.value } })
                              }
                            />
                          </div>
                        </div>

                        {/* Featured image (base64 compat) */}
                        <div className="space-y-4">
                          <label className="text-xs font-black uppercase text-gray-400">Imagen de Portada (Featured)</label>
                          <div className="flex items-center gap-6">
                            <img
                              src={data.home.featuredImage}
                              className="w-40 h-24 object-cover rounded-xl border-2 border-black"
                            />
                            <div className="flex-1">
                              <input
                                type="file"
                                className="hidden"
                                id="home-featured-upload"
                                accept="image/png,image/jpeg,image/webp"
                                onChange={(e) =>
                                  handleFileUpload(e, (url) =>
                                    updateData({ ...data, home: { ...data.home, featuredImage: url } })
                                  )
                                }
                              />
                              <button
                                onClick={() => document.getElementById('home-featured-upload')?.click()}
                                className="bg-black text-white px-8 py-3 rounded-xl font-black text-xs hover:bg-brand transition-all flex items-center gap-2"
                              >
                                <Upload size={16} /> CAMBIAR FOTO (LOCAL)
                              </button>
                              <p className="text-[10px] text-gray-400 mt-2 font-black uppercase">
                                Esta opción es local/base64 (compat). Para que quede permanente: usa “Imagen de Fondo (Hero)”.
                              </p>
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
                                  src={((data.home as any).heroBgImageUrl as string) || heroFallback}
                                  className="w-full h-full object-cover"
                                  alt="Hero background preview"
                                />
                              </div>

                              {uploadStatus && (
                                <div className="text-xs font-black text-gray-600">{uploadStatus}</div>
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
                                    home: { ...(data.home as any), heroBgImageUrl: publicUrl },
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
                                value={((data.home as any).heroBgImageUrl as string) || ''}
                                onChange={(e) =>
                                  updateData({
                                    ...data,
                                    home: { ...(data.home as any), heroBgImageUrl: e.target.value },
                                  })
                                }
                                placeholder="/images/home/hero.jpg"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* FEATURES EDITOR (del primer código) */}
                      <div className="space-y-6">
                        <h4 className="text-xl font-black uppercase flex items-center gap-2 text-blue-600">
                          <Zap /> TARJETAS DE CARACTERÍSTICAS
                        </h4>

                        <div className="grid gap-6">
                          {data.home.features.map((feature: any, idx: number) => (
                            <div
                              key={feature.id}
                              className="p-8 bg-white border-2 border-gray-100 rounded-[2.5rem] shadow-sm space-y-6 relative group hover:border-brand transition-all"
                            >
                              <div className="grid md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                  <label className="text-[10px] font-black uppercase text-gray-400">Icono</label>
                                  <select
                                    className="w-full bg-gray-50 p-3 rounded-xl font-black text-xs"
                                    value={feature.icon}
                                    onChange={(e) => {
                                      const newF = [...data.home.features];
                                      newF[idx].icon = e.target.value;
                                      updateData({ ...data, home: { ...data.home, features: newF } });
                                    }}
                                  >
                                    <option value="Shield">Escudo (Seguridad)</option>
                                    <option value="Zap">Rayo (Energía)</option>
                                    <option value="Star">Estrella (Calidad)</option>
                                    <option value="Bell">Campana (Alerta)</option>
                                    <option value="Cpu">Chip (IA)</option>
                                    <option value="Globe">Mundo (Redes)</option>
                                  </select>
                                </div>

                                <div className="md:col-span-2 space-y-2">
                                  <label className="text-[10px] font-black uppercase text-gray-400">Título Tarjeta</label>
                                  <input
                                    className="w-full bg-gray-50 p-3 rounded-xl font-black uppercase tracking-tight"
                                    value={feature.title}
                                    onChange={(e) => {
                                      const newF = [...data.home.features];
                                      newF[idx].title = e.target.value;
                                      updateData({ ...data, home: { ...data.home, features: newF } });
                                    }}
                                  />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-gray-400">Descripción Corta</label>
                                <input
                                  className="w-full bg-gray-50 p-3 rounded-xl font-bold"
                                  value={feature.desc}
                                  onChange={(e) => {
                                    const newF = [...data.home.features];
                                    newF[idx].desc = e.target.value;
                                    updateData({ ...data, home: { ...data.home, features: newF } });
                                  }}
                                />
                              </div>

                              <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <label className="text-[10px] font-black uppercase text-gray-400">Etiqueta Botón</label>
                                  <input
                                    className="w-full bg-gray-50 p-3 rounded-xl font-black text-xs"
                                    value={feature.linkLabel}
                                    onChange={(e) => {
                                      const newF = [...data.home.features];
                                      newF[idx].linkLabel = e.target.value;
                                      updateData({ ...data, home: { ...data.home, features: newF } });
                                    }}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <label className="text-[10px] font-black uppercase text-gray-400">Ruta / Link</label>
                                  <input
                                    className="w-full bg-gray-50 p-3 rounded-xl font-bold text-xs"
                                    value={feature.linkUrl}
                                    onChange={(e) => {
                                      const newF = [...data.home.features];
                                      newF[idx].linkUrl = e.target.value;
                                      updateData({ ...data, home: { ...data.home, features: newF } });
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* PROCESO EDITOR (del primer código) */}
                      <div className="space-y-4">
                        <h4 className="text-xl font-black uppercase flex items-center gap-2 text-brand">
                          <ListOrdered size={24} /> NUESTRO PROCESO
                        </h4>

                        <div className="grid md:grid-cols-2 gap-4">
                          <input
                            className="w-full bg-gray-50 p-4 border-2 rounded-xl font-black"
                            value={data.home.processTitle}
                            onChange={(e) =>
                              updateData({ ...data, home: { ...data.home, processTitle: e.target.value } })
                            }
                          />
                          <input
                            className="w-full bg-gray-50 p-4 border-2 rounded-xl font-black text-brand"
                            value={data.home.processSubtitle}
                            onChange={(e) =>
                              updateData({ ...data, home: { ...data.home, processSubtitle: e.target.value } })
                            }
                          />
                        </div>

                        <div className="grid gap-4 mt-6">
                          {data.home.processSteps.map((step: any, idx: number) => (
                            <div
                              key={step.id}
                              className="p-6 bg-gray-50 rounded-3xl border-2 grid md:grid-cols-3 gap-4"
                            >
                              <input
                                className="font-black p-2 rounded-lg"
                                placeholder="Número"
                                value={step.number}
                                onChange={(e) => {
                                  const nS = [...data.home.processSteps];
                                  nS[idx].number = e.target.value;
                                  updateData({ ...data, home: { ...data.home, processSteps: nS } });
                                }}
                              />
                              <input
                                className="font-black p-2 rounded-lg col-span-2"
                                placeholder="Título Paso"
                                value={step.title}
                                onChange={(e) => {
                                  const nS = [...data.home.processSteps];
                                  nS[idx].title = e.target.value;
                                  updateData({ ...data, home: { ...data.home, processSteps: nS } });
                                }}
                              />
                              <textarea
                                className="md:col-span-3 p-2 rounded-lg text-sm font-medium"
                                placeholder="Descripción"
                                value={step.description}
                                onChange={(e) => {
                                  const nS = [...data.home.processSteps];
                                  nS[idx].description = e.target.value;
                                  updateData({ ...data, home: { ...data.home, processSteps: nS } });
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* EQUIPMENT (del primer código, intacto) */}
                  {activePageEditor === 'equipment' && (
                    <div className="space-y-12">
                      <div className="p-8 bg-black text-white rounded-3xl space-y-6">
                        <h4 className="text-xl font-black uppercase text-yellow-400 flex items-center gap-2">
                          <DollarSign /> Política de Precios e Instalación
                        </h4>

                        <div className="space-y-4">
                          <label className="text-[10px] uppercase font-black text-gray-500">Texto sobre Instalación</label>
                          <textarea
                            className="w-full bg-white/10 p-4 rounded-xl text-sm"
                            value={data.equipmentHeader.installationInfo}
                            onChange={(e) =>
                              updateData({
                                ...data,
                                equipmentHeader: { ...data.equipmentHeader, installationInfo: e.target.value },
                              })
                            }
                          />

                          <label className="text-[10px] uppercase font-black text-gray-500">Texto sobre Visitas Técnicas</label>
                          <textarea
                            className="w-full bg-white/10 p-4 rounded-xl text-sm"
                            value={data.equipmentHeader.evaluationInfo}
                            onChange={(e) =>
                              updateData({
                                ...data,
                                equipmentHeader: { ...data.equipmentHeader, evaluationInfo: e.target.value },
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-8">
                        <h4 className="text-2xl font-black uppercase flex items-center gap-2 text-brand">
                          <PlusCircle /> Catálogo de Equipos
                        </h4>

                        <div className="grid gap-8">
                          {data.equipment.map((eq: any, idx: number) => (
                            <div key={eq.id} className="p-10 bg-gray-50 rounded-[3rem] border-2 space-y-6 relative group">
                              <button
                                onClick={() => updateData({ ...data, equipment: data.equipment.filter((e: any) => e.id !== eq.id) })}
                                className="absolute top-6 right-6 text-red-400 hover:scale-110 transition-all"
                              >
                                <Trash2 />
                              </button>

                              <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                  <label className="text-[10px] font-black uppercase">Nombre / Modelo</label>
                                  <input
                                    className="w-full bg-white p-3 rounded-xl font-black"
                                    value={eq.title}
                                    onChange={(e) => {
                                      const nE = [...data.equipment];
                                      nE[idx].title = e.target.value;
                                      updateData({ ...data, equipment: nE });
                                    }}
                                  />

                                  <label className="text-[10px] font-black uppercase">Familia (Categoría)</label>
                                  <input
                                    className="w-full bg-white p-3 rounded-xl font-bold"
                                    value={eq.category}
                                    onChange={(e) => {
                                      const nE = [...data.equipment];
                                      nE[idx].category = e.target.value;
                                      updateData({ ...data, equipment: nE });
                                    }}
                                  />
                                </div>

                                <div className="space-y-4">
                                  <label className="text-[10px] font-black uppercase text-brand">Precio de Venta ($)</label>
                                  <input
                                    type="number"
                                    className="w-full bg-white p-3 rounded-xl font-black text-xl border-2 border-brand"
                                    value={eq.price}
                                    onChange={(e) => {
                                      const nE = [...data.equipment];
                                      nE[idx].price = Number(e.target.value);
                                      updateData({ ...data, equipment: nE });
                                    }}
                                  />

                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-2">
                                      <label className="text-[9px] font-black uppercase">Link Ficha (URL)</label>
                                      <input
                                        className="w-full bg-white p-2 rounded-lg text-[10px]"
                                        value={eq.fileUrl || ''}
                                        onChange={(e) => {
                                          const nE = [...data.equipment];
                                          nE[idx].fileUrl = e.target.value;
                                          updateData({ ...data, equipment: nE });
                                        }}
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <label className="text-[9px] font-black uppercase">Link Demo (URL)</label>
                                      <input
                                        className="w-full bg-white p-2 rounded-lg text-[10px]"
                                        value={eq.videoUrl || ''}
                                        onChange={(e) => {
                                          const nE = [...data.equipment];
                                          nE[idx].videoUrl = e.target.value;
                                          updateData({ ...data, equipment: nE });
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <textarea
                                className="w-full bg-white p-4 rounded-2xl text-xs font-medium h-24"
                                placeholder="Características técnicas..."
                                value={eq.description}
                                onChange={(e) => {
                                  const nE = [...data.equipment];
                                  nE[idx].description = e.target.value;
                                  updateData({ ...data, equipment: nE });
                                }}
                              />
                            </div>
                          ))}

                          <button
                            onClick={() =>
                              updateData({
                                ...data,
                                equipment: [
                                  ...data.equipment,
                                  {
                                    id: Date.now().toString(),
                                    title: 'Nuevo Equipo',
                                    category: 'Cámaras',
                                    description: '...',
                                    price: 0,
                                    fileUrl: '',
                                    videoUrl: '',
                                  },
                                ],
                              })
                            }
                            className="w-full py-10 border-4 border-dashed rounded-[3rem] text-gray-300 font-black hover:text-brand hover:border-brand transition-all"
                          >
                            <Plus size={32} className="mx-auto mb-2" /> AÑADIR EQUIPO AL CATÁLOGO
                          </button>
                        </div>
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

          {/* TAB: WHATSAPP (del segundo, simple) */}
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
                    value={data.whatsappConfig.phoneNumber}
                    onChange={(e) =>
                      updateData({
                        ...data,
                        whatsappConfig: { ...data.whatsappConfig, phoneNumber: e.target.value },
                      })
                    }
                  />
                  <p className="text-[10px] font-bold text-gray-400">Incluye el código de país (ej: +569...)</p>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                    <Type size={14} /> Mensaje de Bienvenida
                  </label>
                  <textarea
                    className="w-full bg-gray-50 border-2 border-gray-200 p-5 rounded-2xl font-bold outline-none focus:border-green-500 h-32"
                    value={data.whatsappConfig.welcomeMessage}
                    onChange={(e) =>
                      updateData({
                        ...data,
                        whatsappConfig: { ...data.whatsappConfig, welcomeMessage: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB: AI (del primero) */}
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
                  value={data.aiSettings.systemPrompt}
                  onChange={(e) =>
                    updateData({ ...data, aiSettings: { ...data.aiSettings, systemPrompt: e.target.value } })
                  }
                />
              </div>
            </div>
          )}

          {/* TAB: MAINTENANCE (del segundo) */}
          {activeTab === 'maintenance' && (
            <div className="bg-white p-12 rounded-[4rem] border-4 border-black shadow-xl space-y-12 animate-in fade-in duration-500">
              <h2 className="text-4xl font-black tracking-tighter uppercase flex items-center gap-4">
                <Database className="text-brand" size={36} /> Soporte <span className="text-brand">Técnico</span>
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
                  <RefreshCw className="text-yellow-500" size={32} />
                  <h3 className="font-black tracking-tight uppercase text-sm">Limpiar Caché</h3>
                  <button
                    onClick={() => {
                      if (confirm('¿Resetear caché local? Se perderán cambios no guardados en nube/archivo.')) {
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

          {/* TAB: GITHUB (del segundo) */}
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
                  value={data.githubSettings.token}
                  onChange={(e) =>
                    updateData({ ...data, githubSettings: { ...data.githubSettings, token: e.target.value } })
                  }
                />
                <input
                  className="bg-white/5 border-2 border-white/10 p-4 rounded-xl text-white outline-none focus:border-yellow-400"
                  placeholder="Owner"
                  value={data.githubSettings.owner}
                  onChange={(e) =>
                    updateData({ ...data, githubSettings: { ...data.githubSettings, owner: e.target.value } })
                  }
                />
                <input
                  className="bg-white/5 border-2 border-white/10 p-4 rounded-xl text-white outline-none focus:border-yellow-400"
                  placeholder="Repo"
                  value={data.githubSettings.repo}
                  onChange={(e) =>
                    updateData({ ...data, githubSettings: { ...data.githubSettings, repo: e.target.value } })
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

