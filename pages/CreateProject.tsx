import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  Check,
  ShoppingBag,
  Bot,
  User,
  Send,
  Sparkles,
  ArrowLeft,
  Loader2,
  Zap,
} from 'lucide-react';
import { useSiteData, useAdmin } from '../App';

const CreateProject = () => {
  const { data, updateData } = useSiteData();
  const { isAdmin } = useAdmin();

  const [mode, setMode] = useState<'selection' | 'ai' | 'finished'>('selection');

  // AI State
  const initialAIMessage = data.aiSettings.isBetaEnabled
    ? '¡Bienvenido a la Experiencia Beta de Mi Pyme Segura! Soy tu asistente de seguridad avanzado. Cuéntame sobre los riesgos específicos que quieres mitigar en tu negocio.'
    : '¡Hola! Soy tu asistente experto en seguridad. ¿Qué tipo de negocio o propiedad quieres proteger hoy? Cuéntame un poco para darte la mejor recomendación.';

  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: initialAIMessage },
  ]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleHeaderEdit = (field: 'title' | 'subtitle', val: string) => {
    updateData({ ...data, createProjectHeader: { ...data.createProjectHeader, [field]: val } });
  };

  // AI Logic
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!userInput.trim()) return;

    const userMsg = userInput.trim();
    const newMessages = [...messages, { role: 'user' as const, text: userMsg }];

    setMessages(newMessages);
    setUserInput('');
    setIsTyping(true);

    try {
      const activePrompt = data.aiSettings.isBetaEnabled ? data.aiSettings.betaPrompt : data.aiSettings.systemPrompt;

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: activePrompt,
          messages: newMessages,
          model: data.aiSettings.selectedModel || 'gemini-3-flash-preview',
        }),
      });

      if (!res.ok) {
        console.error('Error en /api/ai:', await res.text());
        throw new Error('Respuesta no OK del servidor');
      }

      const dataRes = await res.json();
      const aiText = dataRes.reply || 'Lo siento, no pude procesar tu solicitud.';

      setMessages((prev) => [...prev, { role: 'ai', text: aiText }]);
    } catch (error) {
      console.error('Error llamando a /api/ai:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: 'Error de conexión con el asistente. Por favor intenta de nuevo.',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-16 text-black">
      {/* Header */}
      <div className="mb-12 space-y-4 text-center">
        {isAdmin ? (
          <div className="space-y-4">
            <input
              className="text-5xl font-black tracking-tighter w-full bg-white border-4 border-red-600 p-4 rounded-3xl outline-none text-center"
              value={data.createProjectHeader.title}
              onChange={(e) => handleHeaderEdit('title', e.target.value)}
            />
            <input
              className="text-xl font-bold text-blue-600 w-full bg-white border-2 border-gray-200 p-2 rounded-xl outline-none text-center"
              value={data.createProjectHeader.subtitle}
              onChange={(e) => handleHeaderEdit('subtitle', e.target.value)}
            />
          </div>
        ) : (
          <>
            <h1 className="text-6xl font-black tracking-tighter mb-2">{data.createProjectHeader.title}</h1>
            <p className="text-xl font-bold text-gray-500 border-b-4 border-yellow-400 inline-block px-4 pb-2">
              {data.createProjectHeader.subtitle}
            </p>
          </>
        )}
      </div>

      {/* Mode Selection */}
      {mode === 'selection' && (
        <div className="grid md:grid-cols-2 gap-10 animate-in fade-in duration-500 pt-8">
          {/* ✅ TRADICIONAL: ahora navega a la ruta del wizard */}
          <Link
            to="/create-project/tradicional"
            className="group bg-white p-12 rounded-[4rem] border-4 border-black shadow-2xl hover:-translate-y-2 transition-all text-left space-y-8 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-2 h-full bg-red-600" />
            <div className="bg-red-50 w-20 h-20 rounded-3xl flex items-center justify-center text-red-600 group-hover:bg-red-600 group-hover:text-white transition-all">
              <ShoppingBag size={40} />
            </div>
            <div>
              <h3 className="text-3xl font-black text-black tracking-tight">TRADICIONAL</h3>
              <p className="text-gray-500 mt-2 font-bold leading-relaxed">Configura paso a paso de forma manual.</p>
            </div>
            <div className="flex items-center gap-2 text-red-600 font-black uppercase text-sm">
              SELECCIÓN MANUAL <ChevronRight size={18} />
            </div>
          </Link>

          {/* ASESORÍA IA */}
          <button
            onClick={() => setMode('ai')}
            className={`group p-12 rounded-[4rem] shadow-2xl transition-all text-left space-y-8 relative overflow-hidden hover:-translate-y-2 border-4 ${
              data.aiSettings.isBetaEnabled ? 'bg-black border-yellow-400' : 'bg-blue-600 border-black'
            }`}
          >
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Sparkles size={140} className="text-white" />
            </div>
            <div
              className={`w-20 h-20 rounded-3xl flex items-center justify-center text-white ${
                data.aiSettings.isBetaEnabled ? 'bg-yellow-400 text-black' : 'bg-black'
              }`}
            >
              {data.aiSettings.isBetaEnabled ? <Zap size={40} /> : <Bot size={40} />}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-3xl font-black tracking-tight text-white">ASESORÍA IA</h3>
                {data.aiSettings.isBetaEnabled && (
                  <span className="bg-yellow-400 text-black text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest">
                    BETA
                  </span>
                )}
              </div>
              <p className={`mt-2 font-bold leading-relaxed ${data.aiSettings.isBetaEnabled ? 'text-gray-400' : 'text-blue-100'}`}>
                Conversa con el cerebro de seguridad.
              </p>
            </div>
            <div className={`flex items-center gap-2 font-black uppercase text-sm ${data.aiSettings.isBetaEnabled ? 'text-yellow-400' : 'text-white'}`}>
              CHATEAR AHORA <ChevronRight size={18} />
            </div>
          </button>
        </div>
      )}

      {/* AI Chat Flow */}
      {mode === 'ai' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-[700px]">
          <button
            onClick={() => setMode('selection')}
            className={`mb-6 flex items-center gap-2 font-black uppercase text-xs transition-colors ${
              data.aiSettings.isBetaEnabled ? 'text-yellow-400 hover:text-white' : 'text-blue-600 hover:text-black'
            }`}
          >
            <ArrowLeft size={16} /> CAMBIAR MODO
          </button>

          <div
            className={`flex-1 rounded-[4rem] shadow-2xl border-4 flex flex-col overflow-hidden ${
              data.aiSettings.isBetaEnabled ? 'bg-black border-yellow-400' : 'bg-white border-black'
            }`}
          >
            {/* Chat Area */}
            <div className="flex-1 p-8 overflow-y-auto space-y-8 scrollbar-thin scrollbar-thumb-gray-800">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xl ${
                        msg.role === 'user'
                          ? 'bg-red-600 text-white'
                          : data.aiSettings.isBetaEnabled
                          ? 'bg-yellow-400 text-black'
                          : 'bg-blue-600 text-white'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        <User size={24} />
                      ) : data.aiSettings.isBetaEnabled ? (
                        <Zap size={24} />
                      ) : (
                        <Bot size={24} />
                      )}
                    </div>
                    <div
                      className={`p-6 rounded-[2rem] text-sm font-bold leading-relaxed whitespace-pre-wrap ${
                        msg.role === 'user'
                          ? 'bg-red-50 text-black border-2 border-red-100 rounded-tr-none'
                          : data.aiSettings.isBetaEnabled
                          ? 'bg-white/5 text-white border-2 border-white/10 rounded-tl-none'
                          : 'bg-blue-50 text-black border-2 border-blue-100 rounded-tl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex gap-4 max-w-[85%] items-center">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${data.aiSettings.isBetaEnabled ? 'bg-yellow-400 text-black' : 'bg-blue-600 text-white'}`}>
                      <Loader2 size={24} className="animate-spin" />
                    </div>
                    <div className={`p-6 rounded-[2rem] font-black italic text-xs uppercase tracking-widest ${data.aiSettings.isBetaEnabled ? 'bg-white/5 text-yellow-400' : 'bg-gray-100 text-gray-500'}`}>
                      Analizando riesgos...
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className={`p-8 border-t-4 ${data.aiSettings.isBetaEnabled ? 'border-white/10 bg-white/5' : 'border-black bg-gray-50'}`}>
              <form
                className="relative"
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
              >
                <input
                  type="text"
                  className={`w-full border-4 rounded-[2rem] p-5 pr-20 outline-none transition-all font-bold ${
                    data.aiSettings.isBetaEnabled
                      ? 'bg-black border-yellow-400/30 text-white focus:border-yellow-400 placeholder-white/20'
                      : 'bg-white border-black text-black focus:border-blue-600 placeholder-gray-400'
                  }`}
                  placeholder="Escribe tu consulta de seguridad..."
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  disabled={isTyping}
                />
                <button
                  type="submit"
                  disabled={isTyping || !userInput.trim()}
                  className={`absolute right-3 top-3 p-3 rounded-2xl transition-all disabled:opacity-50 text-white shadow-xl ${
                    data.aiSettings.isBetaEnabled ? 'bg-yellow-400 text-black hover:scale-105' : 'bg-blue-600 hover:bg-black'
                  }`}
                >
                  <Send size={28} />
                </button>
              </form>

              <div className="flex justify-between items-center mt-6">
                <p className={`text-[10px] uppercase font-black tracking-widest ${data.aiSettings.isBetaEnabled ? 'text-yellow-400' : 'text-gray-400'}`}>
                  {data.aiSettings.isBetaEnabled ? 'SISTEMA BETA MULTIMODAL' : 'CORE IA MI PYME SEGURA'}
                </p>
                <button
                  onClick={() => setMode('finished')}
                  className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    data.aiSettings.isBetaEnabled ? 'bg-white/10 text-white hover:bg-yellow-400 hover:text-black' : 'bg-black text-white hover:bg-red-600'
                  }`}
                >
                  Finalizar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Finished Screen */}
      {mode === 'finished' && (
        <div className="text-center space-y-10 animate-in zoom-in-95 duration-500 bg-white p-20 rounded-[4rem] shadow-2xl border-4 border-black">
          <div className="bg-yellow-400 text-black w-28 h-28 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl rotate-12">
            <Check size={56} className="font-black" />
          </div>
          <div className="space-y-4">
            <h2 className="text-5xl font-black text-black tracking-tighter uppercase">
              PROYECTO <br />
              <span className="text-red-600">CONSOLIDADO</span>
            </h2>
            <p className="text-xl text-gray-500 font-bold max-w-md mx-auto leading-relaxed">
              Nuestro equipo ha recibido tu diseño. En menos de 24 horas te contactaremos.
            </p>
          </div>
          <button
            onClick={() => (window.location.href = '#/contact')}
            className="bg-black text-white px-16 py-6 rounded-[2.5rem] font-black text-2xl hover:bg-red-600 transition-all shadow-2xl shadow-gray-200 transform hover:scale-110"
          >
            HABLEMOS AHORA
          </button>
        </div>
      )}
    </div>
  );
};

export default CreateProject;
