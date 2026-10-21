export const ITEMS = [
  ['attention', 'Atención y trato recibido.'],
  ['punctuality', 'Puntualidad y cumplimiento de lo acordado.'],
  ['care', 'Orden y cuidado durante la instalación.'],
  ['explanation', 'Explicación del funcionamiento de los equipos.'],
  ['overall', 'Satisfacción general con el servicio.'],
] as const;
export type Item = typeof ITEMS[number][0];
export const LABELS = ['Muy insatisfecho', 'Insatisfecho', 'Ni satisfecho ni insatisfecho', 'Satisfecho', 'Muy satisfecho'];
export type EvaluationInput = { scores: Record<Item, number | null>; recommendation: 'Sí' | 'Tal vez' | 'No'; reference: string; comment: string };
export type Evaluation = EvaluationInput & { id: string; createdAt: string; form?: import('./evaluation-form.js').EvaluationForm; notification: { status: string; channel?: string; attempt?: string; messageId?: string; updatedAt: string; errorCode?: string } };
export function validateInput(value: unknown): EvaluationInput {
  const v = value as EvaluationInput;
  if (!v || typeof v !== 'object' || !v.scores || typeof v.scores !== 'object' || Array.isArray(v.scores)) throw Error('Completa las cinco valoraciones.');
  for (const [key] of ITEMS) {
    const score = v.scores[key];
    if (!(Number.isInteger(score) && Number(score) >= 1 && Number(score) <= 5) && !(score === null && key !== 'overall')) throw Error('Completa las cinco valoraciones con valores válidos.');
  }
  if (!['Sí', 'Tal vez', 'No'].includes(v.recommendation)) throw Error('Indica si nos recomendarías.');
  if (typeof v.reference !== 'string' || v.reference.length > 80 || typeof v.comment !== 'string' || v.comment.length > 500) throw Error('Revisa la extensión de la referencia o el comentario.');
  return { scores: Object.fromEntries(ITEMS.map(([k]) => [k, v.scores[k]])) as EvaluationInput['scores'], recommendation: v.recommendation, reference: v.reference.trim(), comment: v.comment.trim() };
}
export const chileDate = (iso: string) => new Intl.DateTimeFormat('es-CL', { timeZone: 'America/Santiago', dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso));
export function csvCell(value: unknown) {
  const s = String(value ?? '');
  return '"' + (/^[\s]*[=+\-@\t\r]/.test(s) ? "'" + s : s).replace(/"/g, '""') + '"';
}
