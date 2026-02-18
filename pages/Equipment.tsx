import React, { useState } from 'react';
import { useSiteData, useAdmin } from '../App';
import { Plus, Trash2, Save } from 'lucide-react';

const Equipment = () => {
  const { data, updateData } = useSiteData();
  const { isAdmin } = useAdmin();

  const header = data.equipmentHeader;
  const catalog = data.catalog;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeSubcategory, setActiveSubcategory] = useState<string>('all');

  // ---------- Header edit ----------
  const handleHeaderEdit = (field: 'title' | 'subtitle', val: string) => {
    updateData({
      ...data,
      equipmentHeader: { ...header, [field]: val }
    });
  };

  // ---------- Products CRUD ----------
  const addProduct = () => {
    const newProd = {
      id: `prod-${Date.now()}`,
      name: 'Nuevo Producto',
      brand: '',
      model: '',
      sku: '',
      categoryId: catalog.categories[0]?.id || '',
      subcategoryId: '',
      priceNet: 0,
      features: [],
      imageUrl: '',
      datasheetUrl: '',
      videoUrl: '',
      active: true
    };

    updateData({
      ...data,
      catalog: {
        ...catalog,
        products: [newProd, ...catalog.products]
      }
    });

    setEditingId(newProd.id);
  };

  const removeProduct = (id: string) => {
    if (!confirm('¿Eliminar producto?')) return;

    updateData({
      ...data,
      catalog: {
        ...catalog,
        products: catalog.products.filter((p: any) => p.id !== id)
      }
    });
  };

  const updateProduct = (id: string, updates: any) => {
    updateData({
      ...data,
      catalog: {
        ...catalog,
        products: catalog.products.map((p: any) =>
          p.id === id ? { ...p, ...updates } : p
        )
      }
    });
  };

  // ---------- Filters ----------
  const filteredProducts = catalog.products.filter((p: any) => {
    if (!p.active && !isAdmin) return false;

    if (activeCategory !== 'all' && p.categoryId !== activeCategory) return false;
    if (activeSubcategory !== 'all' && p.subcategoryId !== activeSubcategory) return false;

    return true;
  });

  const currentCategory = catalog.categories.find(
    (c: any) => c.id === activeCategory
  );

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
            <h1 className="text-5xl font-extrabold">{header.title}</h1>
            <p className="text-xl text-gray-600">{header.subtitle}</p>
          </>
        )}
      </div>

      {/* CATEGORY FILTER */}
      <div className="flex flex-wrap gap-3 mb-8">
        <button
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

        {catalog.categories.map((cat: any) => (
          <button
            key={cat.id}
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
      {currentCategory && currentCategory.subcategories?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-10">
          <button
            onClick={() => setActiveSubcategory('all')}
            className={`px-3 py-1 rounded border text-sm ${
              activeSubcategory === 'all' ? 'bg-gray-900 text-white' : ''
            }`}
          >
            Todas
          </button>

          {currentCategory.subcategories.map((sub: any) => (
            <button
              key={sub.id}
              onClick={() => setActiveSubcategory(sub.id)}
              className={`px-3 py-1 rounded border text-sm ${
                activeSubcategory === sub.id ? 'bg-gray-900 text-white' : ''
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
          onClick={addProduct}
          className="mb-10 bg-red-600 text-white px-6 py-3 rounded-xl font-bold flex gap-2 items-center"
        >
          <Plus size={18} /> Añadir producto
        </button>
      )}

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProducts.map((p: any) => {
          const editing = editingId === p.id;

          return (
            <div key={p.id} className="border rounded-2xl overflow-hidden bg-white shadow-sm">

              {/* IMAGE */}
              <div className="h-56 bg-gray-100">
                {p.imageUrl && (
                  <img
                    src={p.imageUrl}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              <div className="p-6 space-y-3">

                {editing ? (
                  <>
                    <input className="w-full border p-2 rounded"
                      value={p.name}
                      onChange={e => updateProduct(p.id, { name: e.target.value })}
                    />

                    <input className="w-full border p-2 rounded"
                      placeholder="Marca"
                      value={p.brand}
                      onChange={e => updateProduct(p.id, { brand: e.target.value })}
                    />

                    <input className="w-full border p-2 rounded"
                      placeholder="Modelo"
                      value={p.model}
                      onChange={e => updateProduct(p.id, { model: e.target.value })}
                    />

                    <input className="w-full border p-2 rounded"
                      placeholder="SKU"
                      value={p.sku}
                      onChange={e => updateProduct(p.id, { sku: e.target.value })}
                    />

                    <input type="number" className="w-full border p-2 rounded"
                      placeholder="Valor sin IVA"
                      value={p.priceNet}
                      onChange={e => updateProduct(p.id, { priceNet: Number(e.target.value) })}
                    />

                    {/* category select */}
                    <select
                      className="w-full border p-2 rounded"
                      value={p.categoryId}
                      onChange={e =>
                        updateProduct(p.id, {
                          categoryId: e.target.value,
                          subcategoryId: ''
                        })
                      }
                    >
                      {catalog.categories.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>

                    {/* subcategory select */}
                    <select
                      className="w-full border p-2 rounded"
                      value={p.subcategoryId}
                      onChange={e =>
                        updateProduct(p.id, { subcategoryId: e.target.value })
                      }
                    >
                      <option value="">Sin subcategoría</option>
                      {catalog.categories
                        .find((c: any) => c.id === p.categoryId)
                        ?.subcategories?.map((s: any) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>

                    <input className="w-full border p-2 rounded"
                      placeholder="URL imagen"
                      value={p.imageUrl}
                      onChange={e => updateProduct(p.id, { imageUrl: e.target.value })}
                    />

                    <input className="w-full border p-2 rounded"
                      placeholder="URL ficha técnica (PDF)"
                      value={p.datasheetUrl}
                      onChange={e => updateProduct(p.id, { datasheetUrl: e.target.value })}
                    />

                    <input className="w-full border p-2 rounded"
                      placeholder="URL video"
                      value={p.videoUrl}
                      onChange={e => updateProduct(p.id, { videoUrl: e.target.value })}
                    />

                    <button
                      onClick={() => setEditingId(null)}
                      className="w-full bg-green-600 text-white py-2 rounded flex gap-2 justify-center"
                    >
                      <Save size={16}/
