// Screen Navigation & UI Component Controller
import { HEROES_LIST } from '../combat/HeroData.js';

export class UIManager {
  constructor(options = {}) {
    this.onStartGame = options.onStartGame || (() => {});
    this.onAttackClick = options.onAttackClick || (() => {});
    this.onUltimateClick = options.onUltimateClick || (() => {});
    this.onInterceptChoice = options.onInterceptChoice || (() => {});
    this.onTacticalSwapClick = options.onTacticalSwapClick || (() => {});
    this.onModeToggle = options.onModeToggle || (() => {});
    this.onSimulateCard = options.onSimulateCard || (() => {});
    this.onScanCancel = options.onScanCancel || (() => {});
    this.onScanPlay = options.onScanPlay || (() => {});
    this.onExitGame = options.onExitGame || (() => {});

    this.selectedHeroes = []; // Array of up to 3 hero IDs
    this.inspectedHero = HEROES_LIST[0];
    this.mode = 'AI'; // 'AI' | 'MULTIPLAYER'
    this.isCardScanned = false;

    this.cacheDom();
    this.bindEvents();
    this.renderHeroGrid();
    this.updateHeroDrawer(this.inspectedHero, false);
  }

  cacheDom() {
    // Screens
    this.screens = {
      landing: document.getElementById('screen-landing'),
      join: document.getElementById('screen-join'),
      username: document.getElementById('screen-username'),
      heroSelect: document.getElementById('screen-hero-select'),
      cardScan: document.getElementById('screen-card-scan'),
      combat: document.getElementById('screen-combat'),
      pause: document.getElementById('screen-pause')
    };

    // Sidebar
    this.sidebarLogo = document.getElementById('sidebar-logo');
    this.sidebarHamburger = document.getElementById('sidebar-hamburger');
    this.sidebarClose = document.getElementById('sidebar-close');
    this.sidebarSettings = document.getElementById('sidebar-settings');

    // Landing Buttons
    this.btnPlayLanding = document.getElementById('btn-play-landing');
    this.btnJoinLanding = document.getElementById('btn-join-landing');
    this.btnExitLanding = document.getElementById('btn-exit-landing');

    // Join Room Inputs & Buttons
    this.inputRoomCode = document.getElementById('input-room-code');
    this.btnJoinCancel = document.getElementById('btn-join-cancel');
    this.btnJoinSubmit = document.getElementById('btn-join-submit');

    // Username Inputs & Buttons
    this.roomJoinedTitle = document.getElementById('room-joined-title');
    this.inputUsername = document.getElementById('input-username');
    this.btnUserCancel = document.getElementById('btn-user-cancel');
    this.btnUserPlay = document.getElementById('btn-user-play');

    // Hero Selection
    this.heroSelectionTitle = document.getElementById('hero-selection-title');
    this.heroGrid = document.getElementById('hero-grid');
    this.btnHeroContinue = document.getElementById('btn-hero-continue');
    this.heroDrawer = document.getElementById('hero-drawer');
    this.drawerAvatar = document.getElementById('drawer-avatar');
    this.drawerHeroName = document.getElementById('drawer-hero-name');
    this.drawerCategory = document.getElementById('drawer-category');
    this.drawerHpVal = document.getElementById('drawer-hp-val');
    this.drawerHpBar = document.getElementById('drawer-hp-bar');
    this.drawerAtkVal = document.getElementById('drawer-atk-val');
    this.drawerAtkBar = document.getElementById('drawer-atk-bar');
    this.drawerUltDesc = document.getElementById('drawer-ult-desc');

    // Combat HUD
    this.hudP1Avatar = document.getElementById('hud-p1-avatar');
    this.hudP1Username = document.getElementById('hud-p1-username');
    this.hudP1HeroName = document.getElementById('hud-p1-hero-name');
    this.hudP1Hp = document.getElementById('hud-p1-hp');
    this.hudP1HpBar = document.getElementById('hud-p1-hp-bar');

    this.hudP2Avatar = document.getElementById('hud-p2-avatar');
    this.hudP2Username = document.getElementById('hud-p2-username');
    this.hudP2HeroName = document.getElementById('hud-p2-hero-name');
    this.hudP2Hp = document.getElementById('hud-p2-hp');
    this.hudP2HpBar = document.getElementById('hud-p2-hp-bar');

    this.turnAnnouncement = document.getElementById('turn-announcement');
    this.turnBannerText = document.getElementById('turn-banner-text');

    this.btnAttack = document.getElementById('btn-attack');
    this.btnUltimate = document.getElementById('btn-ultimate');
    this.ultMeterIndicator = document.getElementById('ult-meter-indicator');
    this.reserveSquad = document.getElementById('reserve-squad');

    // Intercept Modal
    this.interceptModal = document.getElementById('intercept-modal');
    this.interceptDesc = document.getElementById('intercept-desc');
    this.btnHoldGround = document.getElementById('btn-hold-ground');
    this.swapOptions = document.getElementById('swap-options');

    // Pause Buttons
    this.btnPauseResume = document.getElementById('btn-pause-resume');
    this.btnPauseSettings = document.getElementById('btn-pause-settings');
    this.btnPauseExit = document.getElementById('btn-pause-exit');
    this.btnPauseScreenClose = document.getElementById('btn-pause-screen-close');

    // Card Scan Screen Elements
    this.scanTitle = document.getElementById('scan-title');
    this.scanWindow = document.getElementById('scan-window');
    this.btnScanCancel = document.getElementById('btn-scan-cancel');
    this.btnScanAction = document.getElementById('btn-scan-action');

    // AR Scanning Overlay
    this.arScanningOverlay = document.getElementById('ar-scanning-overlay');
    this.scanningHeroName = document.getElementById('scanning-hero-name');
    this.btnManualSimScan = document.getElementById('btn-manual-sim-scan');

    // Fullscreen buttons
    this.btnFullscreenToggle = document.getElementById('btn-fullscreen-toggle');
    this.btnForceFullscreen = document.getElementById('btn-force-fullscreen');

    this.btnDetectCardSim = document.getElementById('btn-detect-card-sim');
  }

