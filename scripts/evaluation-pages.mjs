import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';
const html = readFileSync('dist/index.html', 'utf8').replace('<head>', '<head>\n<meta name="robots" content="noindex, nofollow, noarchive">');
writeFileSync('dist/evaluation.html', html);
copyFileSync('data/site_data.json', 'dist/site_data.json');
