// Screen Navigation & Portrait UI Component Controller
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

    this.selectedHeroes = []; // Up to 3 hero IDs
    this.carouselIndex = 0;
    this.mode = 'AI'; // 'AI' | 'MULTIPLAYER'
    this.isCardScanned = false;
    this.soundLevel = 10;
    this.currentScreen = 'home';

    this.cacheDom();
    this.bindEvents();
    this.renderCarousel();
    this.updateDraftTray();
  }

  cacheDom() {
    // Screens
    this.screens = {
      home: document.getElementById('screen-home'),
      server: document.getElementById('screen-server'),
      heroSelect: document.getElementById('screen-hero-select'),
      cardScan: document.getElementById('screen-card-scan'),
      combat: document.getElementById('screen-combat'),
      settings: document.getElementById('screen-settings')
    };

    // Header
    this.btnFullscreenToggle = document.getElementById('btn-fullscreen-toggle');
    this.fullscreenIcon = document.getElementById('fullscreen-icon');
    this.subheaderWrap = document.getElementById('subheader-wrap');
    this.btnSubheaderBack = document.getElementById('btn-subheader-back');
    this.subheaderTitle = document.getElementById('subheader-title');
    this.headerUserId = document.getElementById('header-user-id');
    this.headerAvatarBtn = document.getElementById('header-avatar-btn');

    // Bottom Navigation
    this.bottomNav = document.getElementById('bottom-nav');
    this.navTabs = {
      home: document.getElementById('nav-tab-home'),
      server: document.getElementById('nav-tab-server'),
      settings: document.getElementById('nav-tab-settings')
    };

    // Home Screen
    this.btnPlayHome = document.getElementById('btn-play-home');

    // Server Screen
    this.inputRoomCode = document.getElementById('input-room-code');
    this.btnJoinRoom = document.getElementById('btn-join-room');
    this.displayRoomCode = document.getElementById('display-room-code');
    this.btnCreateRoom = document.getElementById('btn-create-room');

    // Hero Selection
    this.heroCarouselTrack = document.getElementById('hero-carousel-track');
    this.btnCarouselPrev = document.getElementById('btn-carousel-prev');
    this.btnCarouselNext = document.getElementById('btn-carousel-next');
    this.heroDraftTray = document.getElementById('hero-draft-tray');
    this.draftSlots = [
      document.getElementById('draft-slot-0'),
      document.getElementById('draft-slot-1'),
      document.getElementById('draft-slot-2')
    ];
    this.btnHeroContinue = document.getElementById('btn-hero-continue');

    // Card Scan
    this.scanViewportWindow = document.getElementById('scan-viewport-window');
    this.scanStatusBadge = document.getElementById('scan-status-badge');
    this.btnScanContinue = document.getElementById('btn-scan-continue');
    this.btnManualSimScan = document.getElementById('btn-manual-sim-scan');

    // Combat HUD
    this.enemyAvatarImg = document.getElementById('enemy-avatar-img');
    this.enemyUserId = document.getElementById('enemy-user-id');
    this.enemyHeroName = document.getElementById('enemy-hero-name');
    this.enemyHpRing = document.getElementById('enemy-hp-ring');
    this.btnCombatSync = document.getElementById('btn-combat-sync');

    this.combatAlertWrap = document.getElementById('combat-alert-wrap');
    this.combatAlertBox = document.getElementById('combat-alert-box');
    this.alertIcon = document.getElementById('alert-icon');
    this.alertText = document.getElementById('alert-text');

    this.btnActiveAttack = document.getElementById('btn-active-attack');
    this.playerAvatarImg = document.getElementById('player-avatar-img');
    this.playerHpRing = document.getElementById('player-hp-ring');

    this.reserveSlots = [
      document.getElementById('reserve-slot-0'),
      document.getElementById('reserve-slot-1')
    ];
    this.reserveImgs = [
      document.getElementById('reserve-0-img'),
      document.getElementById('reserve-1-img')
    ];
    this.reserveHpRings = [
      document.getElementById('reserve-0-hp-ring'),
      document.getElementById('reserve-1-hp-ring')
    ];

    this.btnCombatUltimate = document.getElementById('btn-combat-ultimate');
    this.ultimateBtnLabel = document.getElementById('ultimate-btn-label');

    // Intercept Modal
    this.interceptModal = document.getElementById('intercept-modal');
    this.interceptDesc = document.getElementById('intercept-desc');
    this.btnHoldGround = document.getElementById('btn-hold-ground');
    this.swapOptions = document.getElementById('swap-options');

    // Settings Screen
    this.btnSettingsHome = document.getElementById('btn-settings-home');
    this.inputSettingsUser = document.getElementById('input-settings-user');
    this.btnSettingsSound = document.getElementById('btn-settings-sound');
    this.btnSettingsExit = document.getElementById('btn-settings-exit');
  }

  bindEvents() {
    // Navigation Tabs
    Object.entries(this.navTabs).forEach(([key, tabEl]) => {
      if (tabEl) {
        tabEl.addEventListener('click', () => {
          if (key === 'home') this.switchScreen('home');
          else if (key === 'server') this.switchScreen('server');
          else if (key === 'settings') this.switchScreen('settings');
        });
      }
    });

    // Subheader Back Button
    if (this.btnSubheaderBack) {
      this.btnSubheaderBack.addEventListener('click', () => {
        if (this.currentScreen === 'heroSelect') {
          this.switchScreen('home');
        } else if (this.currentScreen === 'cardScan') {
          this.onScanCancel();
          this.switchScreen('heroSelect');
        } else if (this.currentScreen === 'combat') {
          this.switchScreen('settings');
        }
      });
    }

    // Home Screen Actions
    if (this.btnPlayHome) {
      this.btnPlayHome.addEventListener('click', () => {
        this.mode = 'AI';
        this.switchScreen('heroSelect');
      });
    }

    // Server Screen Actions
    if (this.btnJoinRoom) {
      this.btnJoinRoom.addEventListener('click', () => {
        const code = this.inputRoomCode.value.trim() || '4879';
        this.mode = 'MULTIPLAYER';
        this.switchScreen('heroSelect');
      });
    }
    if (this.btnCreateRoom) {
      this.btnCreateRoom.addEventListener('click', () => {
        this.mode = 'MULTIPLAYER';
        this.switchScreen('heroSelect');
      });
    }

    // Hero Carousel Arrows
    if (this.btnCarouselPrev) {
      this.btnCarouselPrev.addEventListener('click', () => this.navigateCarousel(-1));
    }
    if (this.btnCarouselNext) {
      this.btnCarouselNext.addEventListener('click', () => this.navigateCarousel(1));
    }

    // Continue to Card Scan
    if (this.btnHeroContinue) {
      this.btnHeroContinue.addEventListener('click', () => {
        if (this.selectedHeroes.length === 3) {
          this.setScanState(false);
          this.switchScreen('cardScan');
          this.onStartGame(this.selectedHeroes);
        }
      });
    }

    // Card Scan Screen Actions
    if (this.btnScanContinue) {
      this.btnScanContinue.addEventListener('click', () => {
        if (this.isCardScanned) {
          this.switchScreen('combat');
          this.onScanPlay();
        }
      });
    }
    if (this.btnManualSimScan) {
      this.btnManualSimScan.addEventListener('click', () => {
        this.onSimulateCard();
      });
    }

    // Combat HUD Actions
    if (this.btnActiveAttack) {
      this.btnActiveAttack.addEventListener('click', () => {
        this.onAttackClick();
      });
    }
    if (this.btnCombatUltimate) {
      this.btnCombatUltimate.addEventListener('click', () => {
        if (this.btnCombatUltimate.classList.contains('on')) {
          this.onUltimateClick();
        }
      });
    }
    if (this.btnHoldGround) {
      this.btnHoldGround.addEventListener('click', () => {
        this.hideInterceptModal();
        this.onInterceptChoice('hold');
      });
    }

    // Settings Screen Actions
    if (this.btnSettingsHome) {
      this.btnSettingsHome.addEventListener('click', () => {
        this.switchScreen('home');
      });
    }
    if (this.inputSettingsUser) {
      this.inputSettingsUser.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        if (val && this.headerUserId) {
          this.headerUserId.textContent = `UserId${val}`;
        }
      });
    }
    if (this.btnSettingsSound) {
      this.btnSettingsSound.addEventListener('click', () => {
        this.soundLevel = (this.soundLevel + 2) % 12;
        this.btnSettingsSound.textContent = this.soundLevel.toString();
      });
    }
    if (this.btnSettingsExit) {
      this.btnSettingsExit.addEventListener('click', () => {
        this.onExitGame();
        this.switchScreen('home');
      });
    }

    // Fullscreen Toggle
    const toggleFs = (e) => {
      if (e && e.cancelable) e.preventDefault();
      try {
        const doc = document;
        const docEl = document.documentElement;
        const isFs = doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement;

        if (!isFs) {
          const req = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.mozRequestFullScreen || docEl.msRequestFullscreen;
          if (req) req.call(docEl).catch(() => {});
          if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('portrait').catch(() => {});
          }
          if (this.fullscreenIcon) this.fullscreenIcon.src = '/assets/ui/close-fullscreen.png';
        } else {
          const exit = doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen;
          if (exit) exit.call(doc).catch(() => {});
          if (this.fullscreenIcon) this.fullscreenIcon.src = '/assets/ui/open-fullscreen.png';
        }
      } catch (err) {
        console.warn('Fullscreen toggle:', err);
      }
    };

    if (this.btnFullscreenToggle) {
      this.btnFullscreenToggle.addEventListener('click', toggleFs);
      this.btnFullscreenToggle.addEventListener('touchend', toggleFs);
    }
  }

  switchScreen(screenKey) {
    this.currentScreen = screenKey;
    Object.entries(this.screens).forEach(([key, el]) => {
      if (el) {
        if (key === screenKey) el.classList.add('active');
        else el.classList.remove('active');
      }
    });

    // Subheader display control
    if (this.subheaderWrap) {
      if (screenKey === 'heroSelect') {
        this.subheaderWrap.classList.remove('hidden');
        this.subheaderTitle.textContent = 'Select your hero';
      } else if (screenKey === 'cardScan') {
        this.subheaderWrap.classList.remove('hidden');
        this.subheaderTitle.textContent = 'Scan your card';
      } else {
        this.subheaderWrap.classList.add('hidden');
      }
    }

    // Navigation Tab Active Pill
    Object.entries(this.navTabs).forEach(([key, tabEl]) => {
      if (tabEl) {
        if (key === screenKey) tabEl.classList.add('active');
        else tabEl.classList.remove('active');
      }
    });

    // Combat and Scan transparent background
    if (screenKey === 'combat' || screenKey === 'cardScan') {
      document.body.classList.add('ar-active');
    } else {
      if (!this.isCardScanned) {
        document.body.classList.remove('ar-active');
      }
    }
  }

  renderCarousel() {
    if (!this.heroCarouselTrack) return;
    this.heroCarouselTrack.innerHTML = '';

    const hero = HEROES_LIST[this.carouselIndex];
    if (!hero) return;

    const card = document.createElement('div');
    card.className = 'hero-card-display';

    if (hero.cardImage) {
      const img = document.createElement('img');
      img.src = hero.cardImage;
      img.alt = hero.name;
      img.className = 'card-img-layer';
      card.appendChild(img);
    } else {
      // Dynamic Card Fallback with ArUco corners and hero styling
      const fallback = document.createElement('div');
      fallback.className = 'card-fallback-frame';
      fallback.innerHTML = `
        <div class="card-fallback-top">
          <div>
            <div class="card-hero-name">${hero.name}</div>
            <div class="card-hero-class">${hero.class}</div>
          </div>
        </div>
        <img class="card-fallback-avatar" src="${hero.icon}" alt="${hero.name}">
        <div class="card-fallback-stats">
          <div>Health: <strong>${hero.hp}hp</strong></div>
          <div>Damage: <strong>-${hero.atk}hp</strong></div>
          <div>Ult: ${hero.ultDesc}</div>
        </div>
      `;
      card.appendChild(fallback);
    }

    // Add / Added toggle button at bottom of card
    const actionWrap = document.createElement('div');
    actionWrap.className = 'card-action-overlay';

    const isAdded = this.selectedHeroes.includes(hero.id);
    const toggleBtn = document.createElement('button');
    toggleBtn.className = `btn-card-add-toggle ${isAdded ? 'added-mode' : 'add-mode'}`;
    toggleBtn.innerHTML = isAdded ? '<span>✓ Added</span>' : '<span>+ Add Hero</span>';

    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleHeroSelection(hero.id);
    });

    actionWrap.appendChild(toggleBtn);
    card.appendChild(actionWrap);
    this.heroCarouselTrack.appendChild(card);
  }

  navigateCarousel(dir) {
    this.carouselIndex = (this.carouselIndex + dir + HEROES_LIST.length) % HEROES_LIST.length;
    this.renderCarousel();
    this.updateDraftTray();
  }

  toggleHeroSelection(heroId) {
    const idx = this.selectedHeroes.indexOf(heroId);
    if (idx > -1) {
      this.selectedHeroes.splice(idx, 1);
    } else {
      if (this.selectedHeroes.length < 3) {
        this.selectedHeroes.push(heroId);
      }
    }
    this.renderCarousel();
    this.updateDraftTray();
  }

  updateDraftTray() {
    const activeHero = HEROES_LIST[this.carouselIndex];

    this.draftSlots.forEach((slot, index) => {
      const heroId = this.selectedHeroes[index];
      slot.innerHTML = '';
      slot.className = 'draft-slot';

      if (heroId) {
        const hero = HEROES_LIST.find(h => h.id === heroId);
        slot.classList.add('filled');
        const img = document.createElement('img');
        img.src = hero ? hero.icon : '';
        img.alt = hero ? hero.name : '';
        slot.appendChild(img);

        // Highlight with wings if currently inspected in carousel
        if (activeHero && activeHero.id === heroId) {
          slot.classList.add('active-wings');
        }

        slot.onclick = () => {
          this.toggleHeroSelection(heroId);
        };
      } else {
        slot.classList.add('empty');
        const plus = document.createElement('span');
        plus.className = 'slot-plus';
        plus.textContent = '+';
        slot.appendChild(plus);
        slot.onclick = () => {
          if (activeHero && !this.selectedHeroes.includes(activeHero.id)) {
            this.toggleHeroSelection(activeHero.id);
          }
        };
      }
    });

    if (this.btnHeroContinue) {
      if (this.selectedHeroes.length === 3) {
        this.btnHeroContinue.classList.remove('disabled');
      } else {
        this.btnHeroContinue.classList.add('disabled');
      }
    }
  }

  setScanState(isScanned) {
    this.isCardScanned = !!isScanned;
    if (this.scanViewportWindow) {
      if (this.isCardScanned) {
        this.scanViewportWindow.classList.add('scanned');
        if (this.scanStatusBadge) this.scanStatusBadge.textContent = 'Card Detected! Ready to Play';
        if (this.btnScanContinue) this.btnScanContinue.classList.remove('disabled');
      } else {
        this.scanViewportWindow.classList.remove('scanned');
        if (this.scanStatusBadge) this.scanStatusBadge.textContent = 'Searching for Card...';
        if (this.btnScanContinue) this.btnScanContinue.classList.add('disabled');
      }
    }
  }

  showScanningReticle(heroName) {
    this.setScanState(false);
  }

  hideScanningReticle() {
    this.setScanState(true);
  }

  showCombatAlert(type, text) {
    if (!this.combatAlertBox) return;
    this.combatAlertBox.className = `combat-alert-box ${type}`;
    if (this.alertText) this.alertText.textContent = text;
    if (this.alertIcon) {
      if (type === 'incoming') this.alertIcon.textContent = '▲';
      else if (type === 'damage-dealt') this.alertIcon.textContent = '🔥';
      else if (type === 'damage-taken') this.alertIcon.textContent = '💧';
      else if (type === 'neutralized') this.alertIcon.textContent = '💀';
      else this.alertIcon.textContent = '!';
    }
    if (this.combatAlertWrap) {
      this.combatAlertWrap.classList.remove('hidden');
    }
  }

  updateCombatHUD(state) {
    if (!state) return;
    const { playerActive, opponentActive, currentTurn, phase } = state;

    // 1. Update Player Active Vanguard
    if (playerActive) {
      if (this.playerAvatarImg) this.playerAvatarImg.src = playerActive.icon;
      if (this.playerHpRing) {
        const pct = Math.max(0, playerActive.currentHp / playerActive.maxHp);
        const offset = 276 * (1 - pct);
        this.playerHpRing.style.strokeDashoffset = offset;
      }
    }

    // 2. Update Enemy Hero
    if (opponentActive) {
      if (this.enemyAvatarImg) this.enemyAvatarImg.src = opponentActive.icon;
      if (this.enemyHeroName) this.enemyHeroName.textContent = opponentActive.name;
      if (this.enemyHpRing) {
        const pct = Math.max(0, opponentActive.currentHp / opponentActive.maxHp);
        const offset = 276 * (1 - pct);
        this.enemyHpRing.style.strokeDashoffset = offset;
      }
    }

    // 3. Update Reserve Heroes
    const reserves = state.playerSquad.filter(h => h.id !== (playerActive && playerActive.id));
    this.reserveSlots.forEach((slot, idx) => {
      const hero = reserves[idx];
      if (hero) {
        slot.style.display = 'flex';
        if (this.reserveImgs[idx]) this.reserveImgs[idx].src = hero.icon;
        if (this.reserveHpRings[idx]) {
          const pct = Math.max(0, hero.currentHp / hero.maxHp);
          this.reserveHpRings[idx].style.strokeDashoffset = 276 * (1 - pct);
        }
        slot.onclick = () => {
          if (!hero.isFainted) this.onTacticalSwapClick(hero);
        };
      } else {
        slot.style.display = 'none';
      }
    });

    // 4. Update Ultimate Button
    const isPlayerTurn = currentTurn === 'player' && phase === 1;
    const canUlt = playerActive && playerActive.currentMeter >= playerActive.ultThreshold;

    if (canUlt && isPlayerTurn) {
      this.btnCombatUltimate.className = 'ultimate-pill-btn on';
      this.ultimateBtnLabel.textContent = 'Ultimate Strike';
    } else {
      this.btnCombatUltimate.className = 'ultimate-pill-btn off';
      this.ultimateBtnLabel.textContent = 'Ultimate';
    }

    // 5. Update Turn Status Banner
    if (currentTurn === 'player') {
      this.showCombatAlert('your-turn', 'Your turn');
    } else {
      this.showCombatAlert('incoming', 'Incoming attack!');
    }
  }

  showInterceptModal(attackData, squad, onSwapSelect) {
    if (!this.interceptModal) return;
    this.interceptModal.classList.remove('hidden');
    if (this.interceptDesc) {
      this.interceptDesc.textContent = `${attackData.attackerName} is launching a ${attackData.isUltimate ? 'DEVASTATING ULTIMATE' : 'Standard Strike'} for ${attackData.rawDamage} DMG! React before damage resolves!`;
    }

    if (this.swapOptions) {
      this.swapOptions.innerHTML = '';
      const reserves = squad.filter(h => !h.isFainted);
      reserves.forEach(hero => {
        const btn = document.createElement('button');
        btn.className = 'figma-pill-action-btn small';
        btn.textContent = `Swap: ${hero.name} (${hero.currentHp} HP)`;
        btn.addEventListener('click', () => {
          this.hideInterceptModal();
          onSwapSelect(hero);
        });
        this.swapOptions.appendChild(btn);
      });
    }
  }

  hideInterceptModal() {
    if (this.interceptModal) {
      this.interceptModal.classList.add('hidden');
    }
  }
}
