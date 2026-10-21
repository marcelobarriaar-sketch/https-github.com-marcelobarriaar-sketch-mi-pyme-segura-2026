import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle, ShieldCheck, Wrench, Headphones, ArrowRight } from 'lucide-react';
import type { SiteData } from '../types';
import { ITEMS, LABELS, type EvaluationInput } from '../shared/evaluation';
import './Evaluation.css';
export function EvaluationBrand({ data }: { data: SiteData }) {
  return <header className="ev-brand"><img src={data.branding.logoUrl} alt={`Logo oficial de ${data.branding.siteName}`} /><div><strong>{data.branding.siteName}</strong><p>Seguridad a la medida para tu negocio</p></div></header>;
}
export default function Evaluation({ data }: { data: SiteData }) {
  const [scores, setScores] = useState<Partial<EvaluationInput['scores']>>({});
  const [recommendation, setRecommendation] = useState('');
  const [reference, setReference] = useState(''); const [comment, setComment] = useState('');
  const [challenge, setChallenge] = useState(''); const [website, setWebsite] = useState('');
  const [sending, setSending] = useState(false); const [saved, setSaved] = useState(false);
  const [error, setError] = useState(''); const busy = useRef(false); const confirmation = useRef<HTMLHeadingElement>(null);
  useEffect(() => { document.title = 'Evalúa tu experiencia | Mi Pyme Segura'; }, []);
  useEffect(() => { if (saved) confirmation.current?.focus(); }, [saved]);
  async function loadChallenge() {
    const response = await fetch('/api/evaluations', { cache: 'no-store' }); const result = await response.json();
    if (!response.ok || !result.challenge) throw Error(result.error || 'No pudimos preparar el envío. Inténtalo nuevamente.');
    setChallenge(result.challenge); return result.challenge as string;
  }
  useEffect(() => { loadChallenge().catch(e => setError(e.message)); }, []);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (busy.current) return;
    if (ITEMS.some(([k]) => scores[k] === undefined) || !recommendation) { setError('Completa las cinco valoraciones e indica si nos recomendarías.'); return; }
    busy.current = true; setSending(true); setError('');
    try {
      if (!challenge) { await loadChallenge(); throw Error('El formulario ya está listo. Pulsa Enviar mi evaluación nuevamente.'); }
      const response = await fetch('/api/evaluations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scores, recommendation, reference, comment, website, challenge }), signal: AbortSignal.timeout(25000) });
      const result = await response.json();
      if (!response.ok || !result.success || !result.id) {
        if (response.status === 400 && result.error?.includes('validación')) { await loadChallenge(); }
        throw Error(result.error || 'No pudimos guardar tu evaluación. Tus respuestas siguen aquí; vuelve a intentar.');
      }
      setSaved(true);
    } catch (e) { setError((e as Error).name === 'TimeoutError' || (e as Error).name === 'TypeError' ? 'No pudimos confirmar el registro. Tus respuestas siguen aquí. Reintenta: evitaremos guardar el mismo envío dos veces.' : (e as Error).message); }
    finally { busy.current = false; setSending(false); }
  }
  const supportPhone = data.whatsappConfig?.phoneNumber?.replace(/\D/g, '');
  return <div className="evaluation-shell"><div className="ev-container"><EvaluationBrand data={data} />
    {saved ? <section className="ev-card ev-success"><CheckCircle size={56} aria-hidden="true" /><p className="ev-eyebrow">Evaluación guardada</p><h1 tabIndex={-1} ref={confirmation}>¡Gracias por tu evaluación!</h1><p>Gracias por ayudarnos a mejorar. Tu tranquilidad y confianza nos motivan a seguir entregando un mejor servicio.</p><a className="ev-primary" href="/">Visitar Mi Pyme Segura <ArrowRight size={18} aria-hidden="true" /></a>{supportPhone && <a className="ev-secondary" href={`https://wa.me/${supportPhone}?text=${encodeURIComponent('Hola Mi Pyme Segura, necesito ayuda con mis equipos.')}`}>Necesito ayuda con mis equipos</a>}</section>
    : <><section className="ev-intro"><p className="ev-eyebrow">Tu experiencia nos importa</p><h1>¿Cómo fue tu experiencia con Mi Pyme Segura?</h1><p>Gracias por confiar en nosotros. Responder esta breve encuesta nos ayuda a mejorar nuestras instalaciones y la atención que te entregamos. Te tomará menos de un minuto.</p><div className="ev-badges"><span><ShieldCheck size={18} aria-hidden="true" /> Atención</span><span><Wrench size={18} aria-hidden="true" /> Instalación</span><span><Headphones size={18} aria-hidden="true" /> Soporte</span></div></section>
    <form className="ev-card" onSubmit={submit}><p className="ev-guide" id="ev-guide">Marca de 1 (Muy insatisfecho) a 5 (Muy satisfecho). Usa “No aplica” si ese aspecto no formó parte del servicio.</p>
      {ITEMS.map(([key, label], i) => <fieldset className="ev-question" key={key} aria-describedby="ev-guide"><legend><span className="ev-number">{i + 1}</span>{label}</legend><div className="ev-ratings">{LABELS.map((text, n) => <label className="ev-rating" key={n}><input type="radio" name={key} value={n + 1} checked={scores[key] === n + 1} onChange={() => setScores(s => ({ ...s, [key]: n + 1 }))} required disabled={sending} /><span><b>{n + 1}</b><small>{text}</small></span></label>)}</div>{key !== 'overall' && <label className="ev-na"><input type="radio" name={key} checked={scores[key] === null} onChange={() => setScores(s => ({ ...s, [key]: null }))} disabled={sending} /> No aplica</label>}</fieldset>)}
      <fieldset className="ev-question"><legend>¿Nos recomendarías?</legend><div className="ev-options">{['Sí', 'Tal vez', 'No'].map(text => <label key={text}><input type="radio" name="recommendation" checked={recommendation === text} onChange={() => setRecommendation(text)} required disabled={sending} /><span>{text}</span></label>)}</div></fieldset>
      <label className="ev-field" htmlFor="ev-reference">Nombre o referencia del servicio <small>(opcional)</small></label><input className="ev-text" id="ev-reference" autoComplete="off" value={reference} onChange={e => setReference(e.target.value)} maxLength={80} disabled={sending} />
      <label className="ev-field" htmlFor="ev-comment">¿Qué hicimos bien o qué podríamos mejorar? <small>(opcional)</small></label><textarea className="ev-text" id="ev-comment" rows={4} value={comment} onChange={e => setComment(e.target.value)} maxLength={500} aria-describedby="ev-counter" disabled={sending} /><p id="ev-counter" className="ev-counter">{comment.length}/500 caracteres</p>
      <div className="ev-trap" aria-hidden="true"><label htmlFor="ev-website">Sitio web</label><input id="ev-website" tabIndex={-1} autoComplete="off" value={website} onChange={e => setWebsite(e.target.value)} /></div>
      <p className="ev-privacy">Usaremos tus respuestas para mejorar el servicio. No se publicarán automáticamente. No incluyas contraseñas ni claves de tus equipos.</p>
      {error && <p className="ev-error" role="alert">{error}</p>}<button className="ev-primary" type="submit" disabled={sending} aria-busy={sending}>{sending ? 'Guardando tu evaluación…' : 'Enviar mi evaluación'}</button>
    </form></>}
    <footer className="ev-footer">Mi Pyme Segura · Seguridad a la medida para tu negocio</footer></div></div>;
}
