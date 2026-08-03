const sharp = require('sharp');
const path = require('path');

const src = path.join(__dirname, 'src', 'icon-src', 'icon.svg');
const outDir = path.join(__dirname, 'public', 'icons');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function run() {
  for (const size of sizes) {
    await sharp(src).resize(size, size).png().toFile(path.join(outDir, `icon-${size}x${size}.png`));
    console.log(`icon-${size}x${size}.png`);
  }

  // Maskable icon: same design, safe-zone padding baked in via a larger background.
  await sharp(src).resize(512, 512).png().toFile(path.join(outDir, 'icon-maskable-512x512.png'));
  console.log('icon-maskable-512x512.png');

  // Apple touch icon (no transparency, iOS ignores alpha anyway).
  await sharp(src).resize(180, 180).png().toFile(path.join(__dirname, 'public', 'apple-touch-icon.png'));
  console.log('apple-touch-icon.png');

  // Favicon-sized PNG for good measure.
  await sharp(src).resize(32, 32).png().toFile(path.join(__dirname, 'public', 'favicon-32x32.png'));
  console.log('favicon-32x32.png');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
