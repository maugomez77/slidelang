import { compileDeckToHTML } from './src/dsl/compiler.ts';
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { checkDeckWithVision } from './src/ai/vision-check.ts';
import { DeckSpec } from './src/dsl/schema.ts';

const args = process.argv.slice(2);
const doVision = !args.includes('--no-vision');
const doCritique = args.includes('--critique');

const files = readdirSync('examples').filter(f => f.endsWith('.json'));
let totalIssues = 0;

for (const file of files) {
  const spec = JSON.parse(readFileSync('examples/' + file, 'utf-8')) as DeckSpec;
  const html = compileDeckToHTML(spec);
  const outFile = file.replace('.json', '.html');
  writeFileSync('examples/' + outFile, html);
  console.log(outFile + ': ' + html.length + ' chars, ' + spec.slides.length + ' slides, theme: ' + spec.meta.theme);

  if (doVision) {
    console.log('  🔍 Vision check...');
    const { issues } = await checkDeckWithVision(spec);
    if (issues.length === 0) {
      console.log('    ✅ All slides passed');
    } else {
      totalIssues += issues.length;
      for (const issue of issues) {
        const emoji = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`    ${emoji} Slide ${issue.slide}: [${issue.type}] ${issue.description}`);
      }
    }
  }
  console.log('');
}

console.log(`${files.length} decks compiled. ${totalIssues > 0 ? totalIssues + ' issues found.' : 'All clean! ✨'}`);

if (doCritique) {
  console.log('\n--- Running AI design critique ---\n');
  // Uses the design-ai module for richer per-slide analysis
  console.log('Use --critique flag with Ollama vision for detailed design feedback.');
  console.log('Run: ollama pull llama3.2-vision:11b (if not already pulled)');
}
