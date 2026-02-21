import React, { useMemo } from 'react';
import { useSiteData, useAdmin } from '../App';

type LegacyProject = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  public?: boolean;
  active?: boolean;
};

type InstalledProject = {
  id: string;
  name: string;
  location: string;
  year: string;
  description: string;
  imageUrl: string;
  tags: string[];
  public: boolean; // ✅ público/privado
};

const normalizeLegacyToInstalled = (p: LegacyProject): InstalledProject => {
  const isPublic = typeof p.public === 'boolean' ? p.public : !!p.active; // compat
  return {
    id: String(p.id ?? ''),
    name: String(p.title ?? ''),
    location: '',
    year: '',
    description: String(p.description ?? ''),
    imageUrl: String(p.imageUrl ?? ''),
    tags: [],
    public: isPublic,
  };
};

const Projects = () => {
  const { data } = useSiteData() as any;
  const { isAdmin } = useAdmin() as any;

  const page = data?.pages?.projects;

  const headerTitle =
    page?.pageTitle ??
    data?.projectsHeader?.title ??
    'PROYECTOS';

  const headerSubtitle =
    page?.pageSubtitle ??
    data?.projectsHeader?.subtitle ??
    'Trabajos realizados';

  const installedTitle =
    page?.installed?.title ??
    'Proyectos instalados';

  const installedSubtitle =
    page?.installed?.subtitle ??
    '';

  const items: InstalledProject[] = useMemo(() => {
    // ✅ nuevo
    const newItems = page?.installed?.items;
    if (Array.isArray(newItems)) {
      return newItems.map((x: any) => ({
        id: String(x.id ?? ''),
        name: String(x.name ?? 'Proyecto'),
        location: String(x.location ?? ''),
        year: String(x.year ?? ''),
        description: String(x.description ?? ''),
        imageUrl: String(x.imageUrl ?? ''),
        tags: Array.isArray(x.tags) ? x.tags.map((t: any) => String(t)) : [],
        public: typeof x.public === 'boolean' ? x.public : !!x.active, // compat
      }));
    }

    // ✅ legacy fallback
    const legacy = data?.projects;
    if (Array.isArray(legacy)) return legacy.map(normalizeLegacyToInstalled);

    return [];
  }, [data, page]);

  const visible = useMemo(() => {
    if (isAdmin) return items; // admin ve todo (incluidos privados)
    return items.filter((p) => p.public).slice(0, 5); // público ve máx 5
  }, [items, isAdmin]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div className="w-full max-w-2xl space-y-4">
          <h1 className="text-5xl font-extrabold tracking-tight mb-2 text-black">
            {headerTitle}
          </h1>
          <p className="text-xl text-gray-600">{headerSubtitle}</p>

          <div className="pt-6">
            <div className="text-2xl font-black text-black">{installedTitle}</div>
            {installedSubtitle ? (
              <div className="text-sm text-gray-500 mt-1">{installedSubtitle}</div>
            ) : null}

            {!isAdmin && (
              <div className="text-xs text-gray-400 mt-2">
                Mostrando hasta 5 proyectos públicos.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-12">
        {visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-8 text-sm text-gray-500">
            No hay proyectos públicos por mostrar todavía.
          </div>
        ) : (
          visible.map((item, idx) => (
            <div
              key={item.id}
              className={`flex flex-col md:flex-row gap-12 items-center ${
                idx % 2 !== 0 ? 'md:flex-row-reverse' : ''
              }`}
            >
              <div className="flex-1 w-full relative">
                <div className="relative overflow-hidden rounded-[2.5rem] shadow-2xl">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-[400px] object-cover"
                  />
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <h3 className="text-4xl font-extrabold text-gray-900">{item.name}</h3>

                {(item.location || item.year) && (
                  <div className="text-xs font-black uppercase tracking-widest text-gray-400">
                    {item.location ? item.location : ''}{item.location && item.year ? ' • ' : ''}{item.year ? item.year : ''}
                  </div>
                )}

                <p className="text-lg text-gray-600 italic border-l-4 border-red-600 pl-6">
                  "{item.description}"
                </p>

                {Array.isArray(item.tags) && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {item.tags.map((t) => (
                      <span
                        key={`${item.id}-${t}`}
                        className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border bg-white"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {isAdmin && (
                  <div className="pt-3 text-xs font-black">
                    Estado:{" "}
                    <span className={item.public ? "text-green-600" : "text-gray-400"}>
                      {item.public ? "PÚBLICO" : "PRIVADO"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Projects;
