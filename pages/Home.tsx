
import React, { useRef } from 'react';
import { useSiteData, useAdmin } from '../App';
import { ArrowRight, Shield, Settings, Users, Star, Zap, Upload, Info } from 'lucide-react';
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

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative h-[85vh] flex items-center overflow-hidden bg-black">
        <div className="absolute inset-0 z-0">
          <img 
            src={data.home.featuredImage} 
            alt="Hero" 
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-black via-black/40 to-transparent" />
        </div>

        {isAdmin && (
          <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
            <div className="bg-yellow-400 text-black px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2 border-2 border-black animate-in fade-in slide-in-from-top-2">
              <Info size={14} /> Sugerido: 1920 x 1080 px (Panorámica)
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
              className="bg-white/10 backdrop-blur-md text-white border border-white/20 p-4 rounded-2xl flex items-center gap-3 font-black text-xs hover:bg-white hover:text-black transition-all"
            >
              <Upload size={18} /> SUBIR FONDO DESDE MAC
            </button>
          </div>
        )}
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
          <div className="max-w-3xl space-y-8">
            <div className="inline-flex items-center gap-2 bg-yellow-400 text-black px-4 py-1 rounded-full font-black text-xs uppercase tracking-widest animate-pulse">
              <Zap size={14} /> Sistema Rural Activo
            </div>

            {isAdmin ? (
              <textarea
                value={data.home.heroTitle}
                onChange={(e) => handleEdit('heroTitle', e.target.value)}
                className="w-full bg-white/10 text-5xl md:text-7xl font-black border-4 border-brand p-4 rounded-3xl outline-none"
              />
            ) : (
              <h1 className="text-5xl md:text-8xl font-black leading-[1.05] tracking-tighter">
                {data.home.heroTitle.split(' ').map((word, i) => (
                  <span key={i} className={i % 2 === 1 ? 'text-brand' : ''}>{word} </span>
                ))}
              </h1>
            )}
            
            {isAdmin ? (
              <textarea
                value={data.home.heroSubtitle}
                onChange={(e) => handleEdit('heroSubtitle', e.target.value)}
                className="w-full bg-white/10 text-xl text-gray-300 border-2 border-blue-600 p-4 rounded-3xl outline-none"
              />
            ) : (
              <p className="text-xl md:text-2xl text-gray-300 font-bold max-w-xl border-l-4 border-yellow-400 pl-6">
                {data.home.heroSubtitle}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-6 pt-6">
              <Link to="/create-project" className="bg-brand hover:bg-white hover:text-brand text-white px-10 py-5 rounded-[2rem] font-black text-xl flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1 shadow-2xl shadow-brand/30">
                PROYECTO IA <ArrowRight size={24} />
              </Link>
              <Link to="/equipment" className="bg-white/5 backdrop-blur-xl hover:bg-blue-600 text-white px-10 py-5 rounded-[2rem] font-black text-xl border-2 border-white/20 transition-all text-center">
                EQUIPOS
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-3 gap-8">
        {[
          { icon: Shield, title: "Máxima Seguridad", color: "text-brand", bg: "bg-red-50", desc: "Sistemas robustos blindados contra intrusos." },
          { icon: Zap, title: "Energía Solar", color: "text-yellow-400", bg: "bg-yellow-50", desc: "Independencia total en zonas sin red eléctrica." },
          { icon: Star, title: "Soporte IA", color: "text-blue-600", bg: "bg-blue-50", desc: "Análisis inteligente 24/7 de cada movimiento." }
        ].map((item, i) => (
          <div key={i} className="bg-white p-10 rounded-[3rem] shadow-xl border-2 border-gray-50 space-y-6 hover:border-black transition-all group">
            <div className={`${item.bg} w-20 h-20 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <item.icon className={`${item.color}`} size={40} />
            </div>
            <h3 className="text-3xl font-black text-black tracking-tight">{item.title}</h3>
            <p className="text-gray-500 font-bold leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </section>

      {/* Dark Info Section */}
      <section className="bg-black py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-brand/10 blur-[120px]" />
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center gap-16 text-white relative z-10">
          <div className="flex-1 space-y-10">
            <h2 className="text-5xl font-black tracking-tighter">EL CAMINO A LA <br/><span className="text-blue-600">TRANQUILIDAD</span></h2>
            <div className="space-y-8">
              {[
                { t: "DISEÑO INTELIGENTE", d: "Personalizamos cada sensor según tu plano.", color: "bg-brand" },
                { t: "COTIZACIÓN REAL", d: "Valores fijos, sin letras chicas.", color: "bg-yellow-400 text-black" },
                { t: "INSTALACIÓN RÁPIDA", d: "Operativo en menos de 48 horas.", color: "bg-blue-600" }
              ].map((item, i) => (
                <div key={i} className="flex gap-6 items-start">
                  <div className={`${item.color} w-10 h-10 rounded-xl flex items-center justify-center font-black shrink-0 shadow-lg`}>
                    {i+1}
                  </div>
                  <div>
                    <h4 className="font-black text-2xl tracking-tight">{item.t}</h4>
                    <p className="text-gray-400 font-medium">{item.d}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/create-project" className="inline-block bg-white text-black px-12 py-4 rounded-2xl font-black hover:bg-yellow-400 transition-all transform hover:scale-105">
              COMENZAR DISEÑO
            </Link>
          </div>
          <div className="flex-1 relative">
            <div className="absolute -inset-4 bg-yellow-400 rounded-[3rem] rotate-3" />
            <img src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=800" className="relative rounded-[3rem] shadow-2xl grayscale hover:grayscale-0 transition-all duration-700" alt="Installer" />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
