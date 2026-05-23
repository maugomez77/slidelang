import { createDemoVideo } from './src/ai/video-generator.ts'
import { readFileSync } from 'fs'
import { DeckSpec } from './src/dsl/schema.ts'

const args = process.argv.slice(2)
const inputFile = args[0] || 'examples/pitch-deck.json'
const outputFile = args[1] || 'demo-video.mp4'
const voice = args[2] || undefined

const spec = JSON.parse(readFileSync(inputFile, 'utf-8')) as DeckSpec

console.log(`Creating demo video from: ${inputFile}`)
console.log(`Output: ${outputFile}`)
console.log(`Voice: ${voice || 'Daniel (default)'}`)
console.log(`Slides: ${spec.slides.length}`)
console.log(`Theme: ${spec.meta.theme}`)
console.log('')

createDemoVideo(spec, { outputPath: outputFile, voice })
  .then((path) => {
    console.log(`\nDone! Video saved to: ${path}`)
  })
  .catch((err) => {
    console.error('Video generation failed:', err)
    process.exit(1)
  })
