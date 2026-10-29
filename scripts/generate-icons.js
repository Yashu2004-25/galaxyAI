import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

const root = process.cwd();
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><rect width="1024" height="1024" rx="220" fill="#0A1A2F"/><path fill="#1E4FD8" d="M250 772c56-37 91-88 106-153l44-192c20-91 87-155 194-172l-5 64 129-94-113-105-2 53c-156 6-263 88-296 236l-43 191c-12 52-40 90-78 111l64 61Zm216-245 139 27 90-86-110-47-104 23-15 83Zm178 47 100-41-15 158-141 79-106-37 78-83 84-11Z"/><path fill="#E8EEFB" d="M306 768c47-39 71-86 87-156l41-187c16-74 63-125 136-150-61 37-95 81-108 151l-42 189c-15 71-38 120-78 159l-36-6Z" opacity=".92"/><circle cx="572" cy="376" r="19" fill="#E8EEFB"/></svg>`;
await mkdir(path.join(root, 'public'), { recursive: true });
await mkdir(path.join(root, 'build'), { recursive: true });
await writeFile(path.join(root, 'public', 'knight.svg'), svg);
const iconPng = path.join(root, 'build', 'icon.png');
await sharp(Buffer.from(svg)).resize(1024, 1024).png().toFile(iconPng);
const paths = [...svg.matchAll(/<path[^>]*\/>/g)].map((match) => match[0]);
const foreground = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${paths.join('')}</svg>`;
await writeFile(path.join(root, 'public', 'knight-foreground.svg'), foreground);
const ico = await pngToIco([await sharp(iconPng).resize(256).png().toBuffer(), await sharp(iconPng).resize(128).png().toBuffer(), await sharp(iconPng).resize(64).png().toBuffer(), await sharp(iconPng).resize(48).png().toBuffer(), await sharp(iconPng).resize(32).png().toBuffer(), await sharp(iconPng).resize(16).png().toBuffer()]);
await writeFile(path.join(root, 'build', 'icon.ico'), ico);
const androidSizes = { 'mipmap-mdpi': 48, 'mipmap-hdpi': 72, 'mipmap-xhdpi': 96, 'mipmap-xxhdpi': 144, 'mipmap-xxxhdpi': 192 };
for (const [folder, size] of Object.entries(androidSizes)) {
  const target = path.join(root, 'build', 'android-icons', folder); await mkdir(target, { recursive: true });
  const buffer = await sharp(iconPng).resize(size).png().toBuffer(); await writeFile(path.join(target, 'ic_launcher.png'), buffer); await writeFile(path.join(target, 'ic_launcher_round.png'), buffer);
}
console.log('Generated knight SVG, Windows ICO, and Android launcher icons in build/android-icons.');
