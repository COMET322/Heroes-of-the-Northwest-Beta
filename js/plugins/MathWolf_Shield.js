//=============================================================================
// MathWolf_Shield.js
// Adds a shield/barrier system: a flat pool of "extra HP" that absorbs
// damage before real HP is touched, shown as a glowing overlay on the HP gauge.
//=============================================================================

/*:
 * @target MZ
 * @plugindesc MathWolf Shield - damage-absorbing barrier + HP gauge overlay
 * @author MathWolf Dev
 *
 * @help
 * ============================================================================
 * MATHWOLF - SHIELD SYSTEM
 * ============================================================================
 * HOW TO GRANT A SHIELD
 * Put this in the Note box of ANY skill:
 *
 *       <MathWolfShield:1000>   (Gives a flat 1000 shield points)
 *       <MathWolfShield:10%>    (Gives a shield equal to 10% of Max HP)
 *
 * That grants the shield points to each target the skill successfully hits.
 * 
 * ----------------------------------------------------------------------------
 * HOW IT BEHAVES
 * - Shield sits "in front of" HP. Any incoming damage drains shield first;
 *   only the leftover (if any) touches real HP.
 * - On the battle HP gauge, shield shows as a glowing colored segment.
 * - Shield does NOT expire on its own - it lasts until damage uses it up, 
 *   or the battle ends (it's cleared at the start of every new battle).
 * ============================================================================
 */

(() => {
  "use strict";

  //=====================================================================
  // Shield storage
  //=====================================================================
  Game_BattlerBase.prototype.mathWolfShield = function () {
    return this._mathWolfShieldValue || 0;
  };

  Game_BattlerBase.prototype.gainMathWolfShield = function (amount) {
    this._mathWolfShieldValue = Math.max(0, this.mathWolfShield() + amount);
  };

  Game_BattlerBase.prototype.loseMathWolfShield = function (amount) {
    this._mathWolfShieldValue = Math.max(0, this.mathWolfShield() - amount);
  };

  Game_BattlerBase.prototype.clearMathWolfShield = function () {
    this._mathWolfShieldValue = 0;
  };

  //=====================================================================
  // Clear everyone's shield at the start of each battle
  //=====================================================================
  const _BattleManager_startBattle = BattleManager.startBattle;
  BattleManager.startBattle = function () {
    _BattleManager_startBattle.call(this);
    for (const actor of $gameParty.battleMembers()) {
      actor.clearMathWolfShield();
    }
  };

  //=====================================================================
  // Grant shield when a skill/item hits a target
  //=====================================================================
  const _Game_Action_apply = Game_Action.prototype.apply;
  Game_Action.prototype.apply = function (target) {
    _Game_Action_apply.call(this, target);
    const item = this.item();
    if (item && item.meta && item.meta.MathWolfShield && target) {
      
      const tagValue = String(item.meta.MathWolfShield);
      let amount = 0;

      // Check if the tag contains a % symbol
      if (tagValue.includes("%")) {
        // It's a percentage! Calculate based on target's Max HP
        const percent = Number(tagValue.replace("%", "")) || 0;
        amount = Math.floor(target.mhp * (percent / 100));
      } else {
        // It's a flat number
        amount = Number(tagValue) || 0;
      }

      if (amount > 0) {
        target.gainMathWolfShield(amount);
        
        // Force a refresh of the battle status window if it exists
        if (SceneManager._scene && SceneManager._scene._statusWindow) {
          SceneManager._scene._statusWindow.refresh();
        }
      }
    }
  };

  //=====================================================================
  // Incoming damage drains shield first, then real HP
  //=====================================================================
  const _Game_Action_executeHpDamage = Game_Action.prototype.executeHpDamage;
  Game_Action.prototype.executeHpDamage = function (target, value) {
    if (value > 0 && target && target.mathWolfShield() > 0) {
      const shield = target.mathWolfShield();
      const absorbed = Math.min(shield, value);
      target.loseMathWolfShield(absorbed);
      value -= absorbed;
    }
    _Game_Action_executeHpDamage.call(this, target, value);
  };

  //=====================================================================
  // Draw a glowing barrier overlay on the HP gauge
  //=====================================================================
  const _Sprite_Gauge_update = Sprite_Gauge.prototype.update;
  Sprite_Gauge.prototype.update = function () {
    _Sprite_Gauge_update.call(this);

    if (this._statusType !== "hp") return;
    const battler = this._battler;
    if (!battler || typeof battler.mathWolfShield !== "function") return;

    const shield = battler.mathWolfShield();
    const mhp = battler.mhp;
    if (mhp <= 0) return;

    if (shield !== this._mathWolfLastShield) {
      this._mathWolfLastShield = shield;
      
      // 1. Force a redraw of the normal HP gauge first
      this.redraw();

      // 2. Now draw the barrier overlay on top
      if (shield > 0) {
        const width = this.bitmap.width;
        const height = this.bitmap.height;

        const shieldRate = Math.min(1, shield / mhp);
        const innerW = width - 2;
        const shieldFillW = Math.floor(innerW * shieldRate);

        if (shieldFillW > 0) {
          // Set a translucent "glow" color
          this.bitmap.paintOpacity = 0.6; 
          this.bitmap.fillRect(1, 1, shieldFillW, height - 2, "#a0d8ff");
          
          // Reset opacity back to normal so it doesn't affect other things
          this.bitmap.paintOpacity = 1.0;
        }
      }
    }
  };
})();