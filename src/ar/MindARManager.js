// MindAR Integration with Dynamic Multi-Card Anchor Mapping
import { MindARThree } from 'mind-ar/dist/mindar-image-three.prod.js';

export class MindARManager {
  constructor(options = {}) {
    this.container = options.container;
    this.targetPath = options.targetPath || '/cards/targets/targets.mind';
    this.mapPath = '/cards/targets/targets_map.json';
    this.onTargetFound = options.onTargetFound || (() => {});
    this.onTargetLost = options.onTargetLost || (() => {});
    this.mindarThree = null;
    this.isTracking = false;
    this.targetsMap = {};
  }

  async start() {
    try {
      console.log(`[MindAR] Initializing with compiled target: ${this.targetPath}`);
      
      // Fetch dynamic target-to-hero mapping
      try {
        const resp = await fetch(this.mapPath);
        if (resp.ok) {
          this.targetsMap = await resp.json();
          console.log('[MindAR] Loaded targets_map.json:', this.targetsMap);
        }
      } catch (e) {
        console.warn('[MindAR] targets_map.json not found, defaulting index 0 to spiderman');
        this.targetsMap = { '0': 'spiderman' };
      }

      this.mindarThree = new MindARThree({
        container: this.container,
        imageTargetSrc: this.targetPath,
        maxTrack: Math.max(2, Object.keys(this.targetsMap).length),
        filterMinCF: 0.0005, // Cutoff frequency down: eliminates micro-jitter from camera sensor noise
        filterBeta: 0.05,    // Beta down: stops cutoff from spiking violently on sensor noise
        missTolerance: 15,   // Smooth tracking without frame drops
        warmupTolerance: 2,  // Instant target acquisition with ArUco corners
        uiLoading: "no",
        uiScanning: "no",
        uiError: "no"
      });

      const { scene, camera, renderer } = this.mindarThree;

      // Cap pixel ratio to 1.5 to prevent thermal GPU throttling on mobile (Nothing Phone 2a is 2.7 DPR)
      if (renderer) {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      }

      // Dynamically add anchors for each compiled card index
      const targetIndices = Object.keys(this.targetsMap);
      const indicesToSetup = targetIndices.length > 0 ? targetIndices : ['0'];

      indicesToSetup.forEach(idxStr => {
        const index = parseInt(idxStr, 10);
        const heroId = this.targetsMap[idxStr] || 'spiderman';
        const anchor = this.mindarThree.addAnchor(index);

        anchor.onTargetFound = () => {
          console.log(`[MindAR] Card Target #${index} (${heroId}) Found!`);
          this.isTracking = true;
          this.onTargetFound(heroId, anchor.group);
        };

        anchor.onTargetLost = () => {
          console.log(`[MindAR] Card Target #${index} (${heroId}) Lost.`);
          this.isTracking = false;
          this.onTargetLost(heroId);
        };
      });

      await this.mindarThree.start();
      console.log('[MindAR] WebAR Camera Tracking active with multi-card anchors!');
      return { scene, camera, renderer };
    } catch (err) {
      console.warn('[MindAR] Camera access or MindAR initialization failed:', err);
      return null;
    }
  }

  stop() {
    console.log('[MindAR] Stopping tracking and shutting down camera hardware...');
    if (this.mindarThree) {
      try {
        this.mindarThree.stop();
      } catch (e) {
        console.warn('[MindAR] mindarThree.stop() error:', e);
      }
    }
    this.isTracking = false;

    // Explicitly shut down all media stream tracks on any video element in container
    if (this.container) {
      const videos = this.container.querySelectorAll('video');
      videos.forEach(video => {
        if (video.srcObject) {
          try {
            const stream = video.srcObject;
            const tracks = stream.getTracks ? stream.getTracks() : [];
            tracks.forEach(track => {
              track.stop();
              console.log('[MindAR] Camera media track stopped:', track.label);
            });
          } catch (e) {
            console.warn('[MindAR] Error stopping track:', e);
          }
          video.srcObject = null;
        }
        video.remove();
      });

      // Also clean up MindAR's canvas so it doesn't leave ghost elements
      const canvases = this.container.querySelectorAll('canvas');
      canvases.forEach(canvas => {
        // Only remove canvas if it was created by MindAR (keep simulator/scene canvas if distinct)
        if (canvas !== this.container.firstElementChild || canvases.length > 1) {
          canvas.remove();
        }
      });
    }

    this.mindarThree = null;
  }
}
