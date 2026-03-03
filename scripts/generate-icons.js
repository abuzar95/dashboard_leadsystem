const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const svgPath = path.join(__dirname, '../public/icons/icon.svg')
const outDir = path.join(__dirname, '../public/icons')

const sizes = [192, 384, 512]

;(async () => {
  const svg = fs.readFileSync(svgPath)
  for (const size of sizes) {
    await sharp(svg)
      .resize(size, size)
      .png()
      .toFile(path.join(outDir, `icon-${size}x${size}.png`))
    console.log(`Generated icon-${size}x${size}.png`)
  }
})().catch(console.error)
