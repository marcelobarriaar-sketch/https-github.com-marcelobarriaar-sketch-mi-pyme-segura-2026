import { randomUUID } from 'node:crypto';
import { DEFAULT_FORM, validateForm, type EvaluationForm } from '../shared/evaluation-form.js';
import { redis, prefix, HttpError } from './evaluation-store.js';
export async function getForm(version?: string): Promise<EvaluationForm> {
  if (version === 'original') return DEFAULT_FORM;
  const raw = version ? await redis<string|null>('HGET', `${prefix()}:form-versions`, version) : await redis<string|null>('GET', `${prefix()}:form`);
  if (version && !raw) throw new HttpError(400, 'Actualiza el formulario antes de responder.');
  return raw ? JSON.parse(raw) : DEFAULT_FORM;
}
export async function updateForm(input: unknown, expectedVersion: unknown) {
  let form; try { form = { ...validateForm(input), version: randomUUID() }; } catch(e) { throw new HttpError(400,(e as Error).message); }
  const updated = await redis<number>('EVAL', `local old=redis.call('GET',KEYS[1]);local version='original';if old then version=cjson.decode(old).version end;if version~=ARGV[1] then return 0 end;redis.call('SET',KEYS[1],ARGV[2]);redis.call('HSET',KEYS[2],ARGV[3],ARGV[2]);return 1`, 2, `${prefix()}:form`, `${prefix()}:form-versions`, String(expectedVersion), JSON.stringify(form), form.version);
  if (!updated) throw new HttpError(409,'Otra sesión modificó la encuesta. Actualiza antes de guardar.');
  return form;
}
