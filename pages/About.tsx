import React, { useRef, useState } from 'react';
import { useSiteData, useAdmin } from '../App';
import {
  Target,
  Rocket,
  ShieldCheck,
  Globe,
  Award,
  Upload,
  Info,
  X,
  Plus,
  Image as ImageIcon,
  Trash2
} from 'lucide-react';

const About = () => {
  const { data, updateData } = useSiteData();
  const { isAdmin } = useAdmin();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleEdit = (
    field: 'title' | 'content' | 'mission' | 'vision' | 'aboutImage',
    val: string
  ) => {
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

  // -------- NUESTRA CAPACIDAD (cards + modal) ----------
  const capacityItems = [
    {
      t: 'Sistemas IA',
      short: 'Cámaras con análisis inteligente de comportamiento.',
      detail:
        'Implementamos cámaras y sistemas con análisis inteligente capaces de detectar movimiento sospechoso, merodeo, ingreso a zonas restringidas y otros patrones. Esto reduce falsos positivos y permite respuestas más rápidas y efectivas.'
    },
    {
      t: 'Visualización Remota',
      short: 'Tu negocio en tu bolsillo, donde sea que estés.',
      detail:
        'Configuramos acceso remoto seguro para que puedas ver tus cámaras desde tu celular, tablet o computador, con notificaciones en tiempo real y usuarios personalizados para tu equipo.'
    },
    {
      t: 'Energía Solar',
      short: 'Autonomía total para sectores rurales extremos.',
      detail:
        'Diseñamos sistemas de cámaras alimentadas por paneles solares y baterías de respaldo, pensados para lugares donde no hay red eléctrica o es inestable. Ideal para campos, bodegas agrícolas y zonas aisladas.'
    },
    {
      t: 'Alarmas Inteligentes',
      short: 'Detección avanzada y notificaciones en tiempo real.',
      detail:
        'Instalamos sistemas de alarma con sensores perimetrales, volumétricos y de apertura, integrados a aplicaciones móviles, sirenas y protocolos de respuesta. Menos falsas alarmas y más control sobre lo que pasa en tu pyme.'
    },
    {
      t: 'Control de Acceso',
      short: 'Ingreso seguro y trazable a tus instalaciones.',
      detail:
        'Implementamos control de acceso con tarjetas, claves, huella o reconocimiento facial, registrando horarios de entrada y salida, restricciones por zona y perfiles de usuario para mejorar la seguridad interna.'
    },
    {
      t: 'Internet Rural',
      short: 'Conectividad estable para sectores apartados.',
      detail:
        'Llevamos internet a sectores rurales utilizando radioenlaces y soluciones híbridas, para que tus cámaras, alarmas y sistemas de gestión funcionen aunque estés lejos de la ciudad.'
    },
    {
      t: 'Enlaces de Larga Distancia',
      short: 'Conectividad garantizada en zonas remotas.',
      detail:
        'Usamos radioenlaces profesionales para llevar internet y señal de cámaras a grandes distancias, salvando cerros, campos y zonas sin cobertura tradicional. Ideal para conectar galpones, parcelas y sucursales.'
    },
    {
      t: 'Integración a Medida',
      short: 'Tú tienes la necesidad, nosotros la solución.',
      detail:
        'No todos los proyectos caben en una plantilla. Integramos cámaras, alarmas, control de acceso, automatización, sensores y software de gestión según la realidad de tu pyme, sin soluciones “enlatadas”.'
    }
  ];

  const handleOpenItem = (index: number) => setSelectedIndex(index);
  const handleCloseModal = () => setSelectedIndex(null);

  // -------- ALIADOS: funciones de edición ----------
  const brands = data.brands || [];

  const handleBrandChange = (
    index: number,
    field: 'name' | 'logo' | 'url',
    value: string
  ) => {
    const updated = [...brands];
    updated[index] = { ...updated[index], [field]: value };
    updateData({ ...data, brands: updated });
  };

  const handleBrandFileChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      handleBrandChange(index, 'logo', reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAddBrand = () => {
    const updated = [...brands];
    updated.push({
      id: 'brand-' + Date.now(),
      name: 'Nueva Marca',
      logo: '',
      url: ''
    });
    updateData({ ...data, brands: updated });
  };

  const handleRemoveBrand = (index: number) => {
    const updated = [...brands];
    updated.splice(index, 1);
    updateData({ ...data, brands: updated });
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
                <span key={i} className={i % 2 !== 0 ? 'text-red-600' : ''}>
                  {w}{' '}
                </span>
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
                <p
                  key={i}
                  className="text-xl text-gray-600 leading-relaxed font-medium"
                >
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
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                      Subir desde mi equipo
                    </label>
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
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase font-black text-gray-400 bg-white px-2">
                      o vía URL
                    </div>
                  </div>
                  <input
                    className="w-full bg-gray-50 border-2 border-gray-100 p-3 rounded-xl text-xs outline-none focus:border-red-600 font-bold"
                    value={
                      data.about.aboutImage.startsWith('data:')
                        ? 'Imagen cargada localmente'
                        : data.about.aboutImage
                    }
                    onChange={(e) => handleEdit('aboutImage', e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* NUESTRA CAPACIDAD */}
      <section className="bg-black rounded-[5rem] p-12 md:p-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-[100px]" />
        <div className="max-w-3xl mb-16 relative z-10">
          <h2 className="text-5xl font-black mb-6 text-white tracking-tighter uppercase">
            NUESTRA <span className="text-red-600">CAPACIDAD</span>
          </h2>
          <p className="text-gray-400 text-xl font-bold border-l-4 border-yellow-400 pl-6">
            Tecnología aplicada con sentido humano y territorial.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
          {capacityItems.map((item, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleOpenItem(i)}
              className="text-left bg-[#050505] border border-white/15 p-8 rounded-[2.5rem] hover:bg-white hover:text-black transition-all group focus:outline-none focus:ring-2 focus:ring-yellow-400 cursor-pointer"
            >
              <div className="mb-4 text-red-500 group-hover:text-black">
                <ShieldCheck size={32} />
              </div>
              <h4 className="font-black text-2xl mb-2 uppercase tracking-tight text-white group-hover:text-black">
                {item.t}
              </h4>
              <p className="text-gray-200 font-semibold text-sm group-hover:text-gray-700">
                {item.short}
              </p>
              <p className="mt-4 text-[11px] font-black uppercase tracking-widest text-yellow-400 group-hover:text-black">
                Ver más detalles
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Misión & Visión */}
      <div className="grid md:grid-cols-2 gap-12">
        <div className="bg-white p-16 rounded-[4rem] shadow-2xl border-4 border-black space-y-8 hover:-translate-y-2 transition-transform">
          <div className="flex items-center gap-6 text-red-600">
            <div className="bg-red-50 p-4 rounded-3xl">
              <Target size={48} />
            </div>
            <h2 className="text-5xl font-black text-black uppercase tracking-tighter">
              Misión
            </h2>
          </div>
          {isAdmin ? (
            <textarea
              className="w-full text-lg text-black bg-gray-50 border-4 border-transparent p-6 rounded-3xl min-h-[180px] outline-none focus:border-red-600 font-bold"
              value={data.about.mission}
              onChange={(e) => handleEdit('mission', e.target.value)}
            />
          ) : (
            <p className="text-2xl text-gray-700 leading-relaxed font-bold border-l-8 border-yellow-400 pl-8">
              {data.about.mission}
            </p>
          )}
        </div>
        <div className="bg-black text-white p-16 rounded-[4rem] shadow-2xl border-4 border-blue-600 space-y-8 hover:-translate-y-2 transition-transform">
          <div className="flex items-center gap-6 text-blue-500">
            <div className="bg-blue-600/10 p-4 rounded-3xl">
              <Rocket size={48} />
            </div>
            <h2 className="text-5xl font-black uppercase tracking-tighter">
              Visión
            </h2>
          </div>
          {isAdmin ? (
            <textarea
              className="w-full text-lg text-white bg-white/5 border-4 border-transparent p-6 rounded-3xl min-h-[180px] outline-none focus:border-blue-600 font-bold"
              value={data.about.vision}
              onChange={(e) => handleEdit('vision', e.target.value)}
            />
          ) : (
            <p className="text-2xl text-gray-300 leading-relaxed font-bold border-l-8 border-red-600 pl-8">
              {data.about.vision}
            </p>
          )}
        </div>
      </div>

      {/* Aliados Tecnológicos */}
      <section className="pt-20">
        <div className="text-center mb-16 space-y-4">
          <div className="flex items-center justify-center gap-2 text-blue-600 font-black uppercase tracking-[0.3em] text-xs">
            <Globe size={16} /> Tecnología Global
          </div>
          <h2 className="text-5xl font-black text-black tracking-tighter uppercase">
            NUESTROS <span className="text-red-600">ALIADOS</span>
          </h2>
          <p className="text-gray-500 font-bold max-w-2xl mx-auto">
            Trabajamos exclusivamente con marcas líderes con soporte mundial para garantizar la continuidad de tu
            seguridad.
          </p>
        </div>

        {/* Logos visibles al público */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-12 items-center">
          {brands.map((brand) => (
            <div
              key={brand.id}
              className="group relative flex flex-col items-center gap-4"
            >
              {brand.url ? (
                <a
                  href={brand.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white border-2 border-gray-100 p-8 rounded-[2rem] shadow-sm hover:shadow-2xl hover:border-black transition-all duration-500 w-full flex items-center justify-center aspect-square grayscale group-hover:grayscale-0"
                >
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    className="max-h-full max-w-full object-contain transform group-hover:scale-110 transition-transform duration-500"
                  />
                </a>
              ) : (
                <div className="bg-white border-2 border-gray-100 p-8 rounded-[2rem] shadow-sm hover:shadow-2xl hover:border-black transition-all duration-500 w-full flex items-center justify-center aspect-square grayscale group-hover:grayscale-0">
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    className="max-h-full max-w-full object-contain transform group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
              )}
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-black transition-colors">
                {brand.name}
              </span>
            </div>
          ))}
        </div>

        {/* Editor de aliados solo para admin */}
        {isAdmin && (
          <div className="mt-16 bg-white p-8 rounded-[3rem] border-4 border-black space-y-6">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-xl font-black uppercase tracking-widest">
                Editor de aliados tecnológicos
              </h3>
              <button
                type="button"
                onClick={handleAddBrand}
                className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-600 transition-all"
              >
                <Plus size={16} /> Agregar aliado
              </button>
            </div>

            <p className="text-xs text-gray-500 font-bold">
              Puedes usar imágenes <strong>PNG o JPG</strong>, ya sea pegando una URL válida o subiendo un archivo
              desde tu equipo. Los cambios se guardan cuando presionas el botón de guardar en la esquina inferior
              derecha del sitio.
            </p>

            <div className="space-y-4">
              {brands.map((brand, index) => (
                <div
                  key={brand.id}
                  className="border-2 border-gray-100 rounded-2xl p-4 grid md:grid-cols-[2fr,3fr,3fr,auto] gap-4 items-start"
                >
                  {/* Nombre */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400">
                      Nombre de la marca
                    </label>
                    <input
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-red-600"
                      value={brand.name}
                      onChange={(e) =>
                        handleBrandChange(index, 'name', e.target.value)
                      }
                    />
                  </div>

                  {/* Logo */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400">
                      Logo (URL o archivo)
                    </label>
                    <input
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-blue-600"
                      value={
                        brand.logo && brand.logo.startsWith('data:')
                          ? 'Imagen cargada localmente'
                          : brand.logo || ''
                      }
                      onChange={(e) =>
                        handleBrandChange(index, 'logo', e.target.value)
                      }
                      placeholder="https://ruta-de-la-imagen.png"
                    />
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer inline-flex items-center gap-2 text-[11px] font-black uppercase px-3 py-2 rounded-xl bg-gray-900 text-white hover:bg-red-600 transition-all">
                        <ImageIcon size={14} /> Subir archivo
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleBrandFileChange(index, e)}
                        />
                      </label>
                      <span className="text-[10px] text-gray-400">
                        PNG / JPG recomendado, fondo transparente si es posible.
                      </span>
                    </div>
                  </div>

                  {/* URL sitio oficial */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400">
                      Enlace sitio oficial
                    </label>
                    <input
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-blue-600"
                      value={brand.url || ''}
                      onChange={(e) =>
                        handleBrandChange(index, 'url', e.target.value)
                      }
                      placeholder="https://www.marca.com/"
                    />
                    <p className="text-[10px] text-gray-400">
                      Si lo dejas vacío, el logo no será clickeable.
                    </p>
                  </div>

                  {/* Eliminar */}
                  <button
                    type="button"
                    onClick={() => handleRemoveBrand(index)}
                    className="mt-6 md:mt-0 flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all rounded-2xl px-3 py-2"
                    title="Eliminar aliado"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              {brands.length === 0 && (
                <p className="text-xs text-gray-500">
                  No tienes aliados configurados todavía. Usa el botón{' '}
                  <strong>“Agregar aliado”</strong> para crear el primero.
                </p>
              )}
            </div>
          </div>
        )}

        <div className="mt-20 bg-yellow-400 p-8 rounded-[3rem] border-4 border-black flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="bg-black text-white p-4 rounded-2xl">
              <ShieldCheck size={32} />
            </div>
            <p className="text-black font-black text-xl leading-tight">
              MÁS DE <span className="text-3xl">5.000</span> DISPOSITIVOS <br />
              OPERANDO EN EL SUR DE CHILE
            </p>
          </div>
          <div className="flex -space-x-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-16 h-16 rounded-full border-4 border-black overflow-hidden shadow-lg"
              >
                <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="Client" />
              </div>
            ))}
            <div className="w-16 h-16 rounded-full border-4 border-black bg-black text-white flex items-center justify-center font-black text-xs">
              +5K
            </div>
          </div>
        </div>
      </section>

      {/* MODAL CAPACIDADES */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center px-4"
          onClick={handleCloseModal}
        >
          <div
            className="bg-white rounded-[3rem] max-w-lg w-full p-8 border-4 border-black shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 bg-black text-white rounded-full p-2 hover:bg-red-600 transition-colors"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
            <div className="flex items-center gap-3 mb-4 text-red-600">
              <ShieldCheck size={28} />
              <h3 className="text-2xl font-black uppercase tracking-tight text-black">
                {capacityItems[selectedIndex].t}
              </h3>
            </div>
            <p className="text-gray-700 text-lg leading-relaxed font-medium">
              {capacityItems[selectedIndex].detail}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default About;
