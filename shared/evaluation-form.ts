import { ITEMS, type Item } from './evaluation.js';
export type EvaluationForm = { title: string; intro: string; thanks: string; labels: Record<Item, string>; version: string };
export const DEFAULT_FORM: EvaluationForm = {
  title: '¿Cómo fue tu experiencia con Mi Pyme Segura?',
  intro: 'Gracias por confiar en nosotros. Responder esta breve encuesta nos ayuda a mejorar nuestras instalaciones y la atención que te entregamos. Te tomará menos de un minuto.',
  thanks: 'Gracias por ayudarnos a mejorar. Tu tranquilidad y confianza nos motivan a seguir entregando un mejor servicio.',
  labels: Object.fromEntries(ITEMS) as Record<Item,string>, version: 'original',
};
export function validateForm(value: unknown): Omit<EvaluationForm,'version'> {
  const v = value as EvaluationForm;
  if (!v || typeof v !== 'object') throw Error('Revisa los textos de la encuesta.');
  const text = (s: unknown, max: number) => { if (typeof s !== 'string' || !s.trim() || s.length > max) throw Error(`Completa todos los textos y respeta el máximo de ${max} caracteres.`); return s.trim(); };
  return { title: text(v.title, 160), intro: text(v.intro, 800), thanks: text(v.thanks, 800), labels: Object.fromEntries(ITEMS.map(([k]) => [k,text(v.labels?.[k],160)])) as Record<Item,string> };
}
