import React, { useMemo, useState } from 'react';
import { useSiteData, useAdmin } from '../App';
import { Plus, Trash2, Save } from 'lucide-react';

const normalize = (s: any) =>
  String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

const Equipment = () => {
  const { data, updateData } = useSiteData();
  const { isAdmin } = useAdmin();

  const header = data.equipmentHeader;

  // ✅ Blindaje: si catalog no existe todavía, no revienta
  const catalog = data.catalog ?? { categories: [], products: [] };

  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeSubcategory, setActiveSubcategory] = useState<string>('all');

  // ---------- Header edit ----------
  const handleHeaderEdit = (field: 'title' | 'subtitle', val: string) => {
    updateData({
      ...data,
      equipmentHeader: { ...header, [field]: val },
    });
  };

  // ---------- Legacy (data.equipment) -> Product shape ----------
  const legacyEquipmentProducts = useMemo(() => {
    const legacy = Array.isArray((data as any)?.equipment) ? (data as any).equipment : [];

    const catByName = (categoryName: string) => {
      const n = normalize(categoryName);
      const found = (catalog.categories || []).find((c: any) => normalize(c?.name) === n);
      return found?.id ?? '';
    };

    return legacy.map((e: any) => {
      const categoryId = catByName(e?.category) || (catalog.categories?.[0]?.id ?? '');
      const priceNet = Number(e?.price ?? 0);

      return {
        id: String(e?.id ?? `legacy-${Date.now()}-${Math.random()}`),
        name: String(e?.title ?? 'Equipo'),
        brand: '',
        model: '',
        sku: '',
        categoryId,
        subcategoryId: '',
        priceNet,
        features: e?.description ? [String(e.description)] : [],
        imageUrl: String(e?.imageUrl ?? ''),
        datasheetUrl: String(e?.fileUrl ?? ''),
        videoUrl: String(e?.videoUrl ?? ''),
        active: true,

        // meta interna
        __source: 'legacy',
      };
    });
  }, [data, catalog.categories]);

  // ---------- Unified products (catalog.products + legacyEquipmentProducts) ----------
  const unifiedProducts = useMemo(() => {
    const catProds = Array.isArray(catalog.products) ? catalog.products : [];
    const legacyProds = legacyEquipmentProducts;

    // Dedup por nombre + modelo (igual al problema
