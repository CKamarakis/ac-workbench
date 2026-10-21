// Prints the text metadata of an image read from stdin (spec: repo-privacy "Image metadata checked").
// Only metadata blocks are read, never pixel data, so random image bytes can't look like a word:
// PNG tEXt/zTXt/iTXt/eXIf chunks; JPEG APP1-APP15 and comment segments (EXIF, XMP, IPTC); WebP EXIF and XMP chunks.
import { inflateSync } from 'node:zlib';

const runs = buf => (buf.toString('latin1').match(/[\x20-\x7e]{4,}/g) ?? []).join('\n');
const inflate = buf => { try { return inflateSync(buf); } catch { return Buffer.alloc(0); } };

export function imageText(b) {
  const out = [];
  if (b.length > 8 && b.readUInt32BE(0) === 0x89504e47) {
    for (let i = 8; i + 8 <= b.length;) {
      const len = b.readUInt32BE(i), type = b.toString('latin1', i + 4, i + 8), data = b.subarray(i + 8, i + 8 + len);
      if (type === 'tEXt' || type === 'eXIf') out.push(runs(data));
      else if (type === 'zTXt') { const k = data.indexOf(0); out.push(runs(data.subarray(0, k)), runs(inflate(data.subarray(k + 2)))); }
      else if (type === 'iTXt') {
        const k = data.indexOf(0), compressed = data[k + 1] === 1;
        const lang = data.indexOf(0, k + 3), tkey = data.indexOf(0, lang + 1), text = data.subarray(tkey + 1);
        out.push(runs(data.subarray(0, tkey)), compressed ? inflate(text).toString('utf8') : text.toString('utf8'));
      }
      if (type === 'IEND') break;
      i += 12 + len;
    }
  } else if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8) {
    for (let i = 2; i + 4 <= b.length && b[i] === 0xff;) {
      const marker = b[i + 1], len = b.readUInt16BE(i + 2);
      if (marker === 0xda) break; // start of scan: pixel data follows
      if ((marker >= 0xe1 && marker <= 0xef) || marker === 0xfe) out.push(runs(b.subarray(i + 4, i + 2 + len)));
      i += 2 + len;
    }
  } else if (b.length > 12 && b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP') {
    for (let i = 12; i + 8 <= b.length;) {
      const type = b.toString('latin1', i, i + 4), len = b.readUInt32LE(i + 4);
      if (type === 'EXIF' || type === 'XMP ') out.push(runs(b.subarray(i + 8, i + 8 + len)));
      i += 8 + len + (len % 2);
    }
  }
  return out.filter(Boolean).join('\n');
}

if (process.argv[1]?.endsWith('image-text.mjs')) {
  const chunks = [];
  process.stdin.on('data', c => chunks.push(c)).on('end', () => process.stdout.write(imageText(Buffer.concat(chunks)) + '\n'));
}
