import path from 'path';
import fs from 'fs';
import { PNG } from 'pngjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function test() {
  console.log("Loading modules...");
  await import('./node_modules/mind-ar/src/image-target/detector/kernels/cpu/index.js');
  const { CompilerBase } = await import('./node_modules/mind-ar/src/image-target/compiler-base.js');
  const { buildTrackingImageList, buildImageList } = await import('./node_modules/mind-ar/src/image-target/image-list.js');
  const { extractTrackingFeatures } = await import('./node_modules/mind-ar/src/image-target/tracker/extract-utils.js');

  console.log("Modules loaded successfully!");
}

test().catch(console.error);
