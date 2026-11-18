//=============================================================================
// MathWolf_Tank.js
// Tank role: guarding makes enemies much more likely to target this actor.
// No math involved - this is a pure aggro mechanic.
// UPDATED: Adds a follow-up attack every 7 times the tank is hit.
//=============================================================================

/*:
 * @target MZ
 * @plugindesc MathWolf Tank Prototype - Guard raises aggro + 7-hit Counter
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
 * @param hitsRequired
 * @text Hits Required for Counter
 * @desc How many times the Tank needs to be hit before they automatically strike back.
 * @type number
 * @default 7
 *
 * @param showCounter
 * @text Show Hit Counter Text
 * @desc Show a small popup text when the Tank gets hit, tracking progress towards the counter.
 * @type boolean
 * @default true
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
 * COUNTER ATTACK:
 * Every time the Tank takes damage, their hit counter goes up. When it hits
 * the threshold (default 7), they immediately perform a free normal attack
 * against the enemy who triggered it.
 * ============================================================================
 */

(() => {
  "use strict";

  const PLUGIN_NAME = "MathWolf_Tank";
  const params = PluginManager.parameters(PLUGIN_NAME);
  const AGGRO_MULT = Number(params.aggroMultiplier || 4.0);
  const HITS_REQUIRED = Number(params.hitsRequired || 7);
  const SHOW_COUNTER = params.showCounter !== "false";

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
  // add state ID to the caster (self)
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

  //=====================================================================
  // NEW: Hit Counter & Follow-up Attack System
  //=====================================================================
  const _Game_BattlerBase_performDamage = Game_BattlerBase.prototype.performDamage;
  Game_BattlerBase.prototype.performDamage = function () {
    _Game_BattlerBase_performDamage.call(this);

    // Only proceed if it's the Tank taking damage and they are alive
    if (this.isActor() && this.isMathWolfTank() && this.isAlive()) {
      
      // Initialize counter if it doesn't exist
      if (this._mathWolfHitCounter === undefined) {
        this._mathWolfHitCounter = 0;
      }
      
      this._mathWolfHitCounter++;

      // Show a small popup text so the player knows it's counting
      if (SHOW_COUNTER && this._mathWolfHitCounter < HITS_REQUIRED) {
        this.startDamagePopup(); // RPG Maker MZ default damage popup
        this._result.pushText("Hit: " + this._mathWolfHitCounter + "/" + HITS_REQUIRED);
      }

      // Check if it's time to counter attack
      if (this._mathWolfHitCounter >= HITS_REQUIRED) {
        this._mathWolfHitCounter = 0; // Reset counter
        
        // Show popup that they are countering
        this.startDamagePopup();
        this._result.pushText("COUNTER!");
        
        // Queue a free normal attack against the last attacker
        // We use setTimeout so it waits for the current damage animation to finish
        const tank = this;
        const enemy = tank._lastAttacker; // MZ stores the last attacker here usually
        
        if (enemy && enemy.isAlive()) {
          setTimeout(() => {
            if (SceneManager._scene && SceneManager._scene._spriteset && BattleManager.isProcessing()) {
              const action = new Game_Action(tank);
              action.setAttack();
              action.setTarget(enemy.index());
              action.apply(enemy);
              
              // Play a weapon swing sound to make it feel like a physical counter
              SoundManager.playActorCollapse(); // or SoundManager.playAttack() depending on your sounds
            }
          }, 300); // 300ms delay for realism
        }
      }
    }
  };

  // Track the last attacker on the Tank
  const _Game_Action_apply_tank = Game_Action.prototype.apply;
  Game_Action.prototype.apply = function (target) {
    _Game_Action_apply_tank.call(this, target);
    if (target && target.isActor() && target.isMathWolfTank()) {
      target._lastAttacker = this.subject();
    }
  };

})();