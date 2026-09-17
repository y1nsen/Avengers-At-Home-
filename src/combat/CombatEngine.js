// Tournament Turn Engine (3-Phase Cycle)
export class CombatEngine {
  constructor(options = {}) {
    this.onStateChange = options.onStateChange || (() => {});
    this.onCombatEvent = options.onCombatEvent || (() => {});
    this.reset();
  }

  reset() {
    this.playerSquad = [];
    this.opponentSquad = [];
    this.playerActiveIndex = 0;
    this.opponentActiveIndex = 0;
    this.currentTurn = 'player'; // 'player' | 'opponent'
    this.phase = 1; // 1: Attack Declaration, 2: Tactical Intercept, 3: Damage Resolution
    this.declaredAttack = null; // { isUltimate: boolean, rawDamage: number, attackerClass: string }
    this.swappedThisRound = { player: false, opponent: false };
    this.dualActive = { player: false, opponent: false };
    this.winner = null;
  }

  initMatch(playerSquad, opponentSquad, startTurn = 'player') {
    this.playerSquad = playerSquad.map(h => ({ ...h }));
    this.opponentSquad = opponentSquad.map(h => ({ ...h }));
    this.playerActiveIndex = 0;
    this.opponentActiveIndex = 0;
    this.currentTurn = startTurn;
    this.phase = 1;
    this.swappedThisRound = { player: false, opponent: false };
    this.dualActive = { player: false, opponent: false };
    this.winner = null;
    this.emitState();
  }

  getActiveHero(side = 'player') {
    const squad = side === 'player' ? this.playerSquad : this.opponentSquad;
    const index = side === 'player' ? this.playerActiveIndex : this.opponentActiveIndex;
    return squad[index] || null;
  }

  getReserveHeroes(side = 'player') {
    const squad = side === 'player' ? this.playerSquad : this.opponentSquad;
    const activeIdx = side === 'player' ? this.playerActiveIndex : this.opponentActiveIndex;
    return squad.filter((h, idx) => idx !== activeIdx && !h.isFainted);
  }

  // Phase 1: Attack Declaration
  declareAttack(isUltimate = false) {
    if (this.phase !== 1) return false;
    const attackerSide = this.currentTurn;
    const attacker = this.getActiveHero(attackerSide);
    if (!attacker || attacker.isFainted) return false;

    let baseDmg = attacker.atk;
    let ultTriggered = false;

    if (isUltimate) {
      if (attacker.currentMeter < attacker.ultThreshold) {
        return false; // Not enough meter
      }
      ultTriggered = true;
      attacker.currentMeter = 0; // Consume meter

      if (attacker.class === 'Fighter') {
        baseDmg = 80; // Overdrive
        attacker.overdriveActive = true;
      } else if (attacker.class === 'Tank') {
        // Kinetic Bastion: Heal +40, activate reflection
        attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + 40);
        attacker.kineticBastionActive = true;
        baseDmg = attacker.atk;
        this.onCombatEvent({
          type: 'KINETIC_BASTION_HEAL',
          hero: attacker.name,
          side: attackerSide,
          healed: 40
        });
      } else if (attacker.class === 'Support') {
        // Avengers Assemble: Field 2 Active Heroes
        this.dualActive[attackerSide] = true;
        baseDmg = attacker.atk;
        this.onCombatEvent({
          type: 'AVENGERS_ASSEMBLE',
          hero: attacker.name,
          side: attackerSide
        });
      }
    }

    this.declaredAttack = {
      isUltimate,
      rawDamage: baseDmg,
      attackerSide,
      attackerName: attacker.name,
      attackerClass: attacker.class
    };

    this.phase = 2; // Move to Tactical Intercept
    this.onCombatEvent({
      type: 'ATTACK_DECLARED',
      ...this.declaredAttack
    });