  bindEvents() {
    // Landing
    this.btnPlayLanding.addEventListener('click', () => {
      this.mode = 'AI';
      this.switchScreen('heroSelect');
    });

    this.btnJoinLanding.addEventListener('click', () => {
      this.mode = 'MULTIPLAYER';
      this.switchScreen('join');
    });

    this.btnExitLanding.addEventListener('click', () => {
      this.onExitGame();
      alert('Game closed.');
    });

    // Join Room
    this.btnJoinCancel.addEventListener('click', () => this.switchScreen('landing'));
    this.btnJoinSubmit.addEventListener('click', () => {
      const code = this.inputRoomCode.value.trim() || '3031';
      this.roomJoinedTitle.textContent = `Room #${code} joined!`;
      this.switchScreen('username');
    });

    // Username
    this.btnUserCancel.addEventListener('click', () => this.switchScreen('join'));
    this.btnUserPlay.addEventListener('click', () => {
      this.hudP1Username.textContent = this.inputUsername.value.trim() || 'User567';
      this.switchScreen('heroSelect');
    });

    // Hero Continue -> Transitions to Card Scan (Card Scan.png)
    this.btnHeroContinue.addEventListener('click', () => {
      if (this.selectedHeroes.length === 3) {
        this.setScanState(false);
        this.switchScreen('cardScan');
        this.onStartGame(this.selectedHeroes);
      }
    });

    // Card Scan Actions
    if (this.btnScanCancel) {
      this.btnScanCancel.addEventListener('click', () => {
        this.onScanCancel();
        this.switchScreen('heroSelect');
      });
    }

    if (this.btnScanAction) {
      this.btnScanAction.addEventListener('click', () => {
        if (this.isCardScanned) {
          this.switchScreen('combat');
          this.onScanPlay();
        }
      });
    }

    // Sidebar actions
    this.sidebarHamburger.addEventListener('click', () => {
      this.openPauseMenu();
    });

    this.sidebarClose.addEventListener('click', () => {
      this.closePauseMenu();
    });

    if (this.btnPauseScreenClose) {
      this.btnPauseScreenClose.addEventListener('click', () => {
        this.closePauseMenu();
      });
    }

    // Pause Menu
    this.btnPauseResume.addEventListener('click', () => this.closePauseMenu());
    this.btnPauseSettings.addEventListener('click', () => alert('Audio: 100% | Bloom: ON | Quality: HIGH'));
    this.btnPauseExit.addEventListener('click', () => {
      this.closePauseMenu();
      this.onExitGame();
      this.switchScreen('landing');
    });

    // Combat Action Buttons
    this.btnAttack.addEventListener('click', () => this.onAttackClick());
    this.btnUltimate.addEventListener('click', () => this.onUltimateClick());
    this.btnHoldGround.addEventListener('click', () => {
      this.hideInterceptModal();
      this.onInterceptChoice('hold');
    });

    // Synchronous, vendor-prefixed Fullscreen toggle for mobile browsers
    const toggleFs = (e) => {
      if (e && e.cancelable) e.preventDefault();
      try {
        const doc = document;
        const docEl = document.documentElement;
        const isFs = doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement;

        if (!isFs) {
          const req = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.mozRequestFullScreen || docEl.msRequestFullscreen;
          if (req) {
            const p = req.call(docEl);
            if (p && p.catch) p.catch(() => {});
          }
          if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape').catch(() => {});
          }
        } else {
          const exit = doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen;
          if (exit) {
            const p = exit.call(doc);
            if (p && p.catch) p.catch(() => {});
          }
        }
      } catch (err) {
        console.log('Fullscreen error:', err);
      }
    };

