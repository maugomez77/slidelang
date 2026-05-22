import { compileDeckToHTML } from './src/dsl/compiler.ts';
import { readFileSync, writeFileSync, readdirSync } from 'fs';

const files = readdirSync('examples').filter(f => f.endsWith('.json'));
for (const file of files) {
  const spec = JSON.parse(readFileSync('examples/' + file, 'utf-8'));
  const html = compileDeckToHTML(spec);
  const outFile = file.replace('.json', '.html');
  writeFileSync('examples/' + outFile, html);
  console.log(outFile + ': ' + html.length + ' chars');
}
