
import React, { useState } from 'react';
import { useSiteData, useAdmin } from '../App';
import { Plus, Trash2, Edit3, Save, Upload, Info } from 'lucide-react';

const Projects = () => {
  const { data, updateData } = useSiteData();
  const { isAdmin } = useAdmin();
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleHeaderEdit = (field: 'title' | 'subtitle', val: string) => {
    updateData({ ...data, projectsHeader: { ...data.projectsHeader, [field]: val } });
  };

  const addProject = () => {
    const newItem = {
      id: Date.now().toString(),
      title: 'Nuevo Caso de Éxito',
      description: 'Describe el desafío...',
      imageUrl: 'https://images.unsplash.com/photo-1551703599-6b3e8379aa8b?auto=format&fit=crop&q=80&w=500'
    };
    updateData({ ...data, projects: [newItem, ...data.projects] });
    setEditingId(newItem.id);
  };

  const removeProject = (id: string) => {
    if (confirm('¿Eliminar este proyecto?')) {
      updateData({ ...data, projects: data.projects.filter(e => e.id !== id) });
    }
  };

  const updateItem = (id: string, updates: any) => {
    updateData({
      ...data,
      projects: data.projects.map(e => e.id === id ? { ...e, ...updates } : e)
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
        <div className="w-full max-w-2xl space-y-4">
          {isAdmin ? (
            <div className="space-y-4">
              <input 
                className="text-5xl font-extrabold tracking-tight w-full bg-white text-black border-2 border-gray-200 p-2 rounded-xl outline-none focus:border-red-600"
                value={data.projectsHeader.title}
                onChange={(e) => handleHeaderEdit('title', e.target.value)}
              />
              <input 
                className="text-xl text-black w-full bg-white border-2 border-gray-200 p-2 rounded-xl outline-none focus:border-red-600"
                value={data.projectsHeader.subtitle}
                onChange={(e) => handleHeaderEdit('subtitle', e.target.value)}
              />
            </div>
          ) : (
            <>
              <h1 className="text-5xl font-extrabold tracking-tight mb-4 text-black">{data.projectsHeader.title}</h1>
              <p className="text-xl text-gray-600">{data.projectsHeader.subtitle}</p>
            </>
          )}
        </div>
        {isAdmin && (
          <button 
            onClick={addProject}
            className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-red-700 transition-colors shadow-lg"
          >
            <Plus size={20} /> Añadir Proyecto
          </button>
        )}
      </div>

      <div className="space-y-12">
        {data.projects.map((item, idx) => (
          <div key={item.id} className={`flex flex-col md:flex-row gap-12 items-center ${idx % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}>
            <div className="flex-1 w-full relative group">
              <div className="relative overflow-hidden rounded-[2.5rem] shadow-2xl">
                <img src={item.imageUrl} alt={item.title} className="w-full h-[400px] object-cover" />
                {isAdmin && (
                  <div className="absolute top-4 left-4 bg-yellow-400 text-black px-3 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center gap-1 shadow-lg border border-black opacity-0 group-hover:opacity-100 transition-opacity">
                    <Info size={14} /> Sugerido: 1200 x 800 px
                  </div>
                )}
                {editingId === item.id && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-8">
                    <div className="bg-white p-6 rounded-3xl w-full max-w-xs space-y-4">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Actualizar Imagen</p>
                      <input 
                        type="file" 
                        className="hidden" 
                        id={`file-proj-${item.id}`}
                        onChange={(e) => handleFileChange(item.id, e)}
                        accept="image/*"
                      />
                      <button 
                        onClick={() => document.getElementById(`file-proj-${item.id}`)?.click()}
                        className="w-full flex items-center justify-center gap-2 bg-black text-white py-3 rounded-xl font-black text-xs hover:bg-red-600 transition-all"
                      >
                        <Upload size={16} /> CARGAR DESDE MAC
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 space-y-6">
              {editingId === item.id ? (
                <div className="space-y-4">
                  <input className="w-full text-4xl font-extrabold border-b-2 border-red-600 bg-white text-black" value={item.title} onChange={(e) => updateItem(item.id, { title: e.target.value })} />
                  <textarea className="w-full text-lg text-black border-2 border-gray-200 p-4 rounded bg-white" value={item.description} onChange={(e) => updateItem(item.id, { description: e.target.value })} />
                  <div className="pt-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">URL Alternativa</p>
                    <input className="w-full border-2 p-2 rounded-lg bg-white text-black text-xs" value={item.imageUrl.startsWith('data:') ? 'Local' : item.imageUrl} onChange={(e) => updateItem(item.id, { imageUrl: e.target.value })} />
                  </div>
                  <button onClick={() => setEditingId(null)} className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2"><Save size={20} /> Guardar</button>
                </div>
              ) : (
                <>
                  <h3 className="text-4xl font-extrabold text-gray-900">{item.title}</h3>
                  <p className="text-lg text-gray-600 italic border-l-4 border-red-600 pl-6">"{item.description}"</p>
                  {isAdmin && (
                    <div className="flex gap-4">
                      <button onClick={() => setEditingId(item.id)} className="bg-gray-900 text-white px-6 py-2 rounded-lg font-bold">Editar</button>
                      <button onClick={() => removeProject(item.id)} className="p-2 text-red-600 bg-red-50 rounded-lg"><Trash2 size={24} /></button>
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

export default Projects;
