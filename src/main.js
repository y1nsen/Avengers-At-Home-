// Main Game Entry Point - Marvel AR Card Battler
import * as THREE from 'three';
import { ThreeScene } from './renderer/ThreeScene.js';
import { CharacterController } from './renderer/CharacterController.js';
import { VFXManager } from './renderer/VFXManager.js';
import { CombatEngine } from './combat/CombatEngine.js';
import { AIBrain } from './combat/AIBrain.js';
import { cloneHero, HEROES_LIST } from './combat/HeroData.js';
import { UIManager } from './ui/UIManager.js';
import { MindARManager } from './ar/MindARManager.js';
import { ARSimulator } from './ar/ARSimulator.js';
import { TrackingPersistenceManager } from './ar/TrackingPersistenceManager.js';
import { NetworkManager } from './network/NetworkManager.js';

class GameApp {
  constructor() {
    this.container = document.getElementById('three-container');
    this.clock = new THREE.Clock();

    // 1. Initialize 3D Engine
    this.threeScene = new ThreeScene(this.container);
    this.character = new CharacterController(this.threeScene.scene);
    this.vfx = new VFXManager(this.threeScene.scene);

    // 2. Initialize Combat & AI Engine
    this.combat = new CombatEngine({
      onStateChange: state => this.ui.updateCombatHUD(state),
      onCombatEvent: event => this.handleCombatEvent(event)
    });
    this.ai = new AIBrain(this.combat);

    // 3. Tracking Persistence Manager (SLAM Gyroscope Fallback)
    this.persistence = new TrackingPersistenceManager({
      persistenceTimeoutMs: 2500,
      onPersistenceExpired: () => {
        if (this.ui && this.ui.screens.cardScan && this.ui.screens.cardScan.classList.contains('active')) {
          this.ui.setScanState(false);
        }
      },
      onTrackingRestored: () => {
        if (this.ui && this.ui.screens.cardScan && this.ui.screens.cardScan.classList.contains('active')) {
          this.ui.setScanState(true);
        }
      }
    });

    // 4. Setup AR & Simulator (Multi-card anchor tracking)
    this.mindAR = new MindARManager({
      container: this.container,
      onTargetFound: (heroId, anchorGroup) => this.handleCardDetected(heroId, anchorGroup),
      onTargetLost: (heroId) => this.handleCardLost(heroId)
    });

    this.arSimulator = new ARSimulator({
      onTargetFound: () => this.handleSimulatedCardDetected(),
      onTargetLost: () => console.log('[Simulator] Card removed')
    });

    this.isArActive = false;
    this.arData = null;
    this.activeHero = null;
    this.targetHeroId = null;
    this.cardLostTimeout = null;

    // 4. Network Manager
    this.network = new NetworkManager();
    this.network.connect();
    this.network.on('matchAborted', data => {
      alert(data.reason || 'Match ended.');
      this.stopARCamera();
      this.ui.switchScreen('landing');
    });

    // 5. UI Manager
    this.ui = new UIManager({
      onStartGame: selectedIds => this.startGame(selectedIds),
      onAttackClick: () => this.playerAttack(false),
      onUltimateClick: () => this.playerAttack(true),
      onInterceptChoice: action => this.combat.declareIntercept(action),
      onTacticalSwapClick: hero => this.handleManualSwap(hero),
      onModeToggle: () => this.toggleARMode(),
      onSimulateCard: () => this.arSimulator.simulateCardDetection(),
      onScanCancel: () => this.stopARCamera(),
      onScanPlay: () => this.onScanPlay(),
      onExitGame: () => this.stopARCamera()
    });

    // Start rendering loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  async startGame(selectedIds) {
    const playerSquad = selectedIds.map(id => cloneHero(id));
    this.activeHero = playerSquad[0];
    this.targetHeroId = this.activeHero.id; // STRICT: Only this hero's card will be tracked!
    console.log(`[GameApp] Starting match. Active vanguard: ${this.activeHero.name} (target card: ${this.targetHeroId})`);

    // Pick 3 AI heroes from remaining roster
    const remaining = HEROES_LIST.filter(h => !selectedIds.includes(h.id));
    const aiSelection = remaining.slice(0, 3).map(h => cloneHero(h.id));

    this.combat.initMatch(playerSquad, aiSelection, 'player');

    // Dynamically load the 3D model for the selected active hero (Spider-Man or Thor)
    const modelPath = this.activeHero.model || (this.targetHeroId === 'thor' ? '/assets/characters/thor/Thor.glb' : '/assets/characters/spiderman/spiderman.glb');
    this.character.loadModel(modelPath);

    // Activate WebAR camera & card scanning
    await this.startARCamera();
  }