    this.emitState();
    return true;
  }

  // Phase 2: Tactical Intercept
  declareIntercept(action = 'hold', swapToIndex = null) {
    if (this.phase !== 2) return false;
    const defenderSide = this.currentTurn === 'player' ? 'opponent' : 'player';

    if (action === 'swap' && swapToIndex !== null) {
      if (this.swappedThisRound[defenderSide]) {
        return false; // Exhaustion limit reached
      }
      const squad = defenderSide === 'player' ? this.playerSquad : this.opponentSquad;
      const target = squad[swapToIndex];
      if (!target || target.isFainted) return false;

      // Execute swap
      if (defenderSide === 'player') {
        this.playerActiveIndex = swapToIndex;
      } else {
        this.opponentActiveIndex = swapToIndex;
      }
      this.swappedThisRound[defenderSide] = true;

      this.onCombatEvent({
        type: 'TACTICAL_SWAP',
        side: defenderSide,
        hero: target.name
      });
    } else {
      this.onCombatEvent({
        type: 'HOLD_GROUND',
        side: defenderSide,
        hero: this.getActiveHero(defenderSide).name
      });
    }

    this.phase = 3;
    this.emitState();
    this.resolveDamage();
    return true;
  }

  // Phase 3: Damage Resolution & Meter Accumulation
  resolveDamage() {
    if (this.phase !== 3 || !this.declaredAttack) return;

    const attackerSide = this.declaredAttack.attackerSide;
    const defenderSide = attackerSide === 'player' ? 'opponent' : 'player';
    const attacker = this.getActiveHero(attackerSide);
    const defender = this.getActiveHero(defenderSide);

    let damageToDefender = this.declaredAttack.rawDamage;
    let reflectedDamage = 0;

    // Check Defender Kinetic Bastion Reflection
    if (defender.kineticBastionActive) {
      reflectedDamage = Math.floor(damageToDefender * 0.5);
      damageToDefender = Math.ceil(damageToDefender * 0.5);
      defender.kineticBastionActive = false; // Consumed
    }

    // Apply damage to defender
    defender.currentHp = Math.max(0, defender.currentHp - damageToDefender);

    // Apply reflected damage to attacker if any
    if (reflectedDamage > 0 && attacker) {
      attacker.currentHp = Math.max(0, attacker.currentHp - reflectedDamage);
    }

    // Meter Updates:
    // Fighters accumulate on damage dealt
    if (attacker.class === 'Fighter') {
      attacker.currentMeter = Math.min(attacker.ultThreshold, attacker.currentMeter + damageToDefender);
    }
    // Tanks & Supports accumulate on damage received
    if (defender.class === 'Tank' || defender.class === 'Support') {
      defender.currentMeter = Math.min(defender.ultThreshold, defender.currentMeter + damageToDefender);
    }

    this.onCombatEvent({
      type: 'DAMAGE_RESOLVED',
      attackerSide,
      defenderSide,
      damage: damageToDefender,
      reflected: reflectedDamage,
      defenderHp: defender.currentHp,
      attackerHp: attacker.currentHp,
      defenderFainted: defender.currentHp <= 0,
      attackerFainted: attacker.currentHp <= 0
    });

    // Check Faint
    if (defender.currentHp <= 0) {
      defender.isFainted = true;
      this.handleHeroFaint(defenderSide);
    }
    if (attacker && attacker.currentHp <= 0) {
      attacker.isFainted = true;
      this.handleHeroFaint(attackerSide);
    }

    // Turn handover
    if (!this.winner) {
      this.endTurn();
    } else {
      this.emitState();
    }
  }

  handleHeroFaint(side) {
    const squad = side === 'player' ? this.playerSquad : this.opponentSquad;
    const aliveIndex = squad.findIndex(h => !h.isFainted);

    if (aliveIndex === -1) {
      // Squad wiped!
      this.winner = side === 'player' ? 'opponent' : 'player';
      this.onCombatEvent({
        type: 'MATCH_ENDED',
        winner: this.winner
      });
      return;
    }

    // Auto-advance to next available hero
    if (side === 'player') {
      this.playerActiveIndex = aliveIndex;
    } else {
      this.opponentActiveIndex = aliveIndex;
    }

    this.onCombatEvent({
      type: 'HERO_DEPLOYED',
      side,
      hero: squad[aliveIndex].name
    });
  }

  endTurn() {
    this.currentTurn = this.currentTurn === 'player' ? 'opponent' : 'player';
    this.phase = 1;
    this.declaredAttack = null;
    this.swappedThisRound[this.currentTurn] = false; // Reset swap exhaustion for next round
    this.emitState();
  }

  emitState() {
    this.onStateChange({
      playerSquad: this.playerSquad,
      opponentSquad: this.opponentSquad,
      playerActive: this.getActiveHero('player'),
      opponentActive: this.getActiveHero('opponent'),
      currentTurn: this.currentTurn,
      phase: this.phase,
      declaredAttack: this.declaredAttack,
      swappedThisRound: this.swappedThisRound,
      winner: this.winner
    });
  }
}
