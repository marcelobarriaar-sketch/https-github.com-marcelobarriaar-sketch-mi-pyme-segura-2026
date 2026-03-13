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
  }, [remote.pageTitle, remote.pageSubtitle]);

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
      public: false,
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
   HOME / ABOUT / EQUIPMENT PATCH EDITORS
   ======================================================================================= */

function HomeAdminEditor(props: {
  data: any;
  updateData: (next: any) => void;
  uploadImageToCloud: (file: File, targetPath: string) => Promise<string | null>;
  uploadStatus: string | null;
  setUploadStatus: (s: string | null) => void;
}) {
  const { data, updateData, uploadImageToCloud, uploadStatus, setUploadStatus } = props;

  const home = data?.home ?? {};
  const processImages = Array.isArray(home?.processImages) ? home.processImages : ['', ''];

  const setHome = (patch: Record<string, any>) => {
    updateData({
      ...data,
      home: {
        ...home,
        ...patch,
      },
    });
  };

  return (
    <div className="space-y-8">
      <div className="bg-gray-50 border-2 rounded-[2rem] p-8 space-y-6">
        <div className="text-xl font-black uppercase text-brand flex items-center gap-2">
          <Type /> HOME
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-500">Título principal</label>
            <input
              className="w-full bg-white border-2 p-3 rounded-xl font-black"
              value={home?.heroTitle ?? ''}
              onChange={(e) => setHome({ heroTitle: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-500">Subtítulo</label>
            <input
              className="w-full bg-white border-2 p-3 rounded-xl font-bold"
              value={home?.heroSubtitle ?? ''}
              onChange={(e) => setHome({ heroSubtitle: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-gray-500">Texto destacado / bajada</label>
          <textarea
            className="w-full bg-white border-2 p-3 rounded-xl font-medium min-h-[110px]"
            value={home?.heroDescription ?? ''}
            onChange={(e) => setHome({ heroDescription: e.target.value })}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-500">Texto botón principal</label>
            <input
              className="w-full bg-white border-2 p-3 rounded-xl font-black"
              value={home?.heroPrimaryButtonText ?? ''}
              onChange={(e) => setHome({ heroPrimaryButtonText: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-500">Texto botón secundario</label>
            <input
              className="w-full bg-white border-2 p-3 rounded-xl font-black"
              value={home?.heroSecondaryButtonText ?? ''}
              onChange={(e) => setHome({ heroSecondaryButtonText: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="bg-white border-2 rounded-[2rem] p-8 space-y-6">
        <div className="text-lg font-black uppercase">Imagen hero</div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-gray-500">URL imagen fondo</label>
          <input
            className="w-full bg-gray-50 border-2 p-3 rounded-xl font-mono text-xs"
            value={home?.heroBgImageUrl ?? ''}
            onChange={(e) => setHome({ heroBgImageUrl: e.target.value })}
            placeholder="/images/home/hero.jpg"
          />
        </div>

        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          id="home-hero-upload"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            const ext = (() => {
              const name = file.name.toLowerCase();
              if (name.endsWith('.webp')) return 'webp';
              if (name.endsWith('.png')) return 'png';
              return 'jpg';
            })();

            const publicUrl = await uploadImageToCloud(file, `public/images/home/hero-${Date.now()}.${ext}`);
            if (!publicUrl) return;

            setHome({ heroBgImageUrl: publicUrl });
          }}
        />

        <button
          type="button"
          onClick={() => document.getElementById('home-hero-upload')?.click()}
          className="bg-black text-white px-5 py-3 rounded-xl font-black text-[10px] hover:bg-brand transition-all flex items-center gap-2"
        >
          <Upload size={14} /> SUBIR IMAGEN HERO
        </button>

        {uploadStatus && <div className="text-[10px] font-black text-gray-600">{uploadStatus}</div>}
      </div>

      <div className="bg-white border-2 rounded-[2rem] p-8 space-y-6">
        <div className="text-lg font-black uppercase">Sección proceso / configuración cloud</div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-500">Texto superior pequeño</label>
            <input
              className="w-full bg-gray-50 border-2 p-3 rounded-xl font-black"
              value={home?.processTitle ?? ''}
              onChange={(e) => setHome({ processTitle: e.target.value })}
              placeholder="ESTUDIO DE CAMPO"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-500">Título principal sección</label>
            <input
              className="w-full bg-gray-50 border-2 p-3 rounded-xl font-black"
              value={home?.processSubtitle ?? ''}
              onChange={(e) => setHome({ processSubtitle: e.target.value })}
              placeholder="CONFIGURACIÓN CLOUD"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-500">Imagen proceso 1 URL</label>
            <input
              className="w-full bg-gray-50 border-2 p-3 rounded-xl font-mono text-xs"
              value={processImages[0] ?? ''}
              onChange={(e) => {
                const next