  async startARCamera() {
    console.log(`[GameApp] Starting WebAR Camera for Card Scanning (target: ${this.targetHeroId})...`);
    document.body.classList.add('ar-active');
    this.threeScene.grid.visible = false;
    this.threeScene.contactShadow.visible = false;

    // Hide simulator canvas so it doesn't block the video stream or AR canvas
    if (this.threeScene.renderer && this.threeScene.renderer.domElement) {
      this.threeScene.renderer.domElement.style.display = 'none';
    }

    const started = await this.mindAR.start();
    if (started) {
      this.isArActive = true;
      this.arData = started; // { scene, camera, renderer }

      // Add lights to AR scene so 3D character models are well illuminated
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.3);
      this.arData.scene.add(ambientLight);
      const dirLight = new THREE.DirectionalLight(0xffffff, 1.7);
      dirLight.position.set(0, 5, 5);
      this.arData.scene.add(dirLight);

      this.vfx.scene = this.arData.scene;
    } else {
      console.warn('[GameApp] WebAR could not start, keeping simulator available.');
      if (this.threeScene.renderer && this.threeScene.renderer.domElement) {
        this.threeScene.renderer.domElement.style.display = 'block';
      }
      this.threeScene.grid.visible = true;
    }
  }

  handleCardDetected(heroId, anchorGroup) {
    // STRICT FILTER: Each character ONLY spawns on their own card!
    if (this.targetHeroId && heroId !== this.targetHeroId) {
      console.log(`[GameApp] Card '${heroId}' ignored. Waiting for active hero: '${this.targetHeroId}'`);
      return;
    }

    console.log(`[GameApp] Card Confirmed for ${heroId}! Spawning ${heroId} model...`);
    if (this.cardLostTimeout) {
      clearTimeout(this.cardLostTimeout);
      this.cardLostTimeout = null;
    }

    // Switch Card Scan Screen to Scanned State (Green border + Play button)
    this.ui.setScanState(true);
    this.ui.hideScanningReticle();

    // Map scanned card to the matching hero model
    const hero = HEROES_LIST.find(h => h.id === heroId) || this.activeHero;
    const modelPath = (hero && hero.model) ? hero.model : (heroId === 'thor' ? '/assets/characters/thor/Thor.glb' : '/assets/characters/spiderman/spiderman.glb');

    const spawnOnAnchor = () => {
      if (this.character.model) {
        if (anchorGroup) {
          anchorGroup.add(this.character.model);
          // Rotate 90 deg around X so the model stands upright on the tracked horizontal card
          this.character.model.rotation.x = Math.PI / 2;
          this.character.model.position.set(0, 0, 0);
        }
        this.character.model.visible = true;
        this.character.onCardDetected();

        // Register model and anchor with SLAM Gyroscope Persistence Manager
        this.persistence.attach(this.character.model, anchorGroup);
        this.persistence.onTargetFound(anchorGroup);
      }
    };

    if (this.character.currentModelUrl !== modelPath) {
      this.character.loadModel(modelPath, () => {
        spawnOnAnchor();
      });
    } else {
      spawnOnAnchor();
    }
  }

  handleCardLost(heroId) {
    if (this.targetHeroId && heroId !== this.targetHeroId) return;

    console.log(`[GameApp] Card Lost signal for ${heroId}. Activating SLAM Gyroscope Fallback.`);
    // Keep model pinned in physical space via gyroscope persistence instead of instant disappearance
    this.persistence.onTargetLost();
  }

  onScanPlay() {
    console.log('[GameApp] Card confirmed. Entering Combat HUD.');
    this.ui.hideScanningReticle();
  }

  stopARCamera() {
    console.log('[GameApp] Stopping AR Camera and releasing hardware...');
    if (this.persistence) {
      this.persistence.reset();
    }
    if (this.mindAR) {
      this.mindAR.stop();
    }
    this.isArActive = false;
    this.arData = null;
    document.body.classList.remove('ar-active');

    if (this.character && this.character.model) {
      this.character.model.visible = false;
      if (this.character.model.parent) {
        this.character.model.parent.remove(this.character.model);
      }
    }

    if (this.threeScene && this.threeScene.renderer && this.threeScene.renderer.domElement) {
      this.threeScene.renderer.domElement.style.display = 'block';
    }
    if (this.threeScene && this.threeScene.grid) {
      this.threeScene.grid.visible = true;
    }
    if (this.ui) {
      this.ui.setScanState(false);
      this.ui.hideScanningReticle();
    }
  }

  handleSimulatedCardDetected() {
    console.log('[GameApp] Simulated Card Detected!');
    this.ui.hideScanningReticle();

    if (this.character.model) {
      if (this.isArActive && this.arData) {
        this.arData.scene.add(this.character.model);
        this.character.model.rotation.x = 0;
        this.character.model.position.set(0, -0.1, -1.2);
      } else {
        this.threeScene.scene.add(this.character.model);
        this.threeScene.scene.add(this.threeScene.contactShadow);
        this.character.model.rotation.x = 0;
        this.character.model.position.set(0, 0, 0);
        this.threeScene.contactShadow.visible = true;
      }
      this.character.model.visible = true;
      this.character.onCardDetected();
    }
  }

  playerAttack(isUltimate) {
    const declared = this.combat.declareAttack(isUltimate);
    if (!declared) return;

    this.character.onAttack(isUltimate, () => {
      this.vfx.triggerAttackBurst(new THREE.Vector3(0, 0.4, 0.4), isUltimate ? 0xffd900 : 0x0059ff);
    });

    // AI reaction in Phase 2
    setTimeout(() => {
      this.ai.makeInterceptDecision();
    }, 800);
  }

  handleCombatEvent(event) {
    console.log('[Combat Event]', event);

    if (event.type === 'DAMAGE_RESOLVED') {
      if (event.defenderSide === 'opponent') {
        this.vfx.triggerAttackBurst(new THREE.Vector3(0, 0.4, -0.6), 0xff0000);
      } else {
        this.character.onTakeDamage(event.damage, event.defenderHp);
      }

      // Check if now AI turn
      if (this.combat.currentTurn === 'opponent' && !this.combat.winner) {
        setTimeout(() => {
          this.ai.makeTurnMove();
        }, 1200);
      }
    } else if (event.type === 'ATTACK_DECLARED' && event.attackerSide === 'opponent') {
      // Prompt player for Tactical Intercept
      const playerSquad = this.combat.getReserveHeroes('player');
      this.ui.showInterceptModal(event, playerSquad, hero => {
        const fullSquad = this.combat.playerSquad;
        const swapIdx = fullSquad.findIndex(h => h.id === hero.id);
        this.combat.declareIntercept('swap', swapIdx);
      });
    } else if (event.type === 'TACTICAL_SWAP') {
      // If active hero changed, dynamically load new hero's 3D model and update target card!
      const currentActive = this.combat.getActiveHero('player');
      if (currentActive) {
        this.activeHero = currentActive;
        this.targetHeroId = currentActive.id;
        console.log(`[GameApp] Tactical Swap to ${currentActive.name}. Target card is now: ${this.targetHeroId}`);
        const modelPath = currentActive.model || (this.targetHeroId === 'thor' ? '/assets/characters/thor/Thor.glb' : '/assets/characters/spiderman/spiderman.glb');
        this.character.loadModel(modelPath, () => {
          this.character.onCardDetected();
        });
      }
    } else if (event.type === 'KINETIC_BASTION_HEAL') {
      this.vfx.triggerShieldAura();
    } else if (event.type === 'MATCH_ENDED') {
      if (event.winner === 'player') {
        this.character.onVictory();
        alert('VICTORY! You defeated all enemy heroes!');
      } else {
        this.character.onDefeat();
        alert('DEFEAT! Your squad was knocked out.');
      }
    }
  }

  handleManualSwap(hero) {
    if (this.combat.phase === 2 && this.combat.currentTurn === 'opponent') {
      const idx = this.combat.playerSquad.findIndex(h => h.id === hero.id);
      this.combat.declareIntercept('swap', idx);
      this.ui.hideInterceptModal();
    }
  }

  toggleARMode() {
    if (!this.isArActive) {
      this.startARCamera();
    } else {
      this.mindAR.stop();
      this.isArActive = false;
      this.arData = null;
      document.body.classList.remove('ar-active');
      if (this.threeScene.renderer && this.threeScene.renderer.domElement) {
        this.threeScene.renderer.domElement.style.display = 'block';
      }
      this.threeScene.grid.visible = true;
    }
  }

  animate() {
    requestAnimationFrame(this.animate);
    const delta = this.clock.getDelta();

    this.character.update(delta);
    this.vfx.update(delta);

    if (this.isArActive && this.persistence) {
      this.persistence.update(delta);
    }

    if (this.isArActive && this.arData) {
      this.arData.renderer.render(this.arData.scene, this.arData.camera);
    } else {
      this.threeScene.render();
    }
  }
}

// Bootstrap
window.addEventListener('DOMContentLoaded', () => {
  new GameApp();
});
