
import React, { useState, useRef, useEffect } from 'react';
import { useSiteData, useAdmin } from '../App';
import { 
  Layout, 
  FileText, 
  Save, 
  Trash2, 
  Plus, 
  ArrowLeft, 
  Download, 
  Upload, 
  RotateCcw, 
  Database, 
  CheckCircle, 
  HardDrive, 
  Bot, 
  Sparkles, 
  ToggleLeft, 
  ToggleRight, 
  Zap, 
  ChevronRight, 
  Star, 
  Globe, 
  Info, 
  Palette, 
  Image as ImageIcon, 
  Type,
  Pipette,
  Layers,
  Wrench,
  Github,
  Loader2,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Key as KeyIcon,
  HelpCircle,
  MousePointer2,
  Lock
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const { data, updateData } = useSiteData();
  const { isAdmin, setShowLogin } = useAdmin();
  const [activeTab, setActiveTab] = useState<'general' | 'branding' | 'pages' | 'ai' | 'maintenance' | 'github'>('general');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  // Pantalla de acceso denegado si no es admin
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

  const syncWithGitHub = async () => {
    const { token, owner, repo, branch } = data.githubSettings;
    
    if (!token || !owner || !repo) {
      alert('Por favor, completa todos los campos de configuración de GitHub.');
      return;
    }

    setIsSyncing(true);
    const fileName = 'site_data.json';
    const path = `https://api.github.com/repos/${owner}/${repo}/contents/${fileName}`;

    try {
      let sha = '';
      const getRes = await fetch(path, {
        headers: { 
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (getRes.ok) {
        const fileData = await getRes.json();
        sha = fileData.sha;
      }

      const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
      
      const putRes = await fetch(path, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Update site database - ${new Date().toLocaleString()}`,
          content: content,
          branch: branch,
          sha: sha || undefined
        })
      });

      if (putRes.ok) {
        setSaveStatus('¡Sincronizado con GitHub!');
        setTimeout(() => setSaveStatus(null), 3000);
      } else {
        const err = await putRes.json();
        throw new Error(err.message || 'Error al subir');
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleManualSave = () => {
    localStorage.setItem('site_data', JSON.stringify(data));
    setSaveStatus('¡Sistema sincronizado!');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const updateGitHubSetting = (field: string, val: string) => {
    updateData({ ...data, githubSettings: { ...data.githubSettings, [field]: val } });
  };

  const exportBackup = () => {
    const backupData = JSON.stringify(data, null, 2);
    const blob = new Blob([backupData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_mipymesegura_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target?.result as string);
          if (confirm('¿Restaurar respaldo?')) {
            updateData(importedData);
            setSaveStatus('¡Restaurado!');
            setTimeout(() => setSaveStatus(null), 3000);
          }
        } catch (err) { alert('Inválido'); }
      };
      reader.readAsText(file);
    }
  };

  const updateBranding = (field: string, val: string) => {
    updateData({ ...data, branding: { ...data.branding, [field]: val } });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => updateBranding('logoUrl', reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const addCustomPage = () => {
    const newPage = { id: Date.now().toString(), title: 'Nueva Página', content: '...', slug: `p-${Date.now()}` };
    updateData({ ...data, customPages: [...data.customPages, newPage] });
  };

  const updateCustomPage = (id: string, updates: any) => {
    updateData({
      ...data,
      customPages: data.customPages.map(p => p.id === id ? { ...p, ...updates } : p)
    });
  };

  const deleteCustomPage = (id: string) => {
    if (confirm('¿Eliminar?')) {
      updateData({ ...data, customPages: data.customPages.filter(p => p.id !== id) });
    }
  };

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
          {saveStatus && <span className="text-green-600 font-black animate-pulse bg-green-50 px-4 py-2 rounded-xl border border-green-100">{saveStatus}</span>}
          <button onClick={handleManualSave} className="bg-black text-white px-10 py-4 rounded-2xl font-black flex items-center gap-3 hover:bg-brand transition-all shadow-xl">
            <Save size={20} /> GUARDAR SISTEMA
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-10">
        <aside className="space-y-3">
          {[
            { id: 'general', label: 'Inicio', icon: Layout },
            { id: 'branding', label: 'Marca / Colores', icon: Palette },
            { id: 'pages', label: 'Sub-Páginas', icon: Layers },
            { id: 'ai', label: 'Cerebro IA', icon: Bot },
            { id: 'github', label: 'GitHub Sync', icon: Github },
            { id: 'maintenance', label: 'Soporte', icon: Wrench }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center gap-4 px-6 py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest transition-all ${activeTab === tab.id ? 'bg-brand text-white shadow-xl scale-105' : 'bg-white border-2 border-gray-100 text-gray-400 hover:border-black'}`}
            >
              <tab.icon size={20} /> {tab.label}
            </button>
          ))}
        </aside>

        <main className="md:col-span-3 space-y-10 animate-in fade-in duration-500">
          
          {/* TAB: GITHUB SYNC */}
          {activeTab === 'github' && (
            <div className="space-y-10">
              <div className="bg-white p-12 rounded-[4rem] border-4 border-brand shadow-xl space-y-10">
                <div className="text-center space-y-2">
                  <h2 className="text-4xl font-black tracking-tighter uppercase">Guía de Configuración <span className="text-brand">Final</span></h2>
                  <p className="text-gray-500 font-bold italic">Completa la vinculación con tu Token de GitHub.</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { 
                      step: "01", 
                      title: "Ficha Clásica", 
                      desc: "Selecciona 'Generar nuevo token (clásico)'.",
                      icon: KeyIcon,
                      link: "https://github.com/settings/tokens"
                    },
                    { 
                      step: "02", 
                      title: "Casilla 'repo'", 
                      desc: "Marca la primera casilla llamada 'repo' (Control total).",
                      icon: ShieldCheck
                    },
                    { 
                      step: "03", 
                      title: "Copiar ghp_", 
                      desc: "Genera el token y copia el código de inmediato.",
                      icon: ExternalLink
                    },
                    { 
                      step: "04", 
                      title: "Vincular", 
                      desc: "Pega el código ghp_... en el campo negro de abajo.",
                      icon: Github
                    }
                  ].map((item, i) => (
                    <div key={i} className="bg-gray-50 p-6 rounded-[2.5rem] border-2 border-gray-100 flex flex-col items-center text-center space-y-4 group hover:border-brand transition-all">
                      <div className="text-brand font-black text-2xl opacity-20 group-hover:opacity-100 transition-opacity">{item.step}</div>
                      <div className="bg-white p-4 rounded-2xl shadow-sm text-brand border border-gray-100">
                        <item.icon size={24} />
                      </div>
                      <h4 className="font-black uppercase text-xs tracking-widest">{item.title}</h4>
                      <p className="text-[10px] font-bold text-gray-500 leading-relaxed">{item.desc}</p>
                      {item.link && (
                        <a href={item.link} target="_blank" rel="noreferrer" className="text-[10px] font-black text-blue-600 flex items-center gap-1 hover:underline">
                          Abrir GitHub <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>

                <div className="bg-blue-600 p-8 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
                  <div className="flex items-center gap-6">
                    <div className="bg-black p-4 rounded-2xl"><KeyIcon size={32} /></div>
                    <div>
                      <h4 className="text-xl font-black uppercase">¡Marca la casilla 'repo'!</h4>
                      <p className="text-xs font-bold opacity-80">Es la primera de la lista en la pantalla de GitHub.</p>
                    </div>
                  </div>
                  <a 
                    href="https://github.com/settings/tokens/new?notes=MiPymeSegura&scopes=repo" 
                    target="_blank" 
                    rel="noreferrer"
                    className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-black flex items-center gap-3 hover:scale-105 transition-transform"
                  >
                    GENERAR MI TOKEN AHORA <MousePointer2 size={20} />
                  </a>
                </div>
              </div>

              {/* Formulario de Conexión */}
              <div className="bg-black text-white p-12 rounded-[4rem] border-4 border-yellow-400 shadow-xl space-y-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <h2 className="text-3xl font-black tracking-tighter uppercase flex items-center gap-4">
                      <Github className="text-yellow-400" size={32} /> Datos de <span className="text-yellow-400">Vinculación</span>
                  </h2>
                </div>

                <div className="grid md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        Token Secreto (ghp_...) <span className="text-[8px] bg-red-600 text-white px-2 py-0.5 rounded italic">Pégalo aquí</span>
                      </label>
                      <input 
                        type="password" 
                        className="w-full bg-white/5 border-2 border-white/10 p-4 rounded-xl outline-none focus:border-yellow-400 font-mono text-xs text-white" 
                        placeholder="ghp_xxxxxxxxxxxx"
                        value={data.githubSettings.token}
                        onChange={(e) => updateGitHubSetting('token', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        Usuario / Owner <span className="text-[8px] bg-blue-600 text-white px-2 py-0.5 rounded">marcelobarriaar-boceto</span>
                      </label>
                      <input 
                        type="text" 
                        className="w-full bg-white/5 border-2 border-white/10 p-4 rounded-xl outline-none focus:border-yellow-400 font-bold text-white" 
                        placeholder="marcelobarriaar-boceto"
                        value={data.githubSettings.owner}
                        onChange={(e) => updateGitHubSetting('owner', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        Repositorio <span className="text-[8px] bg-blue-600 text-white px-2 py-0.5 rounded">mi-pyme-segura-2026</span>
                      </label>
                      <input 
                        type="text" 
                        className="w-full bg-white/5 border-2 border-white/10 p-4 rounded-xl outline-none focus:border-yellow-400 font-bold text-white" 
                        placeholder="mi-pyme-segura-2026"
                        value={data.githubSettings.repo}
                        onChange={(e) => updateGitHubSetting('repo', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        Rama (Branch) <span className="text-[8px] bg-gray-600 text-white px-2 py-0.5 rounded">Default: main</span>
                      </label>
                      <input 
                        type="text" 
                        className="w-full bg-white/5 border-2 border-white/10 p-4 rounded-xl outline-none focus:border-yellow-400 font-bold text-white" 
                        placeholder="main"
                        value={data.githubSettings.branch}
                        onChange={(e) => updateGitHubSetting('branch', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={syncWithGitHub}
                  disabled={isSyncing}
                  className="w-full bg-yellow-400 text-black py-6 rounded-3xl font-black uppercase tracking-widest text-lg hover:bg-white transition-all flex items-center justify-center gap-4 shadow-2xl disabled:opacity-50"
                >
                  {isSyncing ? <Loader2 size={32} className="animate-spin" /> : <Github size={32} />}
                  {isSyncing ? 'VERIFICANDO...' : 'VINCULAR Y RESPALDAR AHORA'}
                </button>
              </div>
            </div>
          )}

          {/* TAB: MANTENIMIENTO */}
          {activeTab === 'maintenance' && (
            <div className="bg-white p-12 rounded-[4rem] border-4 border-black shadow-xl space-y-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <h2 className="text-4xl font-black tracking-tighter uppercase flex items-center gap-4">
                      <Database className="text-brand" size={36} /> Seguridad de <span className="text-brand">Datos</span>
                  </h2>
                </div>
                <div className="grid md:grid-cols-2 gap-10">
                  <div className="p-10 bg-gray-50 rounded-[3rem] border-4 border-transparent hover:border-brand transition-all group">
                    <Download className="text-brand mb-8" size={40} />
                    <h3 className="text-3xl font-black tracking-tight mb-4 uppercase">Descargar Copia</h3>
                    <button onClick={exportBackup} className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase text-xs hover:bg-brand transition-all">Generar Respaldo</button>
                  </div>
                  <div className="p-10 bg-gray-50 rounded-[3rem] border-4 border-transparent hover:border-blue-600 transition-all group">
                    <Upload className="text-blue-600 mb-8" size={40} />
                    <h3 className="text-3xl font-black tracking-tight mb-4 uppercase">Cargar Copia</h3>
                    <input type="file" accept=".json" onChange={handleImport} className="hidden" ref={importInputRef} />
                    <button onClick={() => importInputRef.current?.click()} className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase text-xs hover:bg-blue-600 transition-all">Seleccionar Archivo</button>
                  </div>
                </div>
            </div>
          )}

          {activeTab === 'branding' && (
            <div className="bg-white p-10 rounded-[3rem] border-4 border-brand shadow-xl space-y-10">
              <h2 className="text-3xl font-black uppercase flex items-center gap-4 text-brand"><Palette size={32} /> IDENTIDAD VISUAL</h2>
              <div className="grid md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div className="bg-gray-50 p-8 rounded-[2rem] border-2 border-dashed border-gray-200 flex flex-col items-center gap-6">
                    <div className="w-48 h-48 bg-brand rounded-3xl shadow-xl flex items-center justify-center p-6 border-2 border-gray-100">
                       <img src={data.branding.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                    </div>
                    <button onClick={() => logoInputRef.current?.click()} className="bg-black text-white px-8 py-4 rounded-xl font-black text-xs hover:bg-brand transition-all">CAMBIAR LOGO</button>
                    <input type="file" ref={logoInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
                    <div className="flex gap-4 items-center w-full">
                      <input type="color" className="w-16 h-16 rounded-xl border-4 border-white shadow-lg cursor-pointer" value={data.branding.primaryColor} onChange={(e) => updateBranding('primaryColor', e.target.value)} />
                      <button className="flex-1 bg-black text-white p-4 rounded-xl hover:bg-brand transition-all flex items-center justify-center gap-2"><Pipette size={20} /> COLOR FONDO</button>
                    </div>
                  </div>
                </div>
                <div className="space-y-8">
                  <div className="bg-gray-50 p-6 rounded-[2rem] border-2 border-gray-100 space-y-6">
                    <input type="text" className="w-full bg-white border-2 border-gray-200 p-4 rounded-2xl focus:border-brand outline-none font-black text-lg" value={data.branding.siteName} onChange={(e) => updateBranding('siteName', e.target.value)} />
                    <div className="flex gap-4 items-center">
                      <input type="color" className="w-16 h-16 rounded-xl border-4 border-white shadow-lg cursor-pointer" value={data.branding.siteNameColor} onChange={(e) => updateBranding('siteNameColor', e.target.value)} />
                      <button className="flex-1 bg-black text-white p-4 rounded-xl hover:bg-brand transition-all flex items-center justify-center gap-2"><Pipette size={20} /> COLOR TEXTO</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pages' && (
            <div className="bg-white p-10 rounded-[3rem] border-4 border-black shadow-xl space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black uppercase flex items-center gap-4"><Layers className="text-brand" size={32} /> GESTOR DE SUB-PÁGINAS</h2>
                <button onClick={addCustomPage} className="bg-black text-white px-6 py-3 rounded-2xl font-black text-xs flex items-center gap-2 hover:bg-brand transition-all"><Plus size={18} /> NUEVA PÁGINA</button>
              </div>
              <div className="space-y-6">
                {data.customPages.map(page => (
                  <div key={page.id} className="p-8 bg-gray-50 rounded-[2.5rem] border-2 border-gray-100 space-y-6 relative group">
                    <button onClick={() => deleteCustomPage(page.id)} className="absolute top-6 right-6 text-red-600 hover:scale-110 transition-transform"><Trash2 size={24} /></button>
                    <div className="grid md:grid-cols-2 gap-6">
                      <input className="w-full bg-white border-2 border-gray-200 p-4 rounded-xl font-black outline-none focus:border-brand" value={page.title} onChange={(e) => updateCustomPage(page.id, { title: e.target.value })} />
                      <input className="w-full bg-white border-2 border-gray-200 p-4 rounded-xl font-mono text-sm outline-none focus:border-brand" value={page.slug} onChange={(e) => updateCustomPage(page.id, { slug: e.target.value.toLowerCase().replace(/ /g, '-') })} />
                    </div>
                    <textarea className="w-full bg-white border-2 border-gray-200 p-6 rounded-3xl min-h-[200px] font-medium outline-none focus:border-brand" value={page.content} onChange={(e) => updateCustomPage(page.id, { content: e.target.value })} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'general' && (
            <div className="bg-white p-10 rounded-[3rem] border-4 border-black shadow-xl space-y-10">
              <h2 className="text-3xl font-black uppercase flex items-center gap-4"><Layout className="text-brand" size={32} /> TEXTOS DE MARCA</h2>
              <div className="space-y-3">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Título Principal (Hero)</label>
                <input type="text" className="w-full bg-gray-50 border-4 border-transparent p-5 rounded-3xl focus:border-black outline-none font-black text-2xl tracking-tighter" value={data.home.heroTitle} onChange={(e) => updateData({...data, home: {...data.home, heroTitle: e.target.value}})} />
              </div>
            </div>
          )}
          
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
