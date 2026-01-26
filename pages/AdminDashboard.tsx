
import React, { useState, useRef } from 'react';
import { useSiteData, useAdmin } from '../App';
import { 
  Layout, 
  Save, 
  Plus, 
  ArrowLeft, 
  Download, 
  Upload, 
  Database, 
  Bot, 
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
  Pipette,
  CheckCircle,
  Smartphone,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const { data, updateData } = useSiteData();
  const { isAdmin, setShowLogin } = useAdmin();
  const [activeTab, setActiveTab] = useState<'branding' | 'pages' | 'whatsapp' | 'ai' | 'maintenance' | 'github'>('branding');
  const [activePageEditor, setActivePageEditor] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  if (!isAdmin) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 bg-gray-50 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-black p-10 rounded-[4rem] border-4 border-brand shadow-2xl space-y-8 max-w-md w-full">
          <div className="bg-brand text-white w-24 h-24 rounded-3xl flex items-center justify-center mx-auto shadow-xl border-4 border-white rotate-3">
            <Lock size={48} />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Área <span className="text-brand">Restringida</span></h2>
            <p className="text-gray-400 font-bold text-sm">Debes iniciar sesión con tus credenciales de seguridad para acceder al Gestor Central.</p>
          </div>
          <div className="pt-4 flex flex-col gap-4">
            <button 
              onClick={() => setShowLogin(true)}
              className="bg-brand text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-105 transition-all shadow-xl"
            >
              INICIAR SESIÓN AHORA
            </button>
            <Link to="/" className="text-gray-500 font-black text-[10px] uppercase hover:text-white transition-colors">Volver al Inicio</Link>
          </div>
        </div>
      </div>
    );
  }
  
  const handleManualSave = async () => {
    
  // 1) Guardar local (para que el admin vea al tiro el cambio)
  localStorage.setItem('site_data', JSON.stringify(data));

  // 2) Enviar a la API de Vercel para subir a GitHub
  try {
    setIsSyncing(true);
    setSaveStatus('Sincronizando con la nube...');

    const res = await fetch('/api/save-site-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await res.json();

    if (!res.ok) {
      console.error('Error API:', result);
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
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => callback(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const fonts = [
    { name: 'Inter', value: "'Inter', sans-serif" },
    { name: 'Roboto', value: "'Roboto', sans-serif" },
    { name: 'Montserrat', value: "'Montserrat', sans-serif" },
    { name: 'Playfair Display', value: "'Playfair Display', serif" },
    { name: 'Fira Code', value: "'Fira Code', monospace" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 text-black">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
        <div className="flex items-center gap-6">
          <Link to="/" className="p-3 bg-gray-100 hover:bg-black hover:text-white rounded-2xl transition-all">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-5xl font-black tracking-tighter uppercase">Gestor <span className="text-brand">Central</span></h1>
        </div>
        <div className="flex items-center gap-4">
          {saveStatus && <span className="text-green-600 font-black animate-pulse">{saveStatus}</span>}
          <button onClick={handleManualSave} className="bg-black text-white px-10 py-4 rounded-2xl font-black flex items-center gap-3 hover:bg-brand transition-all shadow-xl">
            <Save size={20} /> GUARDAR CAMBIOS
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-10">
        <aside className="space-y-3">
          {[
            { id: 'branding', label: 'Marca y Estilo', icon: Palette },
            { id: 'pages', label: 'Sub-Páginas (CMS)', icon: Layers },
            { id: 'whatsapp', label: 'WhatsApp Personal', icon: MessageCircle },
            { id: 'ai', label: 'Cerebro IA', icon: BrainCircuit },
            { id: 'github', label: 'GitHub Cloud', icon: Github },
            { id: 'maintenance', label: 'Soporte Técnico', icon: Wrench }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setActivePageEditor(null); }}
              className={`w-full flex items-center gap-4 px-6 py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest transition-all ${activeTab === tab.id ? 'bg-brand text-white shadow-xl scale-105' : 'bg-white border-2 border-gray-100 text-gray-400 hover:border-black'}`}
            >
              <tab.icon size={20} /> {tab.label}
            </button>
          ))}
        </aside>

        <main className="md:col-span-3 space-y-10 min-h-[600px]">
          
          {/* TAB: BRANDING */}
          {activeTab === 'branding' && (
            <div className="bg-white p-10 rounded-[3rem] border-4 border-black shadow-xl space-y-12 animate-in fade-in duration-500">
              <h2 className="text-3xl font-black uppercase flex items-center gap-4 text-brand"><Palette size={32} /> PERSONALIZACIÓN DE MARCA</h2>
              
              <div className="grid md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400">Nombre de la Pyme</label>
                  <input 
                    className="w-full bg-gray-50 border-2 border-gray-200 p-4 rounded-2xl font-black text-xl outline-none focus:border-brand"
                    value={data.branding.siteName}
                    onChange={(e) => updateData({...data, branding: {...data.branding, siteName: e.target.value}})}
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400">Fuente Global</label>
                  <select 
                    className="w-full bg-gray-50 border-2 border-gray-100 p-4 rounded-2xl font-bold outline-none focus:border-brand"
                    value={data.branding.fontFamily}
                    onChange={(e) => updateData({...data, branding: {...data.branding, fontFamily: e.target.value}})}
                  >
                    {fonts.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-4 gap-6">
                {[
                  { label: 'Primario', key: 'primaryColor' },
                  { label: 'Secundario', key: 'secondaryColor' },
                  { label: 'Texto', key: 'textColor' },
                  { label: 'Fondo Global', key: 'globalBackground' },
                ].map(col => (
                  <div key={col.key} className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">{col.label}</label>
                    <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border-2 border-gray-100">
                      <input 
                        type="color" 
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-none"
                        value={(data.branding as any)[col.key]}
                        onChange={(e) => updateData({...data, branding: {...data.branding, [col.key]: e.target.value}})}
                      />
                      <input 
                        type="text"
                        className="bg-transparent font-bold text-xs w-full outline-none"
                        value={(data.branding as any)[col.key]}
                        onChange={(e) => updateData({...data, branding: {...data.branding, [col.key]: e.target.value}})}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-10 pt-6">
                <div className="space-y-4">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400">Logotipo Oficial</label>
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center p-2 border-2 border-dashed border-gray-300 overflow-hidden">
                      <img src={data.branding.logoUrl} className="max-w-full max-h-full object-contain" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <input type="file" className="hidden" id="logo-upload" onChange={(e) => handleFileUpload(e, (url) => updateData({...data, branding: {...data.branding, logoUrl: url}}))} />
                      <button onClick={() => document.getElementById('logo-upload')?.click()} className="w-full bg-black text-white py-3 rounded-xl font-black text-xs hover:bg-brand transition-all">SUBIR LOGO</button>
                      <input className="w-full bg-gray-50 border-2 border-gray-100 p-2 rounded-xl text-[10px] outline-none" value={data.branding.logoUrl.startsWith('data:') ? 'Local' : data.branding.logoUrl} onChange={(e) => updateData({...data, branding: {...data.branding, logoUrl: e.target.value}})} placeholder="URL de imagen..." />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: WHATSAPP CONTROL */}
          {activeTab === 'whatsapp' && (
            <div className="bg-white p-10 rounded-[3rem] border-4 border-black shadow-xl space-y-12 animate-in fade-in duration-500">
              <h2 className="text-3xl font-black uppercase flex items-center gap-4 text-green-500"><MessageCircle size={32} /> CONFIGURACIÓN DE CONTACTO DIRECTO</h2>
              <p className="text-gray-500 font-bold">Configura el número al que se enviarán las consultas de tus clientes desde el botón flotante.</p>
              
              <div className="grid md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2"><Smartphone size={14} /> WhatsApp Personal</label>
                  <input 
                    className="w-full bg-gray-50 border-2 border-gray-200 p-5 rounded-2xl font-black text-2xl outline-none focus:border-green-500"
                    placeholder="+56912345678"
                    value={data.whatsappConfig.phoneNumber}
                    onChange={(e) => updateData({...data, whatsappConfig: {...data.whatsappConfig, phoneNumber: e.target.value}})}
                  />
                  <p className="text-[10px] font-bold text-gray-400">Incluye el código de país (ej: +569...)</p>
                </div>
                <div className="space-y-4">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2"><Type size={14} /> Mensaje de Bienvenida</label>
                  <textarea 
                    className="w-full bg-gray-50 border-2 border-gray-200 p-5 rounded-2xl font-bold outline-none focus:border-green-500 h-32"
                    value={data.whatsappConfig.welcomeMessage}
                    onChange={(e) => updateData({...data, whatsappConfig: {...data.whatsappConfig, welcomeMessage: e.target.value}})}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB: PAGES CMS */}
          {activeTab === 'pages' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="bg-white p-10 rounded-[3rem] border-4 border-black shadow-xl space-y-8">
                <div className="flex justify-between items-center">
                   <h2 className="text-3xl font-black uppercase flex items-center gap-4 text-orange-500"><Layers size={32} /> GESTOR DE SUB-PÁGINAS</h2>
                   <button 
                    onClick={() => {
                      const id = Date.now().toString();
                      const newPage = { id, title: 'Nueva Página', slug: `pagina-${id}`, content: 'Escribe aquí...', bgColor: '#FFFFFF', textColor: '#000000' };
                      updateData({...data, customPages: [...data.customPages, newPage]});
                    }}
                    className="bg-black text-white px-6 py-3 rounded-2xl font-black text-xs hover:bg-orange-500 transition-all flex items-center gap-2"
                   >
                     <Plus size={16} /> CREAR PÁGINA
                   </button>
                </div>

                <div className="grid gap-4">
                  {/* Main Pages Editors */}
                  {[
                    { id: 'home', title: 'Página de Inicio', color: 'bg-red-500' },
                    { id: 'about', title: 'Sobre Nosotros', color: 'bg-blue-500' },
                    { id: 'equipment', title: 'Equipos', color: 'bg-black' },
                    { id: 'projects', title: 'Proyectos', color: 'bg-gray-500' },
                    { id: 'design', title: 'Diseño IA', color: 'bg-purple-500' },
                    { id: 'contact', title: 'Contacto', color: 'bg-green-500' },
                  ].map(page => (
                    <button 
                      key={page.id}
                      onClick={() => setActivePageEditor(page.id)}
                      className="w-full flex items-center justify-between p-6 bg-gray-50 rounded-2xl border-2 border-transparent hover:border-black transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${page.color}`} />
                        <span className="font-black uppercase text-sm tracking-widest">{page.title}</span>
                      </div>
                      <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  ))}

                  {/* Custom Pages */}
                  {data.customPages.map(page => (
                    <div key={page.id} className="w-full flex items-center justify-between p-6 bg-white border-2 border-gray-100 rounded-2xl group">
                       <button onClick={() => setActivePageEditor(page.id)} className="flex items-center gap-4 flex-1 text-left">
                          <div className="w-3 h-3 rounded-full bg-yellow-400" />
                          <span className="font-black uppercase text-sm tracking-widest">{page.title}</span>
                          <span className="text-[10px] text-gray-400 font-bold italic">/p/{page.slug}</span>
                       </button>
                       <div className="flex items-center gap-2">
                          <button onClick={() => setActivePageEditor(page.id)} className="p-2 text-gray-400 hover:text-black transition-colors"><Settings size={18} /></button>
                          <button onClick={() => updateData({...data, customPages: data.customPages.filter(p => p.id !== page.id)})} className="p-2 text-red-400 hover:text-red-600 transition-colors"><Trash2 size={18} /></button>
                       </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* EDITOR MODAL INFERIOR (Simple CMS Overlay) */}
              {activePageEditor && (
                <div className="bg-white p-10 rounded-[3rem] border-4 border-brand shadow-2xl space-y-10 animate-in slide-in-from-top-10 duration-500">
                   <div className="flex justify-between items-center border-b-2 border-gray-100 pb-6">
                      <h3 className="text-3xl font-black uppercase">Editando: {activePageEditor.toUpperCase()}</h3>
                      <button onClick={() => setActivePageEditor(null)} className="p-2 bg-gray-100 rounded-xl hover:bg-black hover:text-white transition-all"><X size={20} /></button>
                   </div>

                   {/* Editor Condicional según página */}
                   {activePageEditor === 'home' && (
                     <div className="grid gap-8">
                       <div className="space-y-4">
                         <label className="text-xs font-black uppercase tracking-widest">Título Hero</label>
                         <textarea className="w-full bg-gray-50 p-4 border-2 rounded-xl font-black text-2xl" value={data.home.heroTitle} onChange={e => updateData({...data, home: {...data.home, heroTitle: e.target.value}})} />
                       </div>
                       <div className="space-y-4">
                         <label className="text-xs font-black uppercase tracking-widest">Subtítulo Hero</label>
                         <textarea className="w-full bg-gray-50 p-4 border-2 rounded-xl font-bold" value={data.home.heroSubtitle} onChange={e => updateData({...data, home: {...data.home, heroSubtitle: e.target.value}})} />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest">Color de Fondo Hero</label>
                            <input type="color" className="w-full h-12 rounded-xl cursor-pointer" value={data.home.heroBgColor} onChange={e => updateData({...data, home: {...data.home, heroBgColor: e.target.value}})} />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest">Color de Texto Hero</label>
                            <input type="color" className="w-full h-12 rounded-xl cursor-pointer" value={data.home.heroTextColor} onChange={e => updateData({...data, home: {...data.home, heroTextColor: e.target.value}})} />
                          </div>
                       </div>
                     </div>
                   )}

                   {/* Custom Page Editor */}
                   {data.customPages.some(p => p.id === activePageEditor) && (
                     <div className="grid gap-8">
                        <div className="space-y-4">
                          <label className="text-xs font-black uppercase tracking-widest">Título de Página</label>
                          <input className="w-full bg-gray-50 p-4 border-2 rounded-xl font-black text-xl" value={data.customPages.find(p => p.id === activePageEditor)?.title} onChange={e => updateData({...data, customPages: data.customPages.map(p => p.id === activePageEditor ? {...p, title: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')} : p)})} />
                        </div>
                        <div className="space-y-4">
                          <label className="text-xs font-black uppercase tracking-widest">Contenido (Texto Largo)</label>
                          <textarea className="w-full bg-gray-50 p-4 border-2 rounded-xl h-64 font-medium leading-relaxed" value={data.customPages.find(p => p.id === activePageEditor)?.content} onChange={e => updateData({...data, customPages: data.customPages.map(p => p.id === activePageEditor ? {...p, content: e.target.value} : p)})} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest">Color Fondo</label>
                            <input type="color" className="w-full h-12 rounded-xl cursor-pointer" value={data.customPages.find(p => p.id === activePageEditor)?.bgColor || '#FFFFFF'} onChange={e => updateData({...data, customPages: data.customPages.map(p => p.id === activePageEditor ? {...p, bgColor: e.target.value} : p)})} />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest">Color Texto</label>
                            <input type="color" className="w-full h-12 rounded-xl cursor-pointer" value={data.customPages.find(p => p.id === activePageEditor)?.textColor || '#000000'} onChange={e => updateData({...data, customPages: data.customPages.map(p => p.id === activePageEditor ? {...p, textColor: e.target.value} : p)})} />
                          </div>
                        </div>
                     </div>
                   )}

                   <div className="pt-8 border-t-2 border-gray-100 flex justify-end">
                      <button onClick={() => setActivePageEditor(null)} className="bg-brand text-white px-10 py-4 rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-xl">TERMINAR EDICIÓN</button>
                   </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: AI CEREBRO */}
          {activeTab === 'ai' && (
            <div className="bg-white p-10 rounded-[3rem] border-4 border-black shadow-xl space-y-10 animate-in fade-in duration-500">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black uppercase flex items-center gap-4 text-blue-600"><BrainCircuit size={32} /> CEREBRO INTELIGENTE</h2>
                <div className="flex items-center gap-4">
                   <span className="text-[10px] font-black uppercase text-gray-400">Estado Beta:</span>
                   <button 
                    onClick={() => updateData({...data, aiSettings: {...data.aiSettings, isBetaEnabled: !data.aiSettings.isBetaEnabled}})}
                    className={`p-1 rounded-full w-14 transition-colors ${data.aiSettings.isBetaEnabled ? 'bg-yellow-400' : 'bg-gray-200'}`}
                   >
                     <div className={`w-6 h-6 bg-white rounded-full transition-transform ${data.aiSettings.isBetaEnabled ? 'translate-x-6' : ''}`} />
                   </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <label className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><Cpu size={14}/> Modelo Principal</label>
                   <select 
                    className="w-full bg-gray-50 border-2 border-gray-100 p-4 rounded-2xl font-bold outline-none focus:border-blue-600"
                    value={data.aiSettings.selectedModel}
                    onChange={(e) => updateData({...data, aiSettings: {...data.aiSettings, selectedModel: e.target.value}})}
                   >
                     <option value="gemini-3-flash-preview">Gemini 3 Flash (Velocidad)</option>
                     <option value="gemini-3-pro-preview">Gemini 3 Pro (Razonamiento)</option>
                     <option value="gemini-2.5-flash-image">Gemini 2.5 Flash Image (Multimodal)</option>
                   </select>
                </div>

                <div className="space-y-4">
                   <label className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-brand"><Plus size={14}/> Motores Externos</label>
                   <button className="w-full bg-black text-white p-4 rounded-2xl font-black text-xs hover:bg-brand transition-all flex items-center justify-center gap-2">
                     <Zap size={16} /> ENLAZAR OTRO MOTOR
                   </button>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <label className="text-xs font-black uppercase tracking-widest">Instrucciones de Sistema</label>
                <textarea 
                  className="w-full bg-gray-50 border-2 border-gray-100 p-6 rounded-[2.5rem] min-h-[150px] font-medium outline-none focus:border-blue-600"
                  value={data.aiSettings.systemPrompt}
                  onChange={(e) => updateData({...data, aiSettings: {...data.aiSettings, systemPrompt: e.target.value}})}
                />
              </div>
            </div>
          )}

          {/* TAB: MAINTENANCE / SOPORTE */}
          {activeTab === 'maintenance' && (
            <div className="bg-white p-12 rounded-[4rem] border-4 border-black shadow-xl space-y-12 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <h2 className="text-4xl font-black tracking-tighter uppercase flex items-center gap-4">
                      <Database className="text-brand" size={36} /> Soporte <span className="text-brand">Técnico</span>
                  </h2>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="p-8 bg-gray-50 rounded-[3rem] border-2 border-transparent hover:border-brand transition-all flex flex-col items-center text-center gap-4">
                    <Download className="text-brand" size={32} />
                    <h3 className="font-black tracking-tight uppercase text-sm">Descargar Copia</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Backup total de configuración.</p>
                    <button onClick={() => {
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                      const link = document.createElement('a');
                      link.href = URL.createObjectURL(blob);
                      link.download = `mipymesegura_backup_${new Date().getTime()}.json`;
                      link.click();
                    }} className="w-full bg-black text-white py-3 rounded-xl font-black uppercase text-[10px] hover:bg-brand transition-all">Exportar JSON</button>
                  </div>
                  <div className="p-8 bg-gray-50 rounded-[3rem] border-2 border-transparent hover:border-blue-600 transition-all flex flex-col items-center text-center gap-4">
                    <Upload className="text-blue-600" size={32} />
                    <h3 className="font-black tracking-tight uppercase text-sm">Cargar Copia</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Restaurar desde un backup.</p>
                    <input type="file" accept=".json" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          try {
                            updateData(JSON.parse(e.target?.result as string));
                            setSaveStatus('¡Restaurado!');
                          } catch (err) { alert('Error en el archivo'); }
                        };
                        reader.readAsText(file);
                      }
                    }} className="hidden" id="import-data" />
                    <button onClick={() => document.getElementById('import-data')?.click()} className="w-full bg-black text-white py-3 rounded-xl font-black uppercase text-[10px] hover:bg-blue-600 transition-all">Importar JSON</button>
                  </div>
                  <div className="p-8 bg-gray-50 rounded-[3rem] border-2 border-transparent hover:border-yellow-400 transition-all flex flex-col items-center text-center gap-4">
                    <RefreshCw className="text-yellow-500" size={32} />
                    <h3 className="font-black tracking-tight uppercase text-sm">Limpiar Caché</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Resetear datos locales.</p>
                    <button onClick={() => {
                      if (confirm('¿Resetear caché local? Se perderán cambios no guardados en nube/archivo.')) {
                        localStorage.removeItem('site_data');
                        window.location.reload();
                      }
                    }} className="w-full bg-black text-white py-3 rounded-xl font-black uppercase text-[10px] hover:bg-yellow-400 hover:text-black transition-all">Reiniciar</button>
                  </div>
                </div>
            </div>
          )}

          {activeTab === 'github' && (
            <div className="bg-black text-white p-12 rounded-[4rem] border-4 border-yellow-400 shadow-xl space-y-8">
               <h2 className="text-3xl font-black tracking-tighter uppercase flex items-center gap-4">
                  <Github className="text-yellow-400" size={32} /> GitHub <span className="text-yellow-400">Cloud Sync</span>
               </h2>
               <div className="grid md:grid-cols-2 gap-8">
                 <input className="bg-white/5 border-2 border-white/10 p-4 rounded-xl text-white outline-none focus:border-yellow-400" placeholder="Token" type="password" value={data.githubSettings.token} onChange={e => updateData({...data, githubSettings: {...data.githubSettings, token: e.target.value}})} />
                 <input className="bg-white/5 border-2 border-white/10 p-4 rounded-xl text-white outline-none focus:border-yellow-400" placeholder="Owner" value={data.githubSettings.owner} onChange={e => updateData({...data, githubSettings: {...data.githubSettings, owner: e.target.value}})} />
                 <input className="bg-white/5 border-2 border-white/10 p-4 rounded-xl text-white outline-none focus:border-yellow-400" placeholder="Repo" value={data.githubSettings.repo} onChange={e => updateData({...data, githubSettings: {...data.githubSettings, repo: e.target.value}})} />
               </div>
            </div>
          )}
          
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
