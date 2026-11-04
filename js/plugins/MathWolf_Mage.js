//=============================================================================
// MathWolf_Mage.js
// v3: Mage role. Damaging spells have a math QTE (bonus/reduced damage), and
// getting attacked triggers a "barrier" QTE that spends MP. The Priest/buffer
// stays untagged and gets no QTEs - this plugin only touches actors tagged Mage.
//
// REQUIRES: MathWolf_Fighter.js (shared QTE windows) and
//           MathWolf_Questions.js (the question bank) to be enabled too.
//=============================================================================

/*:
 * @target MZ
 * @plugindesc MathWolf Mage v3 - Math QTE (algebra question bank) for spells & MP barrier
 * @author MathWolf Dev
 *
 * @param attackTier
 * @text Spell Question Tier
 * @desc Which question pool the Mage's spell QTE draws from. Hard = word problems.
 * @type select
 * @option Easy
 * @value easy
 * @option Medium
 * @value medium
 * @option Hard
 * @value hard
 * @default hard
 *
 * @param attackTimeSeconds
 * @text Spell Time Limit (seconds)
 * @desc Time to answer the spell question. Keep this LONGER than the barrier time.
 * @type number
 * @default 90
 *
 * @param barrierTier
 * @text Barrier Question Tier
 * @desc Which question pool the barrier QTE draws from. Easy recommended.
 * @type select
 * @option Easy
 * @value easy
 * @option Medium
 * @value medium
 * @option Hard
 * @value hard
 * @default easy
 *
 * @param barrierTimeSeconds
 * @text Barrier Time Limit (seconds)
 * @desc Time to answer the barrier question. Shorter than spells = reflex.
 * @type number
 * @default 20
 *
 * @param manaCost
 * @text Barrier MP Cost
 * @desc MP spent each time the barrier successfully blocks a hit.
 * @type number
 * @default 8
 *
 * @param successMultiplier
 * @text Attack Success Multiplier
 * @type number
 * @decimals 2
 * @default 1.60
 *
 * @param failMultiplier
 * @text Attack Fail Multiplier
 * @type number
 * @decimals 2
 * @default 0.60
 *
 * @param barrierReduction
 * @text Barrier Damage Reduction
 * @desc 1.00 = fully blocked, 0.85 = only 15% damage taken.
 * @type number
 * @decimals 2
 * @default 0.85
 *
 * @help
 * ============================================================================
 * MATHWOLF - MAGE v3
 * ============================================================================
 * SETUP:
 * Open Database > Actors, pick your mage, and put this in the Note box:
 *
 *       <MathWolfRole:Mage>
 *
 * Leave your Priest/buffer actor with NO MathWolfRole tag at all - an
 * untagged actor is invisible to every MathWolf plugin, so they just play
 * normal RPG Maker combat with no math popups.
 *
 * Needs MathWolf_Fighter.js AND MathWolf_Questions.js enabled.
 *
 * ----------------------------------------------------------------------------
 * WHAT HAPPENS IN BATTLE
 *
 * SPELLS: Mage picks Attack or a single-target damage spell, picks a target,
 *   a question appears (Hard word problems, 90 s by default).
 *   Correct = bonus damage. Wrong/timeout = weak hit.
 *
 * BARRIER: An enemy targets the Mage (only while their MP is at least the
 *   barrier cost) - an Easy question appears (20 s by default).
 *   Correct = damage heavily reduced, MP cost is spent.
 *   Wrong/timeout = full damage, no MP spent.
 * ============================================================================
 */

