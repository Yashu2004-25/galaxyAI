import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

const root = process.cwd();
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><defs><radialGradient id="glow"><stop offset="0" stop-color="#07111f"/><stop offset=".26" stop-color="#07111f"/><stop offset=".28" stop-color="#8ce6ff"/><stop offset=".39" stop-color="#3864f5"/><stop offset=".53" stop-color="#cb8eff"/><stop offset=".68" stop-color="#24c9d8"/><stop offset=".82" stop-color="#132b64"/><stop offset="1" stop-color="#0a1a2f"/></radialGradient></defs><rect width="1024" height="1024" rx="220" fill="#0A1A2F"/><ellipse cx="512" cy="512" rx="365" ry="205" fill="none" stroke="#76dfff" stroke-width="38" transform="rotate(-17 512 512)"/><ellipse cx="512" cy="512" rx="340" ry="178" fill="none" stroke="#9b75ff" stroke-width="22" transform="rotate(14 512 512)"/><circle cx="512" cy="512" r="218" fill="url(#glow)"/><circle cx="512" cy="512" r="112" fill="#050912"/><circle cx="572" cy="453" r="24" fill="#fff" opacity=".9"/></svg>`;
await mkdir(path.join(root, 'public'), { recursive: true });
await mkdir(path.join(root, 'build'), { recursive: true });
await writeFile(path.join(root, 'public', 'black-hole.svg'), svg);
const iconPng = path.join(root, 'build', 'icon.png');
await sharp(Buffer.from(svg)).resize(1024, 1024).png().toFile(iconPng);
const paths = [...svg.matchAll(/<path[^>]*\/>/g)].map((match) => match[0]);
const foreground = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${paths.join('')}</svg>`;
await writeFile(path.join(root, 'public', 'black-hole-foreground.svg'), foreground);
const ico = await pngToIco([await sharp(iconPng).resize(256).png().toBuffer(), await sharp(iconPng).resize(128).png().toBuffer(), await sharp(iconPng).resize(64).png().toBuffer(), await sharp(iconPng).resize(48).png().toBuffer(), await sharp(iconPng).resize(32).png().toBuffer(), await sharp(iconPng).resize(16).png().toBuffer()]);
await writeFile(path.join(root, 'build', 'icon.ico'), ico);
const androidSizes = { 'mipmap-mdpi': 48, 'mipmap-hdpi': 72, 'mipmap-xhdpi': 96, 'mipmap-xxhdpi': 144, 'mipmap-xxxhdpi': 192 };
for (const [folder, size] of Object.entries(androidSizes)) {
  const target = path.join(root, 'build', 'android-icons', folder); await mkdir(target, { recursive: true });
  const buffer = await sharp(iconPng).resize(size).png().toBuffer(); await writeFile(path.join(target, 'ic_launcher.png'), buffer); await writeFile(path.join(target, 'ic_launcher_round.png'), buffer);
}
console.log('Generated black hole SVG, Windows ICO, and Android launcher icons in build/android-icons.');
