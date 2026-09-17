// Character Loader & Animation Mixer Controller with Solid Material Fix
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class CharacterController {
  constructor(scene) {
    this.scene = scene;
    this.model = null;
    this.mixer = null;
    this.actions = {};
    this.currentAction = null;
    this.currentModelUrl = null;
    this.loader = new GLTFLoader();
    this.isLoaded = false;
  }

  loadModel(url, onLoaded = null) {
    if (this.currentModelUrl === url && this.model) {
      if (onLoaded) onLoaded(this);
      return;
    }

    this.currentModelUrl = url;
    console.log(`[Character] Loading 3D model from ${url}...`);

    this.loader.load(
      url,
      (gltf) => {
        if (this.model && this.model.parent) {
          this.model.parent.remove(this.model);
        }

        this.model = gltf.scene;
        this.model.position.set(0, 0, 0);
        // Increase character scale from 0.32 to 0.78 for prominent, heroic stature on top of card
        this.baseScale = 0.78;
        this.model.scale.set(this.baseScale, this.baseScale, this.baseScale);
        this.model.visible = false; // Hidden until card is scanned!

        // Fix Blender glTF 'alphaMode: BLEND' transparency bug
        this.model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            if (child.material) {
              const fix = (m) => {
                m.transparent = false;
                m.opacity = 1.0;
                m.depthWrite = true;
                m.depthTest = true;
                m.side = THREE.FrontSide;
                m.needsUpdate = true;
              };

              if (Array.isArray(child.material)) {
                child.material.forEach(fix);
              } else {
                fix(child.material);
              }
            }
          }
        });

        this.actions = {};
        this.mixer = new THREE.AnimationMixer(this.model);

        // Map animation clips
        gltf.animations.forEach((clip) => {
          this.actions[clip.name] = this.mixer.clipAction(clip);
        });

        this.isLoaded = true;
        console.log(`[Character] Model ${url} loaded with animations:`, Object.keys(this.actions));

        if (onLoaded) onLoaded(this);
      },
      undefined,
      (error) => {
        console.error('Error loading character model:', error);
      }
    );
  }

  playAction(name, loop = true, onFinish = null, duration = 0.2) {
    if (!this.actions || !this.mixer) return;

    // Schema aliasing
    let action = this.actions[name];
    if (!action) {
      if (name === 'Attack_Ultimate') action = this.actions['Attack_Standard'];
      else if (name === 'Hit_Medium') action = this.actions['Hit_Mid'] || this.actions['Hit_Heavy'];
      else if (name === 'Hit_Heavy') action = this.actions['Hit_Heavy'] || this.actions['Hit_High'];
      else if (name === 'Intro' && !action) action = this.actions['Idle'];
    }

    if (!action) {
      console.warn(`Animation action ${name} not found.`);
      if (onFinish) onFinish();
      return;
    }

    if (this.currentAction === action && loop) return;

    action.reset();
    action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce);
    action.clampWhenFinished = !loop;

    if (this.currentAction) {
      this.currentAction.fadeOut(duration);
    }
    action.fadeIn(duration).play();
    this.currentAction = action;

    if (!loop) {
      const onFinished = (e) => {
        if (e.action === action) {
          this.mixer.removeEventListener('finished', onFinished);
          if (onFinish) onFinish();
        }
      };
      this.mixer.addEventListener('finished', onFinished);
    }
  }

  onCardDetected() {
    if (this.model) {
      this.model.visible = true;
    }
    this.playAction('Intro', false, () => {
      this.playAction('Idle', true);
    });
  }

  onAttack(isUltimate = false, onFinish = null) {
    const anim = isUltimate ? 'Attack_Ultimate' : 'Attack_Standard';
    this.playAction(anim, false, () => {
      this.playAction('Idle', true);
      if (onFinish) onFinish();
    });
  }

  onTakeDamage(amount, hpRemaining, onFinish = null) {
    let hitAnim = 'Hit_Low';
    if (amount >= 30 && amount <= 55) {
      hitAnim = 'Hit_Mid';
    } else if (amount > 55) {
      hitAnim = 'Hit_Heavy';
    }

    this.playAction(hitAnim, false, () => {
      if (hpRemaining <= 0) {
        this.playAction('Die', false);
      } else {
        this.playAction('Idle', true);
      }
      if (onFinish) onFinish();
    });
  }

  onVictory() {
    this.playAction('Win', true);
  }

  onDefeat() {
    this.playAction('Die', false);
  }

  update(delta) {
    if (this.mixer) {
      this.mixer.update(delta);
    }
  }
}
