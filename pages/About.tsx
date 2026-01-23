
import React, { useRef } from 'react';
import { useSiteData, useAdmin } from '../App';
import { Target, Rocket, ShieldCheck, Globe, Award, Upload, Info } from 'lucide-react';

const About = () => {
  const { data, updateData } = useSiteData();
  const { isAdmin } = useAdmin();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEdit = (field: 'title' | 'content' | 'mission' | 'vision' | 'aboutImage', val: string) => {
    updateData({ ...data, about: { ...data.about, [field]: val } });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleEdit('aboutImage', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-20 space-y-24">
      {/* Intro Section */}
      <div className="grid md:grid-cols-2 gap-16 items-center">
        <div className="space-y-8">
          {isAdmin ? (
            <input
              className="text-4xl font-black w-full border-b-4 border-red-600 p-2 outline-none bg-white text-black uppercase tracking-tighter"
              value={data.about.title}
              onChange={(e) => handleEdit('title', e.target.value)}
            />
          ) : (
            <h1 className="text-7xl font-black tracking-tighter text-black leading-none uppercase">
              {data.about.title.split(' ').map((w, i) => (
                <span key={i} className={i % 2 !== 0 ? 'text-red-600' : ''}>{w} </span>
              ))}
            </h1>
          )}

          {isAdmin ? (
            <textarea
              className="text-lg text-black leading-relaxed w-full min-h-[350px] border-4 border-gray-100 bg-white p-6 rounded-[2rem] outline-none focus:border-blue-600 font-bold"
              value={data.about.content}
              onChange={(e) => handleEdit('content', e.target.value)}
            />
          ) : (
            <div className="space-y-6">
              {data.about.content.split('\n\n').map((para, i) => (
                <p key={i} className="text-xl text-gray-600 leading-relaxed font-medium">
                  {para}
                </p>
              ))}
            </div>
          )}
        </div>
        <div className="relative group">
          <div className="absolute -top-8 -left-8 w-full h-full border-8 border-red-600 rounded-[4rem] z-0" />
          <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-yellow-400 rounded-full z-20 flex items-center justify-center rotate-12 shadow-xl border-4 border-black">
            <Award size={48} className="text-black" />
          </div>
          <div className="relative z-10">
            <img 
              src={data.about.aboutImage} 
              alt="Equipo Mi Pyme Segura" 
              className="w-full aspect-[4/5] object-cover rounded-[4rem] shadow-2xl border-4 border-black grayscale hover:grayscale-0 transition-all duration-700"
            />
            {isAdmin && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-[4rem] opacity-0 group-hover:opacity-100 transition-opacity p-8 gap-4">
                <div className="bg-yellow-400 text-black px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center gap-2 border-2 border-black">
                  <Info size={14} /> Sugerido: 800 x 1000 px (Vertical)
                </div>
                <div className="w-full bg-white p-6 rounded-3xl shadow-2xl space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Subir desde mi Mac</label>
                    <input 
                      type="file" 
                      className="hidden" 
                      ref={fileInputRef} 
                      onChange={handleFileChange}
                      accept="image/*"
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 bg-black text-white py-3 rounded-xl font-black text-sm hover:bg-red-600 transition-all"
                    >
                      <Upload size={18} /> SELECCIONAR ARCHIVO
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200" /></div>
                    <div className="relative flex justify-center text-[10px] uppercase font-black text-gray-400 bg-white px-2">o vía URL</div>
                  </div>
                  <input 
                    className="w-full bg-gray-50 border-2 border-gray-100 p-3 rounded-xl text-xs outline-none focus:border-red-600 font-bold"
                    value={data.about.aboutImage.startsWith('data:') ? 'Imagen cargada localmente' : data.about.aboutImage}
                    onChange={(e) => handleEdit('aboutImage', e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lo que hacemos */}
      <section className="bg-black rounded-[5rem] p-12 md:p-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-[100px]" />
        <div className="max-w-3xl mb-16 relative z-10">
          <h2 className="text-5xl font-black mb-6 text-white tracking-tighter uppercase">NUESTRA <span className="text-red-600">CAPACIDAD</span></h2>
          <p className="text-gray-400 text-xl font-bold border-l-4 border-yellow-400 pl-6">Tecnología aplicada con sentido humano y territorial.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
          {[
            { t: "Sistemas IA", d: "Cámaras con análisis inteligente de comportamiento.", c: "text-blue-600" },
            { t: "Visualización Remota", d: "Tu negocio en tu bolsillo, donde sea que estés.", c: "text-red-600" },
            { t: "Energía Solar", d: "Autonomía total para sectores rurales extremos.", c: "text-yellow-400" },
            { t: "Energía Rural", d: "Sistemas fotovoltaicos para seguridad autónoma.", c: "text-white" },
            { t: "Enlaces de Larga Distancia", d: "Conectividad garantizada en zonas remotas.", c: "text-white" },
            { t: "Integración a Medida", d: "Tú tienes la necesidad, nosotros la solución.", c: "text-gray-400" }
          ].map((item, i) => (
            <div key={i} className="bg-white/5 border-2 border-white/10 p-8 rounded-[2.5rem] hover:bg-white hover:text-black transition-all group">
              <div className={`${item.c} mb-4`}>
                <ShieldCheck size={32} />
              </div>
              <h4 className="font-black text-2xl mb-2 uppercase tracking-tight group-hover:text-black">{item.t}</h4>
              <p className="text-gray-500 font-bold text-sm group-hover:text-gray-700">{item.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mission & Vision */}
      <div className="grid md:grid-cols-2 gap-12">
        <div className="bg-white p-16 rounded-[4rem] shadow-2xl border-4 border-black space-y-8 hover:-translate-y-2 transition-transform">
          <div className="flex items-center gap-6 text-red-600">
            <div className="bg-red-50 p-4 rounded-3xl">
              <Target size={48} />
            </div>
            <h2 className="text-5xl font-black text-black uppercase tracking-tighter">Misión</h2>
          </div>
          {isAdmin ? (
            <textarea
              className="w-full text-lg text-black bg-gray-50 border-4 border-transparent p-6 rounded-3xl min-h-[180px] outline-none focus:border-red-600 font-bold"
              value={data.about.mission}
              onChange={(e) => handleEdit('mission', e.target.value)}
            />
          ) : (
            <p className="text-2xl text-gray-700 leading-relaxed font-bold border-l-8 border-yellow-400 pl-8">{data.about.mission}</p>
          )}
        </div>
        <div className="bg-black text-white p-16 rounded-[4rem] shadow-2xl border-4 border-blue-600 space-y-8 hover:-translate-y-2 transition-transform">
          <div className="flex items-center gap-6 text-blue-500">
            <div className="bg-blue-600/10 p-4 rounded-3xl">
              <Rocket size={48} />
            </div>
            <h2 className="text-5xl font-black uppercase tracking-tighter">Visión</h2>
          </div>
          {isAdmin ? (
            <textarea
              className="w-full text-lg text-white bg-white/5 border-4 border-transparent p-6 rounded-3xl min-h-[180px] outline-none focus:border-blue-600 font-bold"
              value={data.about.vision}
              onChange={(e) => handleEdit('vision', e.target.value)}
            />
          ) : (
            <p className="text-2xl text-gray-300 leading-relaxed font-bold border-l-8 border-red-600 pl-8">{data.about.vision}</p>
          )}
        </div>
      </div>

      {/* Aliados Tecnológicos */}
      <section className="pt-20">
        <div className="text-center mb-16 space-y-4">
          <div className="flex items-center justify-center gap-2 text-blue-600 font-black uppercase tracking-[0.3em] text-xs">
            <Globe size={16} /> Tecnología Global
          </div>
          <h2 className="text-5xl font-black text-black tracking-tighter uppercase">NUESTROS <span className="text-red-600">ALIADOS</span></h2>
          <p className="text-gray-500 font-bold max-w-2xl mx-auto">Trabajamos exclusivamente con marcas líderes con soporte mundial para garantizar la continuidad de tu seguridad.</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-12 items-center">
          {(data.brands || []).map((brand) => (
            <div key={brand.id} className="group relative flex flex-col items-center gap-4">
              <div className="bg-white border-2 border-gray-100 p-8 rounded-[2rem] shadow-sm hover:shadow-2xl hover:border-black transition-all duration-500 w-full flex items-center justify-center aspect-square grayscale group-hover:grayscale-0">
                <img 
                  src={brand.logo} 
                  alt={brand.name} 
                  className="max-h-full max-w-full object-contain transform group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-black transition-colors">{brand.name}</span>
            </div>
          ))}
        </div>

        <div className="mt-20 bg-yellow-400 p-8 rounded-[3rem] border-4 border-black flex flex-col md:flex-row items-center justify-between gap-8">
           <div className="flex items-center gap-6">
              <div className="bg-black text-white p-4 rounded-2xl">
                 <ShieldCheck size={32} />
              </div>
              <p className="text-black font-black text-xl leading-tight">MÁS DE <span className="text-3xl">5.000</span> DISPOSITIVOS <br/>OPERANDO EN EL SUR DE CHILE</p>
           </div>
           <div className="flex -space-x-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="w-16 h-16 rounded-full border-4 border-black overflow-hidden shadow-lg">
                  <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="Client" />
                </div>
              ))}
              <div className="w-16 h-16 rounded-full border-4 border-black bg-black text-white flex items-center justify-center font-black text-xs">+5K</div>
           </div>
        </div>
      </section>
    </div>
  );
};

export default About;
