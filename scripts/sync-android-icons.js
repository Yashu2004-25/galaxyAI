import { cp, mkdir } from 'node:fs/promises';
import path from 'node:path';

const source = path.resolve('build/android-icons');
const target = path.resolve('android/app/src/main/res');
try {
  await mkdir(target, { recursive: true });
  for (const folder of ['mipmap-mdpi', 'mipmap-hdpi', 'mipmap-xhdpi', 'mipmap-xxhdpi', 'mipmap-xxxhdpi']) {
    await cp(path.join(source, folder), path.join(target, folder), { recursive: true, force: true });
  }
  console.log('Synced Android launcher icons.');
} catch (error) {
  if (error.code === 'ENOENT') { console.log('Android platform not generated yet; run npm run icons after npx cap add android.'); }
  else throw error;
}
