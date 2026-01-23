
import React, { useState, useRef } from 'react';
import { useSiteData, useAdmin } from '../App';
import { Plus, Trash2, Edit3, Save, FileText, Video, Upload, Info } from 'lucide-react';

const Equipment = () => {
  const { data, updateData } = useSiteData();
  const { isAdmin } = useAdmin();
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleHeaderEdit = (field: 'title' | 'subtitle', val: string) => {
    updateData({ ...data, equipmentHeader: { ...data.equipmentHeader, [field]: val } });
  };

  const addEquipment = () => {
    const newItem = {
      id: Date.now().toString(),
      title: 'Nuevo Equipo',
      description: 'Descripción del producto técnico...',
      imageUrl: 'https://images.unsplash.com/photo-1551703599-6b3e8379aa8b?auto=format&fit=crop&q=80&w=500',
      category: 'General'
    };
    updateData({ ...data, equipment: [newItem, ...data.equipment] });
    setEditingId(newItem.id);
  };

  const removeEquipment = (id: string) => {
    if (confirm('¿Eliminar este equipo?')) {
      updateData({ ...data, equipment: data.equipment.filter(e => e.id !== id) });
    }
  };

  const updateItem = (id: string, updates: any) => {
    updateData({
      ...data,
      equipment: data.equipment.map(e => e.id === id ? { ...e, ...updates } : e)
    });
  };

  const handleFileChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateItem(id, { imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
        <div className="max-w-2xl w-full space-y-4">
          {isAdmin ? (
            <div className="space-y-4 w-full">
              <input 
                className="text-5xl font-extrabold tracking-tight w-full bg-white text-black border-2 border-gray-200 p-2 rounded-xl outline-none focus:border-red-600"
                value={data.equipmentHeader.title}
                onChange={(e) => handleHeaderEdit('title', e.target.value)}
              />
              <input 
                className="text-xl text-black w-full bg-white border-2 border-gray-200 p-2 rounded-xl outline-none focus:border-red-600"
                value={data.equipmentHeader.subtitle}
                onChange={(e) => handleHeaderEdit('subtitle', e.target.value)}
              />
            </div>
          ) : (
            <>
              <h1 className="text-5xl font-extrabold tracking-tight mb-4 text-black">{data.equipmentHeader.title}</h1>
              <p className="text-xl text-gray-600">{data.equipmentHeader.subtitle}</p>
            </>
          )}
        </div>
        {isAdmin && (
          <button 
            onClick={addEquipment}
            className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-red-700 transition-colors shadow-lg"
          >
            <Plus size={20} /> Añadir Equipo
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {data.equipment.map((item) => (
          <div key={item.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-300">
            <div className="relative h-64 overflow-hidden">
              <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-red-600 uppercase tracking-wider">
                {item.category}
              </div>
              {isAdmin && (
                <div className="absolute bottom-4 right-4 bg-yellow-400 text-black px-3 py-1 rounded-lg font-black text-[8px] uppercase tracking-widest flex items-center gap-1 shadow-lg border border-black opacity-0 group-hover:opacity-100 transition-opacity">
                  <Info size={10} /> Sugerido: 800 x 600 px
                </div>
              )}
            </div>
            
            <div className="p-8 space-y-4">
              {editingId === item.id ? (
                <div className="space-y-3">
                  <input className="w-full border-2 p-2 rounded-lg bg-white text-black font-bold" value={item.title} onChange={(e) => updateItem(item.id, { title: e.target.value })} />
                  <input className="w-full border-2 p-2 rounded-lg bg-white text-black text-sm" value={item.category} onChange={(e) => updateItem(item.id, { category: e.target.value })} placeholder="Categoría" />
                  <textarea className="w-full border-2 p-2 rounded-lg bg-white text-black" value={item.description} onChange={(e) => updateItem(item.id, { description: e.target.value })} />
                  
                  <div className="pt-2 space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Actualizar Imagen</label>
                    <input 
                      type="file" 
                      className="hidden" 
                      id={`file-${item.id}`}
                      onChange={(e) => handleFileChange(item.id, e)}
                      accept="image/*"
                    />
                    <button 
                      onClick={() => document.getElementById(`file-${item.id}`)?.click()}
                      className="w-full flex items-center justify-center gap-2 bg-black text-white py-2 rounded-xl font-black text-xs hover:bg-red-600 transition-all"
                    >
                      <Upload size={14} /> SUBIR DE MAC
                    </button>
                    <input className="w-full border-2 p-2 rounded-lg bg-white text-black text-[10px] outline-none" value={item.imageUrl.startsWith('data:') ? 'Local' : item.imageUrl} onChange={(e) => updateItem(item.id, { imageUrl: e.target.value })} placeholder="URL alternativa" />
                  </div>

                  <button onClick={() => setEditingId(null)} className="w-full bg-green-600 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2"><Save size={16} /> Guardar</button>
                </div>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-gray-900">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.description}</p>
                  {isAdmin && (
                    <div className="flex gap-2 mt-6 pt-6 border-t border-gray-100">
                      <button onClick={() => setEditingId(item.id)} className="flex-1 bg-gray-900 text-white py-2 rounded-lg font-bold">Editar</button>
                      <button onClick={() => removeEquipment(item.id)} className="p-2 text-red-600 bg-red-50 rounded-lg"><Trash2 size={20} /></button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Equipment;
