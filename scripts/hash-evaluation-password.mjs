import { randomBytes, scryptSync } from 'node:crypto';
// Accept the password privately via stdin; never put it in a command argument or Git.
let input = ''; for await (const chunk of process.stdin) input += chunk;
const password = input.replace(/\r?\n$/, '');
if (password.length < 14) throw Error('Usa una contraseña de al menos 14 caracteres.');
const salt = randomBytes(16).toString('hex');
process.stdout.write(`${salt}:${scryptSync(password, salt, 64).toString('hex')}\n`);