    if (this.btnFullscreenToggle) {
      this.btnFullscreenToggle.addEventListener('click', toggleFs);
      this.btnFullscreenToggle.addEventListener('touchend', toggleFs);
    }
    if (this.btnForceFullscreen) {
      this.btnForceFullscreen.addEventListener('click', toggleFs);
      this.btnForceFullscreen.addEventListener('touchend', toggleFs);
    }

    if (this.btnManualSimScan) {
      this.btnManualSimScan.addEventListener('click', () => this.onSimulateCard());
    }

    if (this.btnToggleArMode) {
      this.btnToggleArMode.addEventListener('click', () => this.onModeToggle());
    }
    if (this.btnDetectCardSim) {
      this.btnDetectCardSim.addEventListener('click', () => this.onSimulateCard());
    }
  }

  switchScreen(screenKey) {
    Object.values(this.screens).forEach(s => s.classList.remove('active'));
    if (this.screens[screenKey]) {
      this.screens[screenKey].classList.add('active');
    }

    // Adjust Sidebar for Combat
    if (screenKey === 'combat') {
      this.sidebarLogo.classList.add('hidden');
      this.sidebarHamburger.classList.remove('hidden');
      this.sidebarClose.classList.add('hidden');
    } else {
      this.sidebarLogo.classList.remove('hidden');
      this.sidebarHamburger.classList.add('hidden');
      this.sidebarClose.classList.add('hidden');
    }
  }

  openPauseMenu() {
    this.screens.pause.classList.remove('hidden');
    this.screens.pause.classList.add('active');
    this.sidebarHamburger.classList.add('hidden');
    this.sidebarClose.classList.remove('hidden');
  }

  closePauseMenu() {
    this.screens.pause.classList.remove('active');
    this.screens.pause.classList.add('hidden');
    this.sidebarClose.classList.add('hidden');
    this.sidebarHamburger.classList.remove('hidden');
  }

  renderHeroGrid() {
    this.heroGrid.innerHTML = '';
    HEROES_LIST.forEach((hero) => {
      const slot = document.createElement('div');
      slot.className = 'hero-card-slot';
      slot.dataset.id = hero.id;

      const img = document.createElement('img');
      img.src = hero.icon;
      img.alt = hero.name;
      img.className = 'hero-slot-img';
      slot.appendChild(img);

      slot.addEventListener('click', () => {
        this.inspectedHero = hero;
        this.updateHeroDrawer(hero, true);
        this.toggleHeroSelection(hero.id, slot);
      });

      this.heroGrid.appendChild(slot);
    });
  }

  toggleHeroSelection(heroId, slotElement) {
    const idx = this.selectedHeroes.indexOf(heroId);
    if (idx > -1) {
      this.selectedHeroes.splice(idx, 1);
    } else {
      if (this.selectedHeroes.length < 3) {
        this.selectedHeroes.push(heroId);
      }
    }
    this.updateHeroGridSelections();
  }

  updateHeroGridSelections() {
    const slots = this.heroGrid.querySelectorAll('.hero-card-slot');
    slots.forEach(slot => {
      const heroId = slot.dataset.id;
      const selectIndex = this.selectedHeroes.indexOf(heroId);

      // Remove existing badge if any
      const existingBadge = slot.querySelector('.hero-badge-num');
      if (existingBadge) existingBadge.remove();

      if (selectIndex > -1) {
        slot.classList.add('selected');
        const badge = document.createElement('div');
        badge.className = 'hero-badge-num';
        badge.textContent = (selectIndex + 1).toString();
        slot.appendChild(badge);
      } else {
        slot.classList.remove('selected');
      }
    });

    if (this.selectedHeroes.length > 0) {
      if (this.heroSelectionTitle) this.heroSelectionTitle.textContent = 'Select your 3 heroes';
      this.heroDrawer.classList.remove('hidden');
    } else {
      if (this.heroSelectionTitle) this.heroSelectionTitle.textContent = 'Hero Selection';
      this.heroDrawer.classList.add('hidden');
    }

    if (this.selectedHeroes.length === 3) {
      this.btnHeroContinue.classList.remove('disabled');
      this.btnHeroContinue.classList.add('primary');
      this.btnHeroContinue.textContent = 'Play';
    } else {
      this.btnHeroContinue.classList.add('disabled');
      this.btnHeroContinue.classList.remove('primary');
      this.btnHeroContinue.textContent = 'Select to continue';
    }
  }

  updateHeroDrawer(hero, show = true) {
    if (show) {
      this.heroDrawer.classList.remove('hidden');
    } else {
      this.heroDrawer.classList.add('hidden');
    }
    this.drawerAvatar.src = hero.icon;
    this.drawerHeroName.textContent = hero.name;
    this.drawerCategory.textContent = hero.class;
    this.drawerHpVal.textContent = hero.hp.toString();
    this.drawerHpBar.style.width = `${Math.min(100, (hero.hp / 180) * 100)}%`;
    this.drawerAtkVal.textContent = hero.atk.toString();
    this.drawerAtkBar.style.width = `${Math.min(100, (hero.atk / 80) * 100)}%`;
    this.drawerUltDesc.textContent = hero.ultDesc;
  }

  updateCombatHUD(state) {
    if (!state) return;
    const { playerActive, opponentActive, currentTurn, phase } = state;

    // Update Player 1 Active
    if (playerActive) {
      this.hudP1Avatar.src = playerActive.icon;
      this.hudP1HeroName.textContent = playerActive.name;
      this.hudP1Hp.textContent = Math.max(0, playerActive.currentHp).toString();
      const p1Pct = Math.max(0, (playerActive.currentHp / playerActive.maxHp) * 100);
      this.hudP1HpBar.style.width = `${p1Pct}%`;
    }

    // Update Player 2 / AI Active
    if (opponentActive) {
      this.hudP2Avatar.src = opponentActive.icon;
      this.hudP2HeroName.textContent = opponentActive.name;
      this.hudP2Hp.textContent = Math.max(0, opponentActive.currentHp).toString();
      const p2Pct = Math.max(0, (opponentActive.currentHp / opponentActive.maxHp) * 100);
      this.hudP2HpBar.style.width = `${p2Pct}%`;
    }

    // Turn Banner
    if (currentTurn === 'player') {
      this.turnBannerText.textContent = phase === 1 ? 'YOUR TURN: ATTACK' : 'TACTICAL INTERCEPT';
      this.turnAnnouncement.style.borderColor = 'var(--game-blue)';
    } else {
      this.turnBannerText.textContent = 'OPPONENT TURN';
      this.turnAnnouncement.style.borderColor = 'var(--game-yellow)';
    }

    // Action button states
    const isPlayerTurn = currentTurn === 'player' && phase === 1;
    if (isPlayerTurn) {
      this.btnAttack.classList.remove('disabled');
      const canUlt = playerActive && playerActive.currentMeter >= playerActive.ultThreshold;
      if (canUlt) {
        this.btnUltimate.classList.remove('disabled');
      } else {
        this.btnUltimate.classList.add('disabled');
      }
    } else {
      this.btnAttack.classList.add('disabled');
      this.btnUltimate.classList.add('disabled');
    }

    // Update Reserve Squad on Bottom Right
    this.renderReserveSquad(state.playerSquad, state.playerActive);
  }

  renderReserveSquad(squad, activeHero) {
    this.reserveSquad.innerHTML = '';
    squad.forEach(hero => {
      if (hero.id === activeHero.id) return; // Skip active

      const slot = document.createElement('div');
      slot.className = 'reserve-hero-slot';
      if (hero.class === 'Tank') slot.classList.add('yellow-ring');
      else if (hero.class === 'Fighter') slot.classList.add('blue-ring');
      else slot.classList.add('red-ring');

      if (hero.isFainted) slot.classList.add('fainted');

      const img = document.createElement('img');
      img.src = hero.icon;
      img.alt = hero.name;
      img.className = 'reserve-avatar';
      slot.appendChild(img);

      slot.addEventListener('click', () => {
        if (!hero.isFainted) {
          this.onTacticalSwapClick(hero);
        }
      });

      this.reserveSquad.appendChild(slot);
    });
  }

  showInterceptModal(attackData, squad, onSwapSelect) {
    this.interceptModal.classList.remove('hidden');
    this.interceptDesc.textContent = `${attackData.attackerName} is launching a ${attackData.isUltimate ? 'DEVASTATING ULTIMATE' : 'Standard Strike'} for ${attackData.rawDamage} DMG!`;

    this.swapOptions.innerHTML = '';
    const reserves = squad.filter(h => !h.isFainted);
    reserves.forEach(hero => {
      const btn = document.createElement('button');
      btn.className = 'figma-btn outline';
      btn.style.width = 'auto';
      btn.style.padding = '0 24px';
      btn.textContent = `Swap: ${hero.name} (${hero.currentHp} HP)`;
      btn.addEventListener('click', () => {
        this.hideInterceptModal();
        onSwapSelect(hero);
      });
      this.swapOptions.appendChild(btn);
    });
  }

  hideInterceptModal() {
    this.interceptModal.classList.add('hidden');
  }

  showScanningReticle(heroName) {
    if (this.arScanningOverlay) {
      this.arScanningOverlay.classList.remove('hidden');
      if (this.scanningHeroName) this.scanningHeroName.textContent = heroName;
    }
    if (this.turnBannerText) {
      this.turnBannerText.textContent = 'SCAN HERO CARD';
    }
  }

  hideScanningReticle() {
    if (this.arScanningOverlay) {
      this.arScanningOverlay.classList.add('hidden');
    }
    if (this.turnBannerText) {
      this.turnBannerText.textContent = 'YOUR TURN';
    }
  }

  setScanState(isScanned) {
    this.isCardScanned = !!isScanned;
    if (this.isCardScanned) {
      if (this.scanTitle) this.scanTitle.textContent = 'Card Scanned';
      if (this.scanWindow) this.scanWindow.classList.add('scanned');
      if (this.btnScanAction) {
        this.btnScanAction.className = 'figma-btn primary';
        this.btnScanAction.textContent = 'Play';
      }
    } else {
      if (this.scanTitle) this.scanTitle.textContent = 'Scanning Card';
      if (this.scanWindow) this.scanWindow.classList.remove('scanned');
      if (this.btnScanAction) {
        this.btnScanAction.className = 'figma-btn disabled';
        this.btnScanAction.textContent = 'Done';
      }
    }
  }

}

