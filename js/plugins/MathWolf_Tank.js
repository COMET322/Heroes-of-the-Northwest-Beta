//=============================================================================
// MathWolf_Tank.js
// Tank role: guarding makes enemies much more likely to target this actor.
// No math involved - this is a pure aggro mechanic.
//=============================================================================

/*:
 * @target MZ
 * @plugindesc MathWolf Tank Prototype - Guard raises aggro (target rate)
 * @author MathWolf Dev
 *
 * @param aggroMultiplier
 * @text Aggro Multiplier While Guarding
 * @desc How many times more likely enemies are to target this actor
 * while they are guarding. 4 = enemies favor them roughly 4x as often.
 * @type number
 * @decimals 1
 * @default 4.0
 *
 * @help
 * ============================================================================
 * MATHWOLF - TANK PROTOTYPE
 * ============================================================================
 * SETUP:
 * Open Database > Actors, pick your tank, and put this in the Note box:
 *
 *       <MathWolfRole:Tank>
 *
 * ----------------------------------------------------------------------------
 * WHAT HAPPENS IN BATTLE
 * When this actor chooses "Guard", their target rate is multiplied by
 * aggroMultiplier for that turn (until they act again). Most enemy AI in
 * RPG Maker MZ picks targets randomly weighted by target rate, so a big
 * multiplier makes them the overwhelmingly likely target while guarding.
 *
 * NOTE: If an enemy's action has a specific AI condition that always
 * targets, say, "lowest HP ally" instead of a random target, aggro won't
 * override that - target rate only affects random-weighted target choice,
 * which is what most default enemy attacks use.
 * ============================================================================
 */

(() => {
  "use strict";

  const PLUGIN_NAME = "MathWolf_Tank";
  const params = PluginManager.parameters(PLUGIN_NAME);
  const AGGRO_MULT = Number(params.aggroMultiplier || 4.0);

  //=====================================================================
  // Role helper - defined defensively so this plugin works even if
  // MathWolf_Fighter.js is disabled or missing.
  //=====================================================================
  if (!Game_Actor.prototype.mathWolfRole) {
    Game_Actor.prototype.mathWolfRole = function () {
      const actorMeta = this.actor().meta.MathWolfRole;
      if (actorMeta) return String(actorMeta).trim();
      const cls = this.currentClass();
      const classMeta = cls ? cls.meta.MathWolfRole : null;
      return classMeta ? String(classMeta).trim() : null;
    };
  }

  Game_Actor.prototype.isMathWolfTank = function () {
    return this.mathWolfRole() === "Tank";
  };

  //=====================================================================
  // Mark the actor as "aggroed" when they guard
  //=====================================================================
  const _Scene_Battle_commandGuard = Scene_Battle.prototype.commandGuard;
  Scene_Battle.prototype.commandGuard = function () {
    const actor = BattleManager.actor();
    if (actor && actor.isMathWolfTank()) {
      actor._mathWolfGuardActive = true;
    }
    _Scene_Battle_commandGuard.call(this);
  };

  //=====================================================================
  // Clear the flag once the turn is done (guard lasts "until next turn",
  // matching how RPG Maker's default guard duration behaves)
  //=====================================================================
  const _Game_Battler_onTurnEnd = Game_Battler.prototype.onTurnEnd;
  Game_Battler.prototype.onTurnEnd = function () {
    _Game_Battler_onTurnEnd.call(this);
    if (this._mathWolfGuardActive) {
      this._mathWolfGuardActive = false;
    }
  };

  //=====================================================================
  // Boost target rate (tgr) while guarding OR while a taunt state
  // (any state tagged <MathWolfTaunt:N> in its Note box) is active
  //=====================================================================
  const tgrDescriptor = Object.getOwnPropertyDescriptor(
    Game_BattlerBase.prototype,
    "tgr"
  );
  const _tgr_get = tgrDescriptor.get;

  Object.defineProperty(Game_BattlerBase.prototype, "tgr", {
    get: function () {
      let value = _tgr_get.call(this);
      if (this._mathWolfGuardActive) {
        value *= AGGRO_MULT;
      }
      if (this.states) {
        for (const state of this.states()) {
          if (state && state.meta && state.meta.MathWolfTaunt) {
            value *= Number(state.meta.MathWolfTaunt) || 1;
          }
        }
      }
      return value;
    },
    configurable: true,
  });

  //=====================================================================
  // ULTIMATE: when a skill tagged <MathWolfTankUltimate:ID> is used,
  // add state ID to the caster (self) - regardless of the skill's own
  // Scope, which is usually "All Allies" so the shield-grant notetag
  // (from MathWolf_Shield.js) can also hit the whole party in the same
  // action. This runs once per use, not once per target.
  //=====================================================================
  const _BattleManager_startAction_tank = BattleManager.startAction;
  BattleManager.startAction = function () {
    const subject = this._subject;
    const action = subject ? subject.currentAction() : null;
    const item = action ? action.item() : null;
    if (subject && item && item.meta && item.meta.MathWolfTankUltimate) {
      const stateId = Number(item.meta.MathWolfTankUltimate);
      if (stateId > 0) subject.addState(stateId);
    }
    _BattleManager_startAction_tank.call(this);
  };
})();