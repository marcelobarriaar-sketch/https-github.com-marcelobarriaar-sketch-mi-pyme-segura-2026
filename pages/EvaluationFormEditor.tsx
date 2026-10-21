import React, { useState } from 'react';
import { ITEMS } from '../shared/evaluation';
import type { EvaluationForm } from '../shared/evaluation-form';
export default function EvaluationFormEditor({ initial, save, busy }: { initial: EvaluationForm; save: (form: EvaluationForm) => Promise<void>; busy: boolean }) {
  const [draft, setDraft] = useState(initial); const [saved, setSaved] = useState(false);
  return <form className="ev-card" onSubmit={async e => { e.preventDefault(); setSaved(false); try { await save(draft); setSaved(true); } catch { /* El panel muestra el error y conserva el borrador. */ } }}><h2 className="text-xl font-bold">Editar encuesta</h2><p className="ev-note">Los cambios se aplican a nuevos formularios. Las evaluaciones anteriores conservan sus preguntas originales. Mantén el significado de cada aspecto para que los promedios sigan siendo comparables.</p>
    {(['title','intro','thanks'] as const).map((key,i) => <React.Fragment key={key}><label className="ev-field" htmlFor={`edit-${key}`}>{['Título','Texto de bienvenida','Mensaje de agradecimiento'][i]}</label><textarea className="ev-text" id={`edit-${key}`} required rows={key === 'title' ? 2 : 4} maxLength={key === 'title' ? 160 : 800} value={draft[key]} onChange={e => {setSaved(false);setDraft({...draft,[key]:e.target.value});}} disabled={busy}/></React.Fragment>)}
    {ITEMS.map(([key,label]) => <React.Fragment key={key}><label className="ev-field" htmlFor={`edit-${key}`}>{label}</label><input className="ev-text" id={`edit-${key}`} required maxLength={160} value={draft.labels[key]} onChange={e => {setSaved(false);setDraft({...draft,labels:{...draft.labels,[key]:e.target.value}});}} disabled={busy}/></React.Fragment>)}
    <p className="ev-note">Escala fija: 1 a 5. Los datos personales siguen siendo opcionales. El enlace continúa sin aparecer en los menús.</p><button className="ev-primary" disabled={busy}>Guardar cambios de la encuesta</button>{saved && <p role="status">Cambios guardados correctamente.</p>}
  </form>;
}
