import { compileDeckToHTML } from './src/dsl/compiler.ts';
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { checkDeckWithVision } from './src/ai/vision-check.ts';
import { DeckSpec } from './src/dsl/schema.ts';

const args = process.argv.slice(2);
const doVision = args.includes('--vision') || args.includes('-v');

const files = readdirSync('examples').filter(f => f.endsWith('.json'));
for (const file of files) {
  const spec = JSON.parse(readFileSync('examples/' + file, 'utf-8')) as DeckSpec;
  const html = compileDeckToHTML(spec);
  const outFile = file.replace('.json', '.html');
  writeFileSync('examples/' + outFile, html);
  console.log(outFile + ': ' + html.length + ' chars');
}

if (doVision) {
  console.log('\n--- Running vision quality checks ---\n');
  for (const file of files) {
    const spec = JSON.parse(readFileSync('examples/' + file, 'utf-8')) as DeckSpec;
    console.log(`Checking ${file}...`);
    const { issues } = await checkDeckWithVision(spec);
    if (issues.length === 0) {
      console.log(`  ✅ No issues found`);
    } else {
      for (const issue of issues) {
        const emoji = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`  ${emoji} Slide ${issue.slide}: [${issue.type}] ${issue.description}`);
      }
    }
  }
}
