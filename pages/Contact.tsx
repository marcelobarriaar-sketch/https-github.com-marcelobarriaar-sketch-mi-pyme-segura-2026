
import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, Instagram, Facebook, Music2, Plus, Trash2, CheckCircle, Smartphone } from 'lucide-react';
import { useSiteData, useAdmin } from '../App';

const DynamicIcon = ({ name, size = 24 }: { name: string, size?: number }) => {
  switch (name) {
    case 'Instagram': return <Instagram size={size} />;
    case 'Facebook': return <Facebook size={size} />;
    case 'Music2': 
    case 'TikTok': return <Music2 size={size} />;
    default: return <Smartphone size={size} />;
  }
};

const Contact = () => {
  const { data, updateData } = useSiteData();
  const { isAdmin } = useAdmin();
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', business: '', email: '', message: '' });

  const handleEdit = (field: string, value: string) => {
    updateData({
      ...data,
      contact: { ...data.contact, [field]: value }
    });
  };

  const addSocial = () => {
    const newSocial = { id: Date.now().toString(), name: 'Nueva Red', icon: 'Smartphone', url: 'https://' };
    updateData({
      ...data,
      contact: {
        ...data.contact,
        socials: [...data.contact.socials, newSocial]
      }
    });
  };

  const deleteSocial = (id: string) => {
    updateData({
      ...data,
      contact: {
        ...data.contact,
        socials: data.contact.socials.filter(s => s.id !== id)
      }
    });
  };

  const updateSocial = (id: string, updates: any) => {
    updateData({
      ...data,
      contact: {
        ...data.contact,
        socials: data.contact.socials.map(s => s.id === id ? { ...s, ...updates } : s)
      }
    });
  };

  const handleWhatsAppSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const phoneClean = data.contact.phone.replace(/\D/g, '');
    const text = `Hola Mi Pyme Segura, mi nombre es ${form.name} de ${form.business}. Mi correo es ${form.email}. Mensaje: ${form.message}`;
    const url = `https://wa.me/${phoneClean}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    setSent(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-20">
      <div className="grid md:grid-cols-2 gap-16">
        <div className="space-y-12">
          <div className="space-y-6">
            {isAdmin ? (
              <div className="space-y-4">
                <input 
                  type="text" 
                  className="text-6xl font-extrabold tracking-tight w-full border-b-2 border-red-600 p-1 outline-none bg-white text-black"
                  value={data.contact.title}
                  onChange={(e) => handleEdit('title', e.target.value)}
                />
                <textarea 
                  className="text-xl text-gray-600 leading-relaxed w-full border-2 border-gray-200 p-2 rounded outline-none h-24 bg-white text-black"
                  value={data.contact.description}
                  onChange={(e) => handleEdit('description', e.target.value)}
                />
              </div>
            ) : (
              <>
                <h1 className="text-6xl font-extrabold tracking-tight">{data.contact.title}</h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  {data.contact.description}
                </p>
              </>
            )}
          </div>

          <div className="space-y-8">
            <div className="flex items-center gap-6 group">
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl group-hover:bg-red-600 group-hover:text-white transition-colors duration-300">
                <Phone size={28} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Llámanos / WhatsApp</p>
                {isAdmin ? (
                  <input 
                    type="text" 
                    className="text-xl font-extrabold text-gray-900 w-full border-b-2 border-gray-300 p-1 outline-none bg-white text-black"
                    value={data.contact.phone}
                    onChange={(e) => handleEdit('phone', e.target.value)}
                  />
                ) : (
                  <p className="text-xl font-extrabold text-gray-900">{data.contact.phone}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-6 group">
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl group-hover:bg-red-600 group-hover:text-white transition-colors duration-300">
                <Mail size={28} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Escríbenos</p>
                {isAdmin ? (
                  <input 
                    type="email" 
                    className="text-xl font-extrabold text-gray-900 w-full border-b-2 border-gray-300 p-1 outline-none bg-white text-black"
                    value={data.contact.email}
                    onChange={(e) => handleEdit('email', e.target.value)}
                  />
                ) : (
                  <p className="text-xl font-extrabold text-gray-900">{data.contact.email}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-6 group">
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl group-hover:bg-red-600 group-hover:text-white transition-colors duration-300">
                <MapPin size={28} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Visítanos</p>
                {isAdmin ? (
                  <input 
                    type="text" 
                    className="text-xl font-extrabold text-gray-900 w-full border-b-2 border-gray-300 p-1 outline-none bg-white text-black"
                    value={data.contact.address}
                    onChange={(e) => handleEdit('address', e.target.value)}
                  />
                ) : (
                  <p className="text-xl font-extrabold text-gray-900">{data.contact.address}</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Nuestras Redes</h4>
              {isAdmin && (
                <button 
                  onClick={addSocial}
                  className="bg-green-600 text-white p-2 rounded-full hover:bg-green-700 transition-colors"
                  title="Agregar Red Social"
                >
                  <Plus size={16} />
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.contact.socials.map((social) => (
                <div key={social.id} className="bg-white p-4 rounded-2xl border-2 border-gray-100 flex flex-col gap-3 group relative">
                  <div className="flex items-center gap-3">
                    <div className="bg-red-50 text-red-600 p-3 rounded-xl">
                      <DynamicIcon name={social.icon} />
                    </div>
                    {isAdmin ? (
                      <div className="flex-1 space-y-2">
                        <input 
                          className="w-full text-sm font-bold border-b border-gray-200 outline-none bg-white text-black" 
                          value={social.name} 
                          onChange={(e) => updateSocial(social.id, { name: e.target.value })}
                          placeholder="Nombre Red"
                        />
                        <select 
                          className="w-full text-xs border-b border-gray-200 outline-none bg-white text-black"
                          value={social.icon}
                          onChange={(e) => updateSocial(social.id, { icon: e.target.value })}
                        >
                          <option value="Instagram">Instagram</option>
                          <option value="Facebook">Facebook</option>
                          <option value="Music2">TikTok</option>
                          <option value="Smartphone">Otros</option>
                        </select>
                      </div>
                    ) : (
                      <a href={social.url} target="_blank" rel="noopener noreferrer" className="font-bold text-gray-900 flex-1 hover:text-red-600">
                        {social.name}
                      </a>
                    )}
                  </div>
                  
                  {isAdmin && (
                    <div className="space-y-2">
                      <input 
                        className="w-full text-[10px] border border-gray-200 p-1 rounded bg-white text-black" 
                        value={social.url} 
                        onChange={(e) => updateSocial(social.id, { url: e.target.value })}
                        placeholder="Link completo (https://...)"
                      />
                      <button 
                        onClick={() => deleteSocial(social.id)}
                        className="absolute -top-2 -right-2 bg-red-600 text-white p-1 rounded-full shadow-lg"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white p-12 rounded-[3rem] shadow-2xl shadow-red-100 border border-gray-50 flex flex-col justify-center">
          {sent ? (
            <div className="text-center space-y-6 animate-in zoom-in-95 duration-500">
              <div className="flex justify-center">
                <CheckCircle size={80} className="text-green-500" />
              </div>
              <h2 className="text-3xl font-bold">¡Mensaje Enviado!</h2>
              <p className="text-xl text-gray-600">
                Muchas gracias por contactarnos, pronto tendrás nuestras noticias.
              </p>
              <button 
                onClick={() => setSent(false)} 
                className="text-red-600 font-bold hover:underline"
              >
                Enviar otro mensaje
              </button>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleWhatsAppSubmit}>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Nombre Completo</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-50 border-2 border-transparent rounded-2xl p-4 focus:ring-2 focus:ring-red-600 focus:bg-white outline-none transition-all text-black" 
                    placeholder="Tu nombre" 
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Nombre del Negocio</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-50 border-2 border-transparent rounded-2xl p-4 focus:ring-2 focus:ring-red-600 focus:bg-white outline-none transition-all text-black" 
                    placeholder="Mi Pyme" 
                    value={form.business}
                    onChange={e => setForm({...form, business: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Email</label>
                <input 
                  type="email" 
                  className="w-full bg-gray-50 border-2 border-transparent rounded-2xl p-4 focus:ring-2 focus:ring-red-600 focus:bg-white outline-none transition-all text-black" 
                  placeholder="correo@empresa.com" 
                  value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Mensaje</label>
                <textarea 
                  className="w-full bg-gray-50 border-2 border-transparent rounded-2xl p-4 min-h-[150px] focus:ring-2 focus:ring-red-600 focus:bg-white outline-none transition-all text-black" 
                  placeholder="¿En qué podemos ayudarte?" 
                  value={form.message}
                  onChange={e => setForm({...form, message: e.target.value})}
                  required 
                />
              </div>
              <button type="submit" className="w-full bg-red-600 text-white py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 hover:bg-red-700 transition-all shadow-lg shadow-red-200">
                Enviar por WhatsApp <Send size={24} />
              </button>
              <p className="text-center text-xs text-gray-400">El mensaje se enviará directamente a nuestro equipo de atención al cliente.</p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Contact;
