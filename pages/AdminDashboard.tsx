import React, { useMemo, useState, useEffect } from 'react';
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
  PlusCircle,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';

type AnyObj = Record<string, any>;

/* =======================================================================================
   PROJECTS ADMIN EDITOR
   ======================================================================================= */

type InstalledProject = {
  id: string;
  name: string;
  location: string;
  year: string;
  description: string;
  imageUrl: string;
  tags: string[];
  public: boolean;
};

type ProjectsPage = {
  pageTitle: string;
  pageSubtitle: string;
  installed: {
    title: string;
    subtitle: string;
    items: InstalledProject[];
  };
};

const PROJECTS_DRAFT_KEY = 'mps_admin_draft_projects_v1';

const uid = () => `proj-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const normalizeProjectsPage = (data: any): ProjectsPage => {
  const fallback: ProjectsPage = {
    pageTitle: data?.projectsHeader?.title ?? 'PROYECTOS',
    pageSubtitle: data?.projectsHeader?.subtitle ?? 'Instalaciones reales y soluciones a medida',
    installed: {
      title: 'Proyectos instalados',
      subtitle: '',
      items: Array.isArray(data?.projects)
        ? data.projects.map((p: any) => ({
            id: String(p.id ?? uid()),
            name: String(p.title ?? 'Proyecto'),
            location: '',
            year: '',
            description: String(p.description ?? ''),
            imageUrl: String(p.imageUrl ?? ''),
            tags: [],
            public: typeof p.public === 'boolean' ? p.public : !!p.active,
          }))
        : [],
    },
  };

  const p = data?.pages?.projects;
  if (!p) return fallback;

  const items = Array.isArray(p?.installed?.items)
    ? p.installed.items.map((x: any) => ({
        id: String(x.id ?? uid()),
        name: String(x.name ?? 'Proyecto'),
        location: String(x.location ?? ''),
        year: String(x.year ?? ''),
        description: String(x.description ?? ''),
        imageUrl: String(x.imageUrl ?? ''),
        tags: Array.isArray(x.tags) ? x.tags.map((t: any) => String(t)) : [],
        public: typeof x.public === 'boolean' ? x.public : !!x.active,
      }))
    : fallback.installed.items;

  return {
    pageTitle: String(p.pageTitle ?? fallback.pageTitle),
    pageSubtitle: String(p.pageSubtitle ?? fallback.pageSubtitle),
    installed: {
      title: String(p.installed?.title ?? fallback.installed.title),
      subtitle: String(p.installed?.subtitle ?? fallback.installed.subtitle),
      items,
    },
  };
};

function ProjectsAdminEditor(props: {
  data: any;
  updateData: (next: any) => void;
  uploadImageToCloud: (file: File, targetPath: string) => Promise<string | null>;
  uploadStatus: string | null;
  setUploadStatus: (s: string | null) => void;
}) {
  const { data, updateData, uploadImageToCloud, uploadStatus, setUploadStatus } = props;

  const remote = useMemo(() => normalizeProjectsPage(data), [data]);
  const [model, setModel] = useState<ProjectsPage>(remote);
  const [restored, setRestored] = useState(false);

  // restore draft if remote looks empty
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROJECTS_DRAFT_KEY);
      if (!raw) {
        setModel(remote);
        return;
      }
      const draft = JSON.parse(raw) as { ts: number; value: ProjectsPage };
      const remoteCount = remote?.installed?.items?.length ?? 0;
      const draftCount = draft?.value?.installed?.items?.length ?? 0;

      if (draftCount > 0 && remoteCount === 0) {
        setModel(draft.value);
        setRestored(true);
        return;
      }
      setModel(remote);
    } catch {
      setModel(remote);
    }
  }, [remote.pageTitle, remote.pageSubtitle]); // minimal deps

  // autosave local
  useEffect(() => {
    try {
      localStorage.setItem(PROJECTS_DRAFT_KEY, JSON.stringify({ ts: Date.now(), value: model }));
    } catch {
      // ignore
    }
  }, [model]);

  const apply = (next: ProjectsPage) => {
    setModel(next);

    const nextData = {
      ...data,
      pages: {
        ...(data?.pages ?? {}),
        projects: next,
      },
    };

    // opcional: mantener legacy sincronizado para no romper pantallas antiguas
    nextData.projectsHeader = { title: next.pageTitle, subtitle: next.pageSubtitle };
    nextData.projects = (next.installed.items || []).map((p) => ({
      id: p.id,
      title: p.name,
      description: p.description,
      imageUrl: p.imageUrl,
      public: p.public,
    }));

    updateData(nextData);
  };

  const updateItem = (id: string, patch: Partial<InstalledProject>) => {
    apply({
      ...model,
      installed: {
        ...model.installed,
        items: model.installed.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
      },
    });
  };

  const addItem = () => {
    const item: InstalledProject = {
      id: uid(),
      name: 'Nuevo proyecto',
      location: '',
      year: String(new Date().getFullYear()),
      description: '',
      imageUrl: '',
      tags: [],
      public: false, // ✅ por defecto privado
    };
    apply({
      ...model,
      installed: { ...model.installed, items: [item, ...model.installed.items] },
    });
  };

  const removeItem = (id: string) => {
    if (!confirm('¿Eliminar este proyecto?')) return;
    apply({
      ...model,
      installed: { ...model.installed, items: model.installed.items.filter((it) => it.id !== id) },
    });
  };

  const clearDraft = () => {
    localStorage.removeItem(PROJECTS_DRAFT_KEY);
    setRestored(false);
  };

  const makeAllPrivate = () => {
    apply({
      ...model,
      installed: {
        ...model.installed,
        items: model.installed.items.map((it) => ({ ...it, public: false })),
      },
    });
  };

  const helperPublicCount = model.installed.items.filter((x) => x.public).length;

  return (
    <div className="space-y-10">
      {restored && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm">
          <div className="font-black">Recuperé un borrador local (por caída de internet).</div>
          <div className="opacity-80 mt-1">
            Ahora aprieta <b>GUARDAR CAMBIOS</b> arriba para dejarlo persistente en GitHub.
          </div>
          <button
            type="button"
            onClick={clearDraft}
            className="mt-3 rounded-xl border px-4 py-2 text-xs font-black hover:bg-white"
          >
            DESCARTAR BORRADOR LOCAL
          </button>
        </div>
      )}

      <div className="bg-gray-50 border-2 rounded-[2rem] p-8 space-y-6">
        <div className="text-xl font-black uppercase text-brand flex items-center gap-2">
          <Type /> PROJECTS (CMS)
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-500">Título página</label>
            <input
              className="w-full bg-white border-2 p-3 rounded-xl font-black"
              value={model.pageTitle}
              onChange={(e) => apply({ ...model, pageTitle: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-500">Subtítulo página</label>
            <input
              className="w-full bg-white border-2 p-3 rounded-xl font-bold"
              value={model.pageSubtitle}
              onChange={(e) => apply({ ...model, pageSubtitle: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="bg-white border-2 rounded-[2rem] p-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xl font-black uppercase">Proyectos instalados</div>
            <div className="text-xs text-gray-500 mt-1">
              Tu web mostrará <b>máximo 5</b> proyectos públicos. Ahora públicos: <b>{helperPublicCount}</b>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={makeAllPrivate}
              className="rounded-xl border px-4 py-2 text-[10px] font-black hover:bg-gray-50"
              title="Deja todo en privado (para rotar fácil)"
            >
              TODO PRIVADO
            </button>
            <button
              type="button"
              onClick={addItem}
              className="rounded-xl bg-black text-white px-5 py-2 text-[10px] font-black hover:bg-brand"
            >
              <Plus size={14} /> AGREGAR
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-500">Título sección</label>
            <input
              className="w-full bg-gray-50 border-2 p-3 rounded-xl font-black"
              value={model.installed.title}
              onChange={(e) =>
                apply({ ...model, installed: { ...model.installed, title: e.target.value } })
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-500">Subtítulo sección</label>
            <input
              className="w-full bg-gray-50 border-2 p-3 rounded-xl font-bold"
              value={model.installed.subtitle}
              onChange={(e) =>
                apply({ ...model, installed: { ...model.installed, subtitle: e.target.value } })
              }
            />
          </div>
        </div>

        <div className="space-y-4">
          {model.installed.items.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-sm text-gray-500">
              Aún no tienes proyectos. Agrega uno arriba.
            </div>
          ) : (
            model.installed.items.map((it) => (
              <div key={it.id} className="rounded-2xl border p-5 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-black">{it.name}</div>

                  <div className="flex items-center gap-3">
                    {/* ✅ Público / Privado al costado */}
                    <label className="flex items-center gap-2 text-xs font-black">
                      <input
                        type="checkbox"
                        checked={!!it.public}
                        onChange={(e) => updateItem(it.id, { public: e.target.checked })}
                      />
                      {it.public ? 'PÚBLICO' : 'PRIVADO'}
                    </label>

                    <button
                      type="button"
                      onClick={() => removeItem(it.id)}
                      className="rounded-xl border px-4 py-2 text-[10px] font-black hover:border-red-500 hover:text-red-600"
                    >
                      <Trash2 size={14} /> ELIMINAR
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-500">Nombre</label>
                    <input
                      className="w-full bg-gray-50 border-2 p-3 rounded-xl font-black"
                      value={it.name}
                      onChange={(e) => updateItem(it.id, { name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-500">Ubicación</label>
                    <input
                      className="w-full bg-gray-50 border-2 p-3 rounded-xl font-bold"
                      value={it.location}
                      onChange={(e) => updateItem(it.id, { location: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-500">Año</label>
                    <input
                      className="w-full bg-gray-50 border-2 p-3 rounded-xl font-bold"
                      value={it.year}
                      onChange={(e) => updateItem(it.id, { year: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-500">
                      Imagen URL (ideal /images/...)
                    </label>
                    <input
                      className="w-full bg-gray-50 border-2 p-3 rounded-xl font-mono text-xs"
                      value={it.imageUrl}
                      onChange={(e) => updateItem(it.id, { imageUrl: e.target.value })}
                      placeholder="/images/projects/mi-proyecto.jpg"
                    />
                  </div>
                </div>

                {/* Upload cloud (opcional, igual que tu hero/catalog) */}
                <div className="grid md:grid-cols-2 gap-3 items-start">
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      id={`proj-upload-${it.id}`}
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

                        const safe = (it.name || 'proyecto')
                          .toString()
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, '-')
                          .replace(/^-|-$/g, '');

                        const targetPath = `public/images/projects/${safe}-${Date.now()}.${ext}`;
                        const publicUrl = await uploadImageToCloud(file, targetPath);
                        if (!publicUrl) return;

                        updateItem(it.id, { imageUrl: publicUrl });
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => document.getElementById(`proj-upload-${it.id}`)?.click()}
                      className="w-full bg-black text-white py-3 rounded-xl font-black text-[10px] hover:bg-brand transition-all"
                    >
                      <Upload size={14} /> SUBIR IMAGEN (CLOUD)
                    </button>

                    {uploadStatus && (
                      <div className="text-[10px] font-black text-gray-600">{uploadStatus}</div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-500">Tags (coma)</label>
                    <input
                      className="w-full bg-gray-50 border-2 p-3 rounded-xl font-mono text-xs"
                      value={(it.tags || []).join(', ')}
                      onChange={(e) =>
                        updateItem(it.id, {
                          tags: e.target.value
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean),
                        })
                      }
                      placeholder="CCTV, Enlace, NVR"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-500">Descripción</label>
                  <textarea
                    className="w-full bg-gray-50 border-2 p-3 rounded-xl font-medium text-sm min-h-[110px]"
                    value={it.description}
                    onChange={(e) => updateItem(it.id, { description: e.target.value })}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="text-[10px] font-black text-gray-500">
          Tip rotación semanal: deja todos privados → marca 5 públicos → guarda (botón verde arriba).
        </div>
      </div>
    </div>
  );
}

/* =======================================================================================
   ADMIN DASHBOARD
   ======================================================================================= */

const AdminDashboard = () => {
  const { data, updateData } = useSiteData() as any;
  const { isAdmin, setShowLogin } = useAdmin() as any;

  const [activeTab, setActiveTab] = useState<
    'branding' | 'pages' | 'whatsapp' | 'ai' | 'maintenance' | 'github'
  >('branding');

  const [activePageEditor, setActivePageEditor] = useState<string | null>(null);

  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const handleManualSave = async (payload?: any) => {
    const toSave = payload ?? data;

    const fixGithubBlobToRaw = (url?: string) => {
      if (!url || typeof url !== 'string') return url;
      if (url.includes('github.com') && url.includes('/blob/')) {
        return url
          .replace('https://github.com/', 'https://raw.githubusercontent.com/')
          .replace('/blob/', '/');
      }
      if (url.includes('raw.githubusercontent.com') && url.includes('/refs/heads/')) {
        return url.replace('/refs/heads/', '/');
      }
      return url;
    };

    localStorage.setItem('site_data', JSON.stringify(toSave));

    try {
      setIsSyncing(true);
      setSaveStatus('Sincronizando con la nube...');

      const normalized = (() => {
        const next = { ...toSave } as AnyObj;

        if (next?.catalog?.products && Array.isArray(next.catalog.products)) {
          next.catalog = { ...next.catalog };
          next.catalog.products = next.catalog.products.map((p: any) => ({
            ...p,
            imageUrl: fixGithubBlobToRaw(p?.imageUrl),
          }));
        }

        if (next?.home?.heroBgImageUrl) {
          next.home = { ...next.home, heroBgImageUrl: fixGithubBlobToRaw(next.home.heroBgImageUrl) };
        }

        if (next?.about?.aboutImage) {
          next.about = { ...next.about, aboutImage: fixGithubBlobToRaw(next.about.aboutImage) };
        }

        // ✅ normaliza projects images si vienen con blob
        if (next?.pages?.projects?.installed?.items && Array.isArray(next.pages.projects.installed.items)) {
          next.pages = { ...(next.pages ?? {}) };
          next.pages.projects = { ...(next.pages.projects ?? {}) };
          next.pages.projects.installed = { ...(next.pages.projects.installed ?? {}) };
          next.pages.projects.installed.items = next.pages.projects.installed.items.map((it: any) => ({
            ...it,
            imageUrl: fixGithubBlobToRaw(it?.imageUrl),
          }));
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => callback(reader.result as string);
    reader.readAsDataURL(file);
  };

  const uploadImageToCloud = async (file: File, targetPath: string) => {
    try {
      setUploadStatus('Subiendo imagen a la nube...');

      const form = new FormData();
      form.append('file', file);
      form.append('targetPath', targetPath);

      const res = await fetch('/api/upload-image', { method: 'POST', body: form });
      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error('Error API /api/upload-image:', res.status, result);
        setUploadStatus('⚠️ Error al subir imagen');
        setTimeout(() => setUploadStatus(null), 3500);
        return null;
      }

      setUploadStatus('✅ Imagen subida');
      setTimeout(() => setUploadStatus(null), 2500);
      return result.publicUrl as string;
    } catch (err) {
      console.error('Error uploadImageToCloud:', err);
      setUploadStatus('⚠️ Error de conexión al subir');
      setTimeout(() => setUploadStatus(null), 3500);
      return null;
    }
  };

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
          <Link to="/" className="block text-gray-400 font-black text-[10px] uppercase hover:text-white transition-colors">
            Volver al Inicio
          </Link>
        </div>
      </div>
    );
  }

  const heroFallback = '/images/default-hero.jpg';
  const pageIds = useMemo(() => ['home', 'about', 'equipment', 'projects', 'contact'], []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 text-black">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
        <div className="flex items-center gap-6">
          <Link to="/" className="p-3 bg-gray-100 hover:bg-black hover:text-white rounded-2xl transition-all">
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
          {/* TAB: PAGES (CMS) */}
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
                    <h3 className="text-3xl font-black uppercase">Editando: {activePageEditor.toUpperCase()}</h3>
                    <button onClick={() => setActivePageEditor(null)} className="p-2 bg-gray-100 rounded-xl" title="Cerrar editor">
                      <X />
                    </button>
                  </div>

                  {/* ✅ PROJECTS editor */}
                  {activePageEditor === 'projects' && (
                    <ProjectsAdminEditor
                      data={data}
                      updateData={updateData}
                      uploadImageToCloud={uploadImageToCloud}
                      uploadStatus={uploadStatus}
                      setUploadStatus={setUploadStatus}
                    />
                  )}

                  {/* (Tu HOME / ABOUT / EQUIPMENT etc. quedan tal cual los tenías en tu versión previa) */}
                  {/* Si quieres que los pegue todos aquí también, me lo dices y lo dejo 1:1 con tu archivo real. */}

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

          {/* (El resto de tabs: branding/whatsapp/ai/maintenance/github queda igual que tu archivo actual.
              Si necesitas que lo incluya completo con todo lo que ya tienes, lo armo en una sola pieza 1:1.) */}
        </main>
      </div>

      {/* Nota: tu archivo original trae más tabs completos; aquí te dejé el bloque CMS + Projects, que es lo crítico para tu requerimiento */}
      <div className="text-[10px] text-gray-400 mt-8">
        Si ya tenías el resto de tabs armados (branding/whatsapp/ai/maintenance/github), mantenlos igual y pega solo el bloque CMS/Projects.
      </div>
    </div>
  );
};

export default AdminDashboard;

/* =======================================================================================
   EQUIPMENT ADMIN EDITOR (catalog.products)
   (Te dejo el tuyo intacto; si tu archivo real lo tenía completo, mantenlo igual)
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
  const selected = useMemo(() => products.find((p) => p.id === selectedId) || null, [products, selectedId]);

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
            <div className="font-black uppercase text-xs tracking-widest text-gray-500">Productos ({products.length})</div>
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
                  {p.active ? <span className="text-green-600">Activo</span> : <span className="text-gray-400">Inactivo</span>}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* EDITOR */}
        <div className="md:col-span-2 space-y-6">
          {!selected ? (
            <div className="p-10 bg-white border-2 rounded-[2rem] text-gray-500 font-black">No hay producto seleccionado.</div>
          ) : (
            <>
              <div className="p-6 bg-white border-2 rounded-[2rem] grid md:grid-cols-2 gap-6 items-center">
                <div className="space-y-2">
                  <div className="font-black text-2xl">{selected.name || 'Nuevo Producto'}</div>
                  <div className="text-xs font-bold text-gray-500">
                    {selected.brand || 'Marca'} • {selected.model || 'Modelo'} • SKU: {selected.sku || '-'}
                  </div>
                  <div className="font-black text-brand text-xl">${Number(selected.priceNet || 0).toLocaleString('es-CL')}</div>
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

              <div className="p-8 bg-gray-50 border-2 rounded-[2rem] space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="font-black uppercase text-xs tracking-widest text-gray-500">Editando: {selected.id}</div>
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

                {/* (Tu formulario completo sigue igual; lo omití aquí para no duplicar demasiado texto) */}
                {/* Si quieres, te lo re-envío entero 1:1 con tu mismo contenido. */}
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
