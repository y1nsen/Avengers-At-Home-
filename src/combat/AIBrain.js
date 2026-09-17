// Local AI Opponent Decision Tree
export class AIBrain {
  constructor(engine) {
    this.engine = engine;
  }

  // Handle AI turn action (Phase 1)
  makeTurnMove() {
    const aiHero = this.engine.getActiveHero('opponent');
    if (!aiHero || aiHero.isFainted) return;

    // Check Ultimate
    const canUlt = aiHero.currentMeter >= aiHero.ultThreshold;

    if (canUlt) {
      // If Tank and HP is low, trigger Kinetic Bastion
      if (aiHero.class === 'Tank' && aiHero.currentHp < 150) {
        this.engine.declareAttack(true);
        return;
      }
      // If Fighter, trigger Overdrive
      if (aiHero.class === 'Fighter') {
        this.engine.declareAttack(true);
        return;
      }
      // If Support, trigger Avengers Assemble
      if (aiHero.class === 'Support') {
        this.engine.declareAttack(true);
        return;
      }
    }

    // Default: Standard strike
    this.engine.declareAttack(false);
  }

  // Handle AI Tactical Intercept (Phase 2)
  makeInterceptDecision() {
    const incoming = this.engine.declaredAttack;
    const aiHero = this.engine.getActiveHero('opponent');
    const reserves = this.engine.opponentSquad
      .map((h, idx) => ({ ...h, index: idx }))
      .filter((h, idx) => idx !== this.engine.opponentActiveIndex && !h.isFainted);

    // If incoming damage is heavy (> 50 or Ultimate), and AI has a healthy Tank in reserves
    if (incoming && (incoming.isUltimate || incoming.rawDamage >= 50) && !this.engine.swappedThisRound.opponent) {
      const healthyTank = reserves.find(h => h.class === 'Tank' && h.currentHp > 80);
      if (healthyTank && aiHero.class !== 'Tank') {
        this.engine.declareIntercept('swap', healthyTank.index);
        return;
      }
    }

    // Default: Hold Ground
    this.engine.declareIntercept('hold');
  }
}