(() => {
  "use strict";

  const PLUGIN_NAME = "MathWolf_Mage";
  const params = PluginManager.parameters(PLUGIN_NAME);

  const TIERS = ["easy", "medium", "hard"];
  function readTier(value, fallback) {
    const t = String(value || fallback).toLowerCase();
    return TIERS.indexOf(t) >= 0 ? t : fallback;
  }

  const ATTACK_TIER = readTier(params.attackTier, "hard");
  const ATTACK_TIME = Number(params.attackTimeSeconds || 90);
  const BARRIER_TIER = readTier(params.barrierTier, "easy");
  const BARRIER_TIME = Number(params.barrierTimeSeconds || 20);
  const MANA_COST = Number(params.manaCost || 8);
  const SUCCESS_MULT = Number(params.successMultiplier || 1.6);
  const FAIL_MULT = Number(params.failMultiplier || 0.6);
  const BARRIER_REDUCTION = Number(params.barrierReduction || 0.85);

  //=====================================================================
  // Recognizes any damage-dealing action (basic Attack OR a Skill/spell
  // with an HP-damage effect). Heal/buff skills are left alone.
  //=====================================================================
  function isMathWolfDamagingAction(action) {
    if (!action || !action.item) return false;
    const item = action.item();
    return !!item && !!item.damage && item.damage.type === 1;
  }

  //=====================================================================
  // Role helper - defined defensively in case Fighter plugin is missing
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

  Game_Actor.prototype.isMathWolfMage = function () {
    return this.mathWolfRole() === "Mage";
  };

  //=====================================================================
  // Game_System - mage's own attack multiplier (kept separate from
  // Fighter's, so a Fighter attacking and a Mage attacking never clash)
  //=====================================================================
  const _Game_System_initialize = Game_System.prototype.initialize;
  Game_System.prototype.initialize = function () {
    _Game_System_initialize.call(this);
    this._mathWolfMageAttackMultiplier = 1.0;
  };

  Game_System.prototype.mathWolfMageAttackMultiplier = function () {
    return this._mathWolfMageAttackMultiplier || 1.0;
  };

  Game_System.prototype.setMathWolfMageAttackMultiplier = function (value) {
    this._mathWolfMageAttackMultiplier = value;
  };

  //=====================================================================
  // BARRIER: pause the action and ask a question before the hit lands
  //=====================================================================
  const _BattleManager_updateAction = BattleManager.updateAction;
  BattleManager.updateAction = function () {
    if (this._mathWolfWaiting) return;

    const target = this._targets[0];
    const subject = this._subject;
    const canBarrier =
      target &&
      target.isActor &&
      target.isActor() &&
      target.isMathWolfMage() &&
      target.isAlive() &&
      target.mp >= MANA_COST &&
      subject &&
      subject.isEnemy &&
      subject.isEnemy() &&
      this._mathWolfPrompted &&
      !this._mathWolfPrompted.has(target);

    if (canBarrier) {
      this._mathWolfPrompted.add(target);
      this._mathWolfWaiting = true;
      target._mathWolfBarrierSuccess = false;

      const self = this;
      const title = "BARRIER!  (MP: " + target.mp + " / cost " + MANA_COST + ")";
      $gameTemp.requestMathWolfQTE(
        title,
        BARRIER_TIER,
        function (success) {
          target._mathWolfBarrierSuccess = success;
          if (success) target.setMp(Math.max(0, target.mp - MANA_COST));
          self._mathWolfWaiting = false;
        },
        BARRIER_TIME
      );
      return;
    }

    _BattleManager_updateAction.call(this);
  };

  //=====================================================================
  // Damage math: mage attack multiplier + barrier reduction
  //=====================================================================
  const _Game_Action_makeDamageValue = Game_Action.prototype.makeDamageValue;
  Game_Action.prototype.makeDamageValue = function (target, critical) {
    let value = _Game_Action_makeDamageValue.call(this, target, critical);

    const subject = this.subject();
    if (
      subject &&
      subject.isActor &&
      subject.isActor() &&
      subject.isMathWolfMage() &&
      isMathWolfDamagingAction(this)
    ) {
      value = Math.floor(value * $gameSystem.mathWolfMageAttackMultiplier());
    }

    if (target && target._mathWolfBarrierSuccess && value > 0) {
      value = Math.floor(value * (1 - BARRIER_REDUCTION));
    }

    return value;
  };

  const _Game_Action_apply = Game_Action.prototype.apply;
  Game_Action.prototype.apply = function (target) {
    _Game_Action_apply.call(this, target);
    if (target && target._mathWolfBarrierSuccess) {
      target._mathWolfBarrierSuccess = false;
    }
  };

  //=====================================================================
  // ATTACK / SPELL: ask a question after the target is picked
  //=====================================================================
  const _Scene_Battle_onEnemyOk = Scene_Battle.prototype.onEnemyOk;
  Scene_Battle.prototype.onEnemyOk = function () {
    const actor = BattleManager.actor();
    const action = BattleManager.inputtingAction();

    const isMageAttack =
      actor &&
      actor.isMathWolfMage() &&
      action &&
      isMathWolfDamagingAction(action) &&
      !this._mathWolfMageAttackResolved;

    if (isMageAttack) {
      this._enemyWindow.deactivate();
      const self = this;
      const title = "SPELLCAST! Solve to strike";
      $gameTemp.requestMathWolfQTE(
        title,
        ATTACK_TIER,
        function (success) {
          $gameSystem.setMathWolfMageAttackMultiplier(
            success ? SUCCESS_MULT : FAIL_MULT
          );
          self._mathWolfMageAttackResolved = true;
          _Scene_Battle_onEnemyOk.call(self);
          self._mathWolfMageAttackResolved = false;
        },
        ATTACK_TIME
      );
    } else {
      _Scene_Battle_onEnemyOk.call(this);
    }
  };
})();