/**
 * Builds the alternate launcher icons from assets/shughuli.png.
 *
 * Run: node scripts/generate-app-icons.js
 *
 * The white "S" is lifted out of the current icon and placed on each accent
 * color. Outputs (all under assets/app-icons):
 *   foreground-light.png / foreground-dark.png  Android adaptive foregrounds
 *   ios/<name>.png                              1024px, opaque, for iOS
 *   preview/<name>.png                          small thumbnails for the picker
 *
 * Keep ICONS in sync with src/data/app-icons.ts and the expo-alternate-app-icons
 * entry in app.json.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const Jimp = require('jimp-compact');

const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'assets/shughuli.png');
const OUT = path.join(ROOT, 'assets/app-icons');

const ICONS = [
  { name: 'Coral', bg: '#E15B52' },
  { name: 'Lime', bg: '#C8F06E' },
  { name: 'Blue', bg: '#5B8DEF' },
  { name: 'Rose', bg: '#E58B86' },
  { name: 'Violet', bg: '#A78BDB' },
  { name: 'Moonstone', bg: '#8AA4BE' },
  { name: 'Tangerine', bg: '#E39A45' },
  { name: 'Lavender', bg: '#B7A4E6' },
  { name: 'Blueberry', bg: '#6E8FE8' },
  { name: 'Kale', bg: '#7DAF86' },
  { name: 'Raspberry', bg: '#E58B9A' },
];

const LIGHT_INK = '#FFFFFF';
const DARK_INK = '#1A1A1A';
const MIN_WHITE_CONTRAST = 2;
const CANVAS = 1024;
const PREVIEW = 192;
// The sparkles sit below and beside the "S"; only this region of the 512px source is kept.
const SPARKLE_CUTOFF = 372;
const LETTER_X = [180, 340];
// Share of the canvas the "S" fills. Android crops adaptive icons to roughly the
// middle 61%, so this keeps the letter fully inside the mask.
const LETTER_SPAN = 0.5;

function hexToRgb(hex) {
  const value = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16));
}

function luminance([r, g, b]) {
  const channel = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function smoothstep(edge0, edge1, x) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const out = Buffer.alloc(body.length + 8);
  out.writeUInt32BE(data.length, 0);
  body.copy(out, 4);
  out.writeUInt32BE(crc32(body), body.length + 4);
  return out;
}

/** Writes an opaque 8-bit RGB PNG (no alpha channel), which iOS app icons require. */
function writeOpaquePng(image, file) {
  const { width, height, data } = image.bitmap;
  const stride = width * 3 + 1;
  const raw = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * stride] = 0;
    for (let x = 0; x < width; x += 1) {
      const src = (y * width + x) * 4;
      const dst = y * stride + 1 + x * 3;
      raw[dst] = data[src];
      raw[dst + 1] = data[src + 1];
      raw[dst + 2] = data[src + 2];
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 2;
  fs.writeFileSync(
    file,
    Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk('IHDR', header),
      chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
      chunk('IEND', Buffer.alloc(0)),
    ]),
  );
}

function kebab(name) {
  return name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

async function letterMask(source) {
  const { width, height } = source.bitmap;
  const alpha = new Uint8Array(width * height);
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  source.scan(0, 0, width, height, function (x, y, idx) {
    if (y >= SPARKLE_CUTOFF || x < LETTER_X[0] || x > LETTER_X[1]) return;
    const { data } = this.bitmap;
    const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
    const value = Math.round(smoothstep(70, 190, lum) * 255);
    alpha[y * width + x] = value;
    if (value > 128) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  });
  return { alpha, width, height, box: { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 } };
}

async function foreground({ alpha, width, box }, inkHex) {
  const [r, g, b] = hexToRgb(inkHex);
  const letter = new Jimp(box.w, box.h, 0x00000000);
  letter.scan(0, 0, box.w, box.h, function (x, y, idx) {
    const { data } = this.bitmap;
    data[idx] = r;
    data[idx + 1] = g;
    data[idx + 2] = b;
    data[idx + 3] = alpha[(box.y + y) * width + (box.x + x)];
  });
  const scale = (CANVAS * LETTER_SPAN) / Math.max(box.w, box.h);
  letter.resize(Math.round(box.w * scale), Math.round(box.h * scale), Jimp.RESIZE_BICUBIC);
  const canvas = new Jimp(CANVAS, CANVAS, 0x00000000);
  canvas.composite(
    letter,
    Math.round((CANVAS - letter.bitmap.width) / 2),
    Math.round((CANVAS - letter.bitmap.height) / 2),
  );
  return canvas;
}

function solid(hex, size) {
  const [r, g, b] = hexToRgb(hex);
  return new Jimp(size, size, Jimp.rgbaToInt(r, g, b, 255));
}

async function main() {
  const source = await Jimp.read(SOURCE);
  const mask = await letterMask(source);
  console.log('letter box in source:', mask.box);

  fs.mkdirSync(path.join(OUT, 'ios'), { recursive: true });
  fs.mkdirSync(path.join(OUT, 'preview'), { recursive: true });

  const light = await foreground(mask, LIGHT_INK);
  const dark = await foreground(mask, DARK_INK);
  await light.writeAsync(path.join(OUT, 'foreground-light.png'));
  await dark.writeAsync(path.join(OUT, 'foreground-dark.png'));

  const plugin = [];
  for (const icon of ICONS) {
    const file = kebab(icon.name);
    const rgb = hexToRgb(icon.bg);
    // White letter by default; switch to the dark one only when white would be hard to read.
    const useDark = contrast(rgb, hexToRgb(LIGHT_INK)) < MIN_WHITE_CONTRAST;
    const fg = useDark ? dark : light;

    const full = solid(icon.bg, CANVAS);
    full.composite(fg, 0, 0);
    writeOpaquePng(full, path.join(OUT, 'ios', `${file}.png`));

    const thumb = full.clone().resize(PREVIEW, PREVIEW, Jimp.RESIZE_BICUBIC);
    writeOpaquePng(thumb, path.join(OUT, 'preview', `${file}.png`));

    plugin.push({
      name: icon.name,
      ios: `./assets/app-icons/ios/${file}.png`,
      android: {
        foregroundImage: `./assets/app-icons/foreground-${useDark ? 'dark' : 'light'}.png`,
        backgroundColor: icon.bg,
      },
    });
    console.log(`${icon.name.padEnd(10)} ${icon.bg} ink=${useDark ? 'dark' : 'light'}`);
  }

  const original = source.clone().resize(PREVIEW, PREVIEW, Jimp.RESIZE_BICUBIC);
  writeOpaquePng(original, path.join(OUT, 'preview', 'default.png'));

  const appJsonPath = path.join(ROOT, 'app.json');
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  const plugins = appJson.expo.plugins;
  const at = plugins.findIndex((entry) => [entry, entry[0]].includes('expo-alternate-app-icons'));
  const entry = ['expo-alternate-app-icons', plugin];
  if (at === -1) plugins.push(entry);
  else plugins[at] = entry;
  fs.writeFileSync(appJsonPath, `${JSON.stringify(appJson, null, 2)}\n`);

  console.log('wrote', ICONS.length, 'icons to', path.relative(ROOT, OUT), 'and updated app.json');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
