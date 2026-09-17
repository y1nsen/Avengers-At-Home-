import path from 'path';
import fs from 'fs';
import { PNG } from 'pngjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function compileAllCards() {
  console.log('[MindAR Compiler] Scanning public/cards/images for card artwork...');
  const imagesDir = path.resolve(__dirname, 'public/cards/images');
  const files = fs.readdirSync(imagesDir).filter(f => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg'));

  if (files.length === 0) {
    console.error('[MindAR Compiler] No image files found in public/cards/images');
    process.exit(1);
  }

  // Sort files for deterministic index ordering
  files.sort();
  console.log(`[MindAR Compiler] Found ${files.length} card images:`, files);

  await import('./node_modules/mind-ar/src/image-target/detector/kernels/cpu/index.js');
  const { CompilerBase } = await import('./node_modules/mind-ar/src/image-target/compiler-base.js');
  const { buildTrackingImageList, buildImageList } = await import('./node_modules/mind-ar/src/image-target/image-list.js');
  const { extractTrackingFeatures } = await import('./node_modules/mind-ar/src/image-target/tracker/extract-utils.js');
  const { Detector } = await import('./node_modules/mind-ar/src/image-target/detector/detector.js');
  const { build: hierarchicalClusteringBuild } = await import('./node_modules/mind-ar/src/image-target/matching/hierarchical-clustering.js');
  const tf = (await import('@tensorflow/tfjs')).default || await import('@tensorflow/tfjs');

  class MindNodeCompiler extends CompilerBase {
    async compileFromRaw(targetImages, progressCallback) {
      this.data = [];
      const percentPerImage = 50.0 / targetImages.length;
      let percent = 0.0;

      for (let i = 0; i < targetImages.length; i++) {
        const targetImage = targetImages[i];
        const imageList = buildImageList(targetImage);
        const percentPerAction = percentPerImage / imageList.length;

        const keyframes = [];
        for (let j = 0; j < imageList.length; j++) {
          const image = imageList[j];
          const detector = new Detector(image.width, image.height);
          await tf.nextFrame();

          tf.tidy(() => {
            const inputT = tf.tensor(image.data, [image.data.length], 'float32').reshape([image.height, image.width]);
            const { featurePoints: ps } = detector.detect(inputT);

            const maximaPoints = ps.filter(p => p.maxima);
            const minimaPoints = ps.filter(p => !p.maxima);
            const maximaPointsCluster = hierarchicalClusteringBuild({ points: maximaPoints });
            const minimaPointsCluster = hierarchicalClusteringBuild({ points: minimaPoints });

            keyframes.push({
              maximaPoints,
              minimaPoints,
              maximaPointsCluster,
              minimaPointsCluster,
              width: image.width,
              height: image.height,
              scale: image.scale
            });

            percent += percentPerAction;
            if (progressCallback) progressCallback(Math.round(percent));
          });
        }

        this.data.push({
          targetImage,
          imageList,
          matchingData: keyframes
        });
      }

      // Tracking images
      for (let i = 0; i < targetImages.length; i++) {
        this.data[i].trackingImageList = buildTrackingImageList(targetImages[i]);
      }

      // Tracking features
      const percentPerTrack = 50.0 / targetImages.length;
      for (let i = 0; i < targetImages.length; i++) {
        const targetImage = targetImages[i];
        const imageList = buildTrackingImageList(targetImage);
        const percentPerAction = percentPerTrack / imageList.length;

        const trackingData = extractTrackingFeatures(imageList, () => {
          percent += percentPerAction;
          if (progressCallback) progressCallback(Math.round(percent));
        });

        this.data[i].trackingData = trackingData;
      }

      return this.data;
    }
  }

  const targetImages = [];
  const targetsMap = {};

  for (let idx = 0; idx < files.length; idx++) {
    const fileName = files[idx];
    const heroId = path.parse(fileName).name.toLowerCase().replace(/[^a-z0-9]/g, '');
    targetsMap[idx] = heroId;

    const imgPath = path.join(imagesDir, fileName);
    const fileBuffer = fs.readFileSync(imgPath);
    const png = PNG.sync.read(fileBuffer);
    console.log(`[MindAR Compiler] Index ${idx} -> ${heroId} (${png.width}x${png.height})`);

    const greyImageData = new Uint8Array(png.width * png.height);
    for (let i = 0; i < greyImageData.length; i++) {
      const offset = i * 4;
      greyImageData[i] = Math.floor((png.data[offset] + png.data[offset + 1] + png.data[offset + 2]) / 3);
    }

    targetImages.push({
      data: greyImageData,
      width: png.width,
      height: png.height
    });
  }

  const compiler = new MindNodeCompiler();
  await compiler.compileFromRaw(targetImages, (p) => {
    process.stdout.write(`\r[MindAR Compiler] Compiling features: ${p}%`);
  });

  console.log('\n[MindAR Compiler] Exporting targets.mind and targets_map.json...');
  const buffer = compiler.exportData();

  const outDir = path.resolve(__dirname, 'public/cards/targets');
  fs.mkdirSync(outDir, { recursive: true });

  const outPath = path.join(outDir, 'targets.mind');
  fs.writeFileSync(outPath, buffer);

  const mapPath = path.join(outDir, 'targets_map.json');
  fs.writeFileSync(mapPath, JSON.stringify(targetsMap, null, 2));

  console.log(`[MindAR Compiler] targets.mind written (${buffer.length} bytes)`);
  console.log(`[MindAR Compiler] targets_map.json written:`, targetsMap);
}

compileAllCards().catch(err => {
  console.error('\n[MindAR Compiler] Error:', err);
  process.exit(1);
});
