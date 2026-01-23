
import React, { useRef } from 'react';
import { useSiteData, useAdmin } from '../App';
import { ArrowRight, Shield, Settings, Users, Star, Zap, Upload, Info, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
  const { data, updateData } = useSiteData();
  const { isAdmin } = useAdmin();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEdit = (field: 'heroTitle' | 'heroSubtitle' | 'featuredImage', val: string) => {
    updateData({ ...data, home: { ...data.home, [field]: val } });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleEdit('featuredImage', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Función para resaltar palabras clave en el subtítulo
  const highlightText = (text: string) => {
    const keywords = ["tecnología de vanguardia", "sistemas autónomos"];
    let highlighted = text;
    
    // Si es admin, mostramos el texto plano para editar, si no, aplicamos el resaltado
    return text.split(new RegExp(`(${keywords.join('|')})`, 'gi')).map((part, i) => 
      keywords.some(k => k.toLowerCase() === part.toLowerCase()) 
        ? <span key={i} className="text-yellow-400 font-bold">{part}</span> 
        : part
    );
  };

  return (
    <div className="space-y-0 pb-0">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center overflow-hidden bg-gray-900">
        <div className="absolute inset-0 z-0">
          <img 
            src={data.home.featuredImage} 
            alt="Hero Background" 
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        </div>

        {isAdmin && (
          <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
            <div className="bg-yellow-400 text-black px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2 border-2 border-black animate-in fade-in slide-in-from-top-2">
              <span className="animate-pulse">●</span> Edición en Vivo Activa
            </div>
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange}
              accept="image/*"
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-white/10 backdrop-blur-md text-white border border-white/20 p-4 rounded-2xl flex items-center gap-3 font-black text-xs hover:bg-brand hover:border-brand transition-all"
            >
              <Upload size={18} /> CAMBIAR FONDO
            </button>
          </div>
        )}
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white w-full">
          <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
            
            {/* Badge Mejorado */}
            <div className="inline-flex items-center gap-3 bg-black/40 backdrop-blur-md border border-white/10 px-6 py-2 rounded-full font-black text-[10px] md:text-xs uppercase tracking-[0.2em] shadow-2xl">
              <Shield size={16} className="text-brand" /> 
              <span>SISTEMA DE PROTECCIÓN <span className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]">PROFESIONAL</span></span>
            </div>

            {isAdmin ? (
              <textarea
                value={data.home.heroTitle}
                onChange={(e) => handleEdit('heroTitle', e.target.value)}
                className="w-full bg-white/5 text-4xl md:text-6xl font-black border-4 border-brand p-6 rounded-[3rem] outline-none text-white tracking-tighter"
              />
            ) : (
              <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tighter uppercase max-w-3xl drop-shadow-2xl">
                {data.home.heroTitle.split(' ').map((word, i) => (
                  <span key={i} className={i % 2 === 1 ? 'text-brand' : ''}>{word} </span>
                ))}
              </h1>
            )}
            
            {isAdmin ? (
              <textarea
                value={data.home.heroSubtitle}
                onChange={(e) => handleEdit('heroSubtitle', e.target.value)}
                className="w-full bg-white/5 text-lg text-gray-300 border-2 border-white/20 p-6 rounded-3xl outline-none"
              />
            ) : (
              <p className="text-lg md:text-2xl text-gray-200 font-medium max-w-2xl border-l-4 border-brand pl-6 leading-relaxed drop-shadow-lg">
                {highlightText(data.home.heroSubtitle)}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-6 pt-4">
              <Link to="/create-project" className="bg-brand hover:bg-white hover:text-brand text-white px-10 py-5 rounded-[2rem] font-black text-xl flex items-center justify-center gap-3 transition-all transform hover:scale-105 shadow-2xl shadow-brand/30">
                DISEÑAR PROYECTO <ArrowRight size={24} />
              </Link>
              <Link to="/equipment" className="bg-white/10 backdrop-blur-xl hover:bg-white hover:text-black text-white px-10 py-5 rounded-[2rem] font-black text-xl border-2 border-white/20 transition-all text-center">
                CATÁLOGO
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="relative z-20 -mt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-3 gap-8">
        {[
          { icon: Shield, title: "Máxima Seguridad", color: "text-brand", bg: "bg-brand/5", desc: "Monitoreo 24/7 con sistemas anti-sabotaje integrados." },
          { icon: Zap, title: "Energía Solar", color: "text-yellow-400", bg: "bg-yellow-400/5", desc: "Independencia eléctrica absoluta para zonas rurales extremas." },
          { icon: Star, title: "Inteligencia IA", color: "text-blue-600", bg: "bg-blue-600/5", desc: "Análisis predictivo de movimiento para evitar falsas alarmas." }
        ].map((item, i) => (
          <div key={i} className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-50 space-y-6 hover:-translate-y-2 transition-all duration-300 group relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-brand opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className={`${item.bg} w-20 h-20 rounded-2xl flex items-center justify-center group-hover:rotate-3 transition-transform`}>
              <item.icon className={`${item.color}`} size={40} />
            </div>
            <div className="space-y-3">
              <h3 className="text-3xl font-black text-black tracking-tight uppercase leading-none">{item.title}</h3>
              <p className="text-gray-500 font-semibold leading-snug text-base">{item.desc}</p>
            </div>
            <div className="pt-2 flex items-center gap-2 text-brand font-black text-xs uppercase tracking-widest">
              Saber más <ArrowRight size={12} />
            </div>
          </div>
        ))}
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-10">
            <div className="space-y-4">
              <span className="text-brand font-black uppercase tracking-widest text-sm">Nuestro Proceso</span>
              <h2 className="text-5xl font-black text-black tracking-tighter leading-none uppercase">TRANQUILIDAD <br/>SIN <span className="text-brand">EXCUSAS</span></h2>
            </div>
            <div className="space-y-6">
              {[
                { t: "Estudio de Campo", d: "Analizamos los puntos ciegos de tu propiedad vía satélite o presencial." },
                { t: "Configuración Cloud", d: "Acceso total a tus cámaras desde cualquier parte del mundo." },
                { t: "Instalación Certificada", d: "Expertos locales que conocen el terreno y tus necesidades." }
              ].map((feat, i) => (
                <div key={i} className="flex gap-6 group">
                  <div className="bg-black text-white w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl shrink-0 group-hover:bg-brand transition-colors">
                    {i+1}
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xl font-black text-black uppercase">{feat.t}</h4>
                    <p className="text-gray-500 font-medium leading-relaxed">{feat.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
             <div className="absolute -inset-10 bg-brand/5 rounded-full blur-[80px]" />
             <div className="relative grid grid-cols-2 gap-4">
                <img src="https://images.unsplash.com/photo-1551703599-6b3e8379aa8b?auto=format&fit=crop&q=80&w=600" className="rounded-[2.5rem] shadow-xl mt-10 hover:scale-105 transition-transform" alt="Security Cam" />
                <img src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=600" className="rounded-[2.5rem] shadow-xl -mt-10 hover:scale-105 transition-transform" alt="Installer" />
             </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-black py-20 border-y-4 border-brand">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-10 text-center">
          {[
            { n: "+500", t: "PYMES PROTEGIDAS" },
            { n: "100%", n2: "AUTÓNOMO", t: "SOLAR READY" },
            { n: "24/7", t: "MONITOREO CLOUD" },
            { n: "48H", t: "INSTALACIÓN FULL" }
          ].map((stat, i) => (
            <div key={i} className="space-y-1">
              <p className="text-5xl font-black text-brand tracking-tighter">{stat.n}{stat.n2 && <span className="text-white text-[10px] block">{stat.n2}</span>}</p>
              <p className="text-white font-black text-[10px] uppercase tracking-widest opacity-60">{stat.t}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
