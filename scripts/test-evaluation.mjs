import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
if (!process.env.TEST_ENV_FILE) throw Error('Define TEST_ENV_FILE con la ruta a un JSON privado de una base de prueba; nunca uses producción.');
mkdirSync('work', { recursive: true });
await build({ entryPoints: ['tests/evaluation.integration.ts'], outfile: 'work/evaluation-test.mjs', bundle: true, platform: 'node', format: 'esm' });
const result = spawnSync(process.execPath, ['--test', 'work/evaluation-test.mjs'], { stdio: 'inherit', env: process.env });
process.exit(result.status ?? 1);
