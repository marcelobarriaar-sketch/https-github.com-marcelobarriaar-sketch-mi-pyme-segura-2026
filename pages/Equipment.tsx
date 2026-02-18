import React, { useEffect, useMemo, useState } from 'react';
import { useSiteData, useAdmin } from '../App';
import { Plus, Trash2, Save } from 'lucide-react';

type CatalogCategory = {
  id: string;
  name: string;
  subcategories?: { id: string; name: string }[];
};

type CatalogProduct = {
  id: string;
  name: string;

  // ✅ obligatorios (como te exige tu types.ts)
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

const normalize = (s: any) =>
  String(s ?? '')
    .toLowerCase()
    .trim();

const Equipment = () => {
  const { data, updateData } = useSiteData();
  const { isAdmin } = useAdmin();

  const header = data.equipmentHeader;

  // ✅ Blindaje: si catalog no existe todavía, no revienta
  const catalog = (data as any).catalog ?? { categories: [], products: [] };

  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeSubcategory, setActiveSubcategory] = useState<string>('all');

  /**
   * ✅ MIGRACIÓN AUTOMÁTICA (1 sola vez)
   * Pasa data.equipment (legacy) → catalog.products, y luego deja equipment=[]
   * para eliminar duplicados para siempre.
   */
  useEffect(() => {
    const legacy: any[] = Array.isArray((data as any).equipment) ? (data as any).equipment : [];
    if (!legacy.length) return;

    const alreadyMigrated = (data as any).__equipmentMigrated === true;
    if (alreadyMigrated) return;

    const categories: CatalogCategory[] = (catalog.categories ?? []) as any[];
    const existing: CatalogProduct[] = (catalog.products ?? []) as any[];

    const findCategoryIdByName = (catName: string) => {
      const target = normalize(catName);
      const match = categories.find((c) => normalize(c.name) === target);
      return match?.id ?? (categories[0]?.id ?? '');
    };

    const existsKey = (p: Partial<CatalogProduct>) => {
      const key = `${normalize(p.name)}|${normalize(p.model)}|${normalize(p.sku)}`;
      return existing.some(
        (e) => `${normalize(e.name)}|${normalize(e.model)}|${normalize(e.sku)}` === key
      );
    };

    const migrated: CatalogProduct[] = legacy
      .filter((x) => x && (x.title || x.name))
      .map((x) => {
        const name = String(x.name ?? x.title ?? 'Producto');
        const categoryId = String(x.categoryId ?? findCategoryIdByName(x.category ?? 'Cámaras'));
        const subcategoryId = String(x.subcategoryId ?? '');

        const desc = String(x.description ?? '').trim();
        const features =
          Array.isArray(x.features) ? x.features : desc ? [desc] : [];

        const prod: CatalogProduct = {
          id: String(x.id ?? `prod-${Date.now()}-${Math.random().toString(16).slice(2)}`),
          name,

          // ✅ obligatorios
          brand: String(x.brand ?? ''),
          model: String(x.model ?? ''),
          sku: String(x.sku ?? ''),

          categoryId,
          subcategoryId,

          priceNet:
            typeof x.priceNet === 'number'
              ? x.priceNet
              : typeof x.price === 'number'
              ? x.price
              : Number(x.priceNet ?? x.price ?? 0) || 0,

          features: features
            .map((f: any) => String(f ?? '').trim())
            .filter(Boolean),

          imageUrl: String(x.imageUrl ?? ''),
          datasheetUrl: String(x.datasheetUrl ?? x.fileUrl ?? ''),
          videoUrl: String(x.videoUrl ?? ''),

          active: x.active !== false
        };

        return prod;
      })
      .filter((p) => !existsKey(p));

    // Si no hay nada que agregar, igual marcamos migrado y vaciamos legacy
    updateData({
      ...(data as any),
      __equipmentMigrated: true,
      catalog: {
        ...catalog,
        products: migrated.length ? [...migrated, ...(catalog.products ?? [])] : (catalog.products ?? [])
      },
      equipment: [] // 👈 mata la fuente vieja
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Header edit ----------
  const handleHeaderEdit = (field: 'title' | 'subtitle', val: string) => {
    updateData({
      ...data,
      equipmentHeader: { ...header, [field]: val }
    });
  };

  // ---------- Products CRUD ----------
  const addProduct = () => {
    const firstCatId = String((catalog.categories?.[0] as any)?.id ?? '');

    const newProd: CatalogProduct = {
      id: `prod-${Date.now()}`,
      name: 'Nuevo Producto',

      // ✅ obligatorios
      brand: '',
      model: '',
      sku: '',

      categoryId: firstCatId,
      subcategoryId: '',

      priceNet: 0,
      features: [],
      imageUrl: '',
      datasheetUrl: '',
      videoUrl: '',
      active: true
    };

    updateData({
      ...(data as any),
      catalog: {
        ...catalog,
        products: [newProd, ...(catalog.products ?? [])]
      }
    });

    setEditingId(newProd.id);
  };

  const removeProduct = (id: string) => {
    if (!confirm('¿Eliminar producto?')) return;

    updateData({
      ...(data as any),
      catalog: {
        ...catalog,
        products: (catalog.products ?? []).filter((p: any) => p.id !== id)
      }
    });
  };

  const updateProduct = (id: string, updates: Partial<CatalogProduct>) => {
    updateData({
      ...(data as any),
      catalog: {
        ...catalog,
        products: (catalog.products ?? []).map((p: any) =>
          p.id === id ? { ...p, ...updates } : p
        )
      }
    });
  };

  // ---------- Derived ----------
  const currentCategory = useMemo(() => {
    if (activeCategory === 'all') return null;
    return (catalog.categories ?? []).find((c: any) => c.id === activeCategory) ?? null;
  }, [activeCategory, catalog.categories]);

  const filteredProducts = useMemo(() => {
    return (catalog.products ?? []).filter((p: any) => {
      if (!p) return false;
      if (!isAdmin && p.active === false) return false;

      if (activeCategory !== 'all' && p.categoryId !== activeCategory) return false;
      if (activeSubcategory !== 'all' && (p.subcategoryId || '') !== activeSubcategory) return false;

      return true;
    });
  }, [catalog.products, activeCategory, activeSubcategory, isAdmin]);

  // ---------- UI ----------
  return (
    <div className="max-w-7xl mx-auto px-4 py-20">
      {/* HEADER */}
      <div className="mb-14 space-y-4 max-w-3xl">
        {isAdmin ? (
          <>
            <input
              className="text-5xl font-extrabold w-full border-2 p-3 rounded-xl"
              value={header.title}
              onChange={(e) => handleHeaderEdit('title', e.target.value)}
            />
            <input
              className="text-xl w-full border-2 p-3 rounded-xl"
              value={header.subtitle}
              onChange={(e) => handleHeaderEdit('subtitle', e.target.value)}
            />
          </>
        ) : (
          <>
            <h1 className="text-5xl font-extrabold text-black">{header.title}</h1>
            <p className="text-xl text-gray-600">{header.subtitle}</p>
          </>
        )}

        {/* Debug solo admin */}
        {isAdmin && (
          <div className="text-[11px] text-gray-500 font-mono">
            catalog.products: {(catalog.products ?? []).length} | legacy equipment:{' '}
            {Array.isArray((data as any).equipment) ? (data as any).equipment.length : 0}
          </div>
        )}
      </div>

      {/* CATEGORY FILTER */}
      <div className="flex flex-wrap gap-3 mb-8">
        <button
          type="button"
          onClick={() => {
            setActiveCategory('all');
            setActiveSubcategory('all');
          }}
          className={`px-4 py-2 rounded-full border ${
            activeCategory === 'all' ? 'bg-black text-white' : 'bg-white'
          }`}
        >
          Todas
        </button>

        {(catalog.categories ?? []).map((cat: any) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => {
              setActiveCategory(cat.id);
              setActiveSubcategory('all');
            }}
            className={`px-4 py-2 rounded-full border ${
              activeCategory === cat.id ? 'bg-black text-white' : 'bg-white'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* SUBCATEGORY FILTER */}
      {currentCategory && (currentCategory.subcategories?.length ?? 0) > 0 && (
        <div className="flex flex-wrap gap-2 mb-10">
          <button
            type="button"
            onClick={() => setActiveSubcategory('all')}
            className={`px-3 py-1 rounded border text-sm ${
              activeSubcategory === 'all' ? 'bg-gray-900 text-white' : 'bg-white'
            }`}
          >
            Todas
          </button>

          {currentCategory.subcategories.map((sub: any) => (
            <button
              key={sub.id}
              type="button"
              onClick={() => setActiveSubcategory(sub.id)}
              className={`px-3 py-1 rounded border text-sm ${
                activeSubcategory === sub.id ? 'bg-gray-900 text-white' : 'bg-white'
              }`}
            >
              {sub.name}
            </button>
          ))}
        </div>
      )}

      {/* ADMIN ADD */}
      {isAdmin && (
        <button
          type="button"
          onClick={addProduct}
          className="mb-10 bg-red-600 text-white px-6 py-3 rounded-xl font-bold flex gap-2 items-center"
        >
          <Plus size={18} /> Añadir producto
        </button>
      )}

      {/* EMPTY STATE */}
      {filteredProducts.length === 0 && (
        <div className="border rounded-2xl p-10 bg-gray-50 text-gray-600">
          No hay productos para mostrar con este filtro.
        </div>
      )}

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProducts.map((p: CatalogProduct) => {
          const editing = editingId === p.id;

          const categoryName =
            (catalog.categories ?? []).find((c: any) => c.id === p.categoryId)?.name ?? '';

          const subcategoryName =
            (catalog.categories ?? [])
              .find((c: any) => c.id === p.categoryId)
              ?.subcategories?.find((s: any) => s.id === p.subcategoryId)?.name ?? '';

          const price = Number(p.priceNet || 0);

          return (
            <div key={p.id} className="border rounded-2xl overflow-hidden bg-white shadow-sm">
              {/* IMAGE */}
              <div className="h-56 bg-gray-100">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                    Sin imagen
                  </div>
                )}
              </div>

              <div className="p-6 space-y-3">
                {/* BADGES */}
                <div className="flex flex-wrap gap-2">
                  {categoryName && (
                    <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-gray-100">
                      {categoryName}
                    </span>
                  )}
                  {subcategoryName && (
                    <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-gray-100">
                      {subcategoryName}
                    </span>
                  )}
                  {isAdmin && p.active === false && (
                    <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-red-100 text-red-700">
                      Inactivo
                    </span>
                  )}
                </div>

                {editing ? (
                  <>
                    <input
                      className="w-full border p-2 rounded"
                      value={p.name}
                      onChange={(e) => updateProduct(p.id, { name: e.target.value })}
                      placeholder="Nombre"
                    />

                    <input
                      className="w-full border p-2 rounded"
                      value={p.brand}
                      onChange={(e) => updateProduct(p.id, { brand: e.target.value })}
                      placeholder="Marca"
                    />

                    <input
                      className="w-full border p-2 rounded"
                      value={p.model}
                      onChange={(e) => updateProduct(p.id, { model: e.target.value })}
                      placeholder="Modelo"
                    />

                    <input
                      className="w-full border p-2 rounded"
                      value={p.sku}
                      onChange={(e) => updateProduct(p.id, { sku: e.target.value })}
                      placeholder="SKU"
                    />

                    <input
                      type="number"
                      className="w-full border p-2 rounded"
                      value={price}
                      onChange={(e) => updateProduct(p.id, { priceNet: Number(e.target.value) })}
                      placeholder="Valor sin IVA"
                    />

                    <select
                      className="w-full border p-2 rounded"
                      value={p.categoryId}
                      onChange={(e) =>
                        updateProduct(p.id, {
                          categoryId: e.target.value,
                          subcategoryId: ''
                        })
                      }
                    >
                      {(catalog.categories ?? []).map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>

                    <select
                      className="w-full border p-2 rounded"
                      value={p.subcategoryId}
                      onChange={(e) => updateProduct(p.id, { subcategoryId: e.target.value })}
                    >
                      <option value="">Sin subcategoría</option>
                      {(catalog.categories ?? [])
                        .find((c: any) => c.id === p.categoryId)
                        ?.subcategories?.map((s: any) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                    </select>

                    <textarea
                      className="w-full border p-2 rounded"
                      value={(p.features ?? []).join('\n')}
                      onChange={(e) =>
                        updateProduct(p.id, {
                          features: e.target.value
                            .split('\n')
                            .map((x) => x.trim())
                            .filter(Boolean)
                        })
                      }
                      placeholder="Características (una por línea)"
                      rows={4}
                    />

                    <input
                      className="w-full border p-2 rounded"
                      value={p.imageUrl}
                      onChange={(e) => updateProduct(p.id, { imageUrl: e.target.value })}
                      placeholder="URL imagen"
                    />

                    <input
                      className="w-full border p-2 rounded"
                      value={p.datasheetUrl}
                      onChange={(e) => updateProduct(p.id, { datasheetUrl: e.target.value })}
                      placeholder="URL ficha técnica (PDF)"
                    />

                    <input
                      className="w-full border p-2 rounded"
                      value={p.videoUrl}
                      onChange={(e) => updateProduct(p.id, { videoUrl: e.target.value })}
                      placeholder="URL video (YouTube/Vimeo)"
                    />

                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={p.active !== false}
                        onChange={(e) => updateProduct(p.id, { active: e.target.checked })}
                      />
                      Producto activo
                    </label>

                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="w-full bg-green-600 text-white py-2 rounded flex gap-2 justify-center items-center"
                    >
                      <Save size={16} /> Guardar
                    </button>
                  </>
                ) : (
                  <>
                    <h3 className="font-bold text-xl text-gray-900">{p.name}</h3>

                    <p className="text-sm text-gray-600">
                      {[p.brand, p.model].filter(Boolean).join(' ')}
                    </p>

                    <p className="font-semibold">
                      ${price.toLocaleString()} <span className="text-xs text-gray-500">+ IVA</span>
                    </p>

                    {!!(p.features?.length ?? 0) && (
                      <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                        {(p.features ?? []).slice(0, 4).map((f: string, idx: number) => (
                          <li key={idx}>{f}</li>
                        ))}
                      </ul>
                    )}

                    {isAdmin && (
                      <div className="flex gap-2 pt-4">
                        <button
                          type="button"
                          onClick={() => setEditingId(p.id)}
                          className="flex-1 bg-black text-white py-2 rounded"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => removeProduct(p.id)}
                          className="p-2 bg-red-100 text-red-600 rounded"
                          aria-label="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Equipment;
