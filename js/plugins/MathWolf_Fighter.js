//=============================================================================
// MathWolf_Fighter.js
// v6: Fighter role math-QTE combat + the shared QTE system for all classes.
// Questions come from the question bank (MathWolf_Questions.js).
// NEW: after a battle, a review screen explains every question you missed.
//=============================================================================

/*:
 * @target MZ
 * @plugindesc MathWolf Fighter v6 - Math QTE (algebra question bank) + post-battle review
 * @author MathWolf Dev
 *
 * @param durabilityMax
 * @text Max Weapon Durability
 * @desc How many successful parries the fighter gets per battle.
 * @type number
 * @default 3
 *
 * @param attackTier
 * @text Attack Question Tier
 * @desc Which question pool the Fighter's attack QTE draws from.
 * @type select
 * @option Easy
 * @value easy
 * @option Medium
 * @value medium
 * @option Hard
 * @value hard
 * @default medium
 *
 * @param attackTimeSeconds
 * @text Attack Time Limit (seconds)
 * @desc Time to answer the attack question. Keep this LONGER than the parry time.
 * @type number
 * @default 45
 *
 * @param parryTier
 * @text Parry Question Tier
 * @desc Which question pool the parry QTE draws from. Easy recommended.
 * @type select
 * @option Easy
 * @value easy
 * @option Medium
 * @value medium
 * @option Hard
 * @value hard
 * @default easy
 *
 * @param parryTimeSeconds
 * @text Parry Time Limit (seconds)
 * @desc Time to answer the parry question. Shorter than attack = parry feels like a reflex.
 * @type number
 * @default 20
 *
 * @param successMultiplier
 * @text Attack Success Multiplier
 * @type number
 * @decimals 2
 * @default 1.50
 *
 * @param failMultiplier
 * @text Attack Fail Multiplier
 * @type number
 * @decimals 2
 * @default 0.60
 *
 * @param parryReduction
 * @text Parry Damage Reduction
 * @desc 1.00 = fully blocked, 0.80 = only 20% damage taken.
 * @type number
 * @decimals 2
 * @default 0.80
 *
 * @param berserkChainTier
 * @text Berserk Chain Question Tier
 * @desc Question pool for the bonus "flurry" QTE during Berserk.
 * @type select
 * @option Easy
 * @value easy
 * @option Medium
 * @value medium
 * @option Hard
 * @value hard
 * @default easy
 *
 * @param berserkChainTimeSeconds
 * @text Berserk Chain Time Limit (seconds)
 * @desc Shorter than a normal attack - reflects reckless speed.
 * @type number
 * @default 20
 *
 * @param berserkChainMultiplier
 * @text Berserk Chain Success Multiplier
 * @desc Total attack multiplier if BOTH the normal hit and the chain succeed.
 * @type number
 * @decimals 2
 * @default 2.20
 *
 * @param showReview
 * @text Show Review After Battle
 * @desc After a battle, show every question you missed with the correct answer and an explanation.
 * @type boolean
 * @default true
 *
 * @param reviewTitle
 * @text Review: Title
 * @type string
 * @default Review Soal
 *
 * @param labelYourAnswer
 * @text Review: "Your answer" label
 * @type string
 * @default Jawabanmu
 *
 * @param labelTimeUp
 * @text Review: "Time's up" label
 * @type string
 * @default Waktu habis
 *
 * @param labelCorrect
 * @text Review: "Correct answer" label
 * @type string
 * @default Jawaban benar
 *
 * @param labelExplanation
 * @text Review: "Explanation" label
 * @type string
 * @default Pembahasan
 *
 * @param hintNext
 * @text Review: hint (more questions left)
 * @type string
 * @default Enter: lanjut  |  Esc: lewati semua
 *
 * @param hintDone
 * @text Review: hint (last question)
 * @type string
 * @default Enter: selesai
 *
 * @help
 * ============================================================================
 * MATHWOLF - FIGHTER v6  (also hosts the shared math-QTE system)
 * ============================================================================
 * REQUIRES: MathWolf_Questions.js must be enabled too (it holds the actual
 * questions). Without it the game falls back to simple multiplication.
 *
 * SETUP:
 * Open Database > Actors, pick your fighter, and put this in the Note box:
 *
 *       <MathWolfRole:Fighter>
 *
 * ----------------------------------------------------------------------------
 * HOW QUESTIONS WORK (new in v5)
 * Questions are multiple choice (A-D), taken from three tiers:
 *   Easy   - quick algebra basics
 *   Medium - factoring, fractions, inequalities
 *   Hard   - word problems (multi-step)
 * Each QTE type picks a tier and a time limit in Plugin Manager:
 *   ATTACK : Medium, 45 s      PARRY : Easy, 20 s      BERSERK CHAIN : Easy, 20 s
 * Parry is deliberately easier AND faster than attack.
 *
 * ----------------------------------------------------------------------------
 * WHAT HAPPENS IN BATTLE
 *
 * ATTACK: Fighter picks Attack > picks a target > question appears.
 *   Correct = bonus damage. Wrong or timeout = weak hit.
 *
 * PARRY: An enemy targets the Fighter > question appears (only while
 *   weapon durability is above 0).
 *   Correct = damage heavily reduced, durability -1.
 *   Wrong or timeout = full damage, durability unchanged.
 *
 * Durability refills at the start of every battle.
 *
 * ----------------------------------------------------------------------------
 * BERSERK
 * Create a State with this notetag in its Note box:
 *
 *       <MathWolfBerserk>
 *
 * While that state is active, every successful normal Attack immediately
 * chains into a SECOND, faster question for bonus damage. Missing the chain
 * just means no bonus - the base hit still lands normally.
 *
 * ----------------------------------------------------------------------------
 * POST-BATTLE REVIEW (new in v6)
 * Every question you get wrong (or run out of time on) is remembered. When
 * the battle ends - after the usual victory messages - a review screen shows
 * each missed question once: your answer, the correct answer, and a short
 * explanation (the "e:" text in MathWolf_Questions.js).
 *   Enter / click : next question (or finish)
 *   Left          : previous question
 *   Esc / right-click : skip the rest
 * Works for every class, since all QTEs go through the same system.
 * Turn it off with "Show Review After Battle" = false.
 * ============================================================================
 */

(() => {
  "use strict";

  const PLUGIN_NAME = "MathWolf_Fighter";
  const params = PluginManager.parameters(PLUGIN_NAME);

  const TIERS = ["easy", "medium", "hard"];
  function readTier(value, fallback) {
    const t = String(value || fallback).toLowerCase();
    return TIERS.indexOf(t) >= 0 ? t : fallback;
  }

  const DURABILITY_MAX = Number(params.durabilityMax || 3);
  const ATTACK_TIER = readTier(params.attackTier, "medium");
  const ATTACK_TIME = Number(params.attackTimeSeconds || 45);
  const PARRY_TIER = readTier(params.parryTier, "easy");
  const PARRY_TIME = Number(params.parryTimeSeconds || 20);
  const SUCCESS_MULT = Number(params.successMultiplier || 1.5);
  const FAIL_MULT = Number(params.failMultiplier || 0.6);
  const PARRY_REDUCTION = Number(params.parryReduction || 0.8);
  const CHAIN_TIER = readTier(params.berserkChainTier, "easy");
  const CHAIN_TIME = Number(params.berserkChainTimeSeconds || 20);
  const CHAIN_MULT = Number(params.berserkChainMultiplier || 2.2);
  const DEFAULT_QTE_SECONDS = 30;
  const SHOW_REVIEW = params.showReview !== "false";
  const TXT_TITLE = params.reviewTitle || "Review Soal";
  const TXT_YOURS = params.labelYourAnswer || "Jawabanmu";
  const TXT_TIMEUP = params.labelTimeUp || "Waktu habis";
  const TXT_RIGHT = params.labelCorrect || "Jawaban benar";
  const TXT_EXPL = params.labelExplanation || "Pembahasan";
  const HINT_NEXT = params.hintNext || "Enter: lanjut  |  Esc: lewati semua";
  const HINT_DONE = params.hintDone || "Enter: selesai";

  //=====================================================================
  // Shared problem system (also used by the Mage plugin via window.MathWolf)
  //=====================================================================
  window.MathWolf = window.MathWolf || {};
  MathWolf._decks = {};
  MathWolf._lastDrawn = {};
  MathWolf._warned = false;

  const SUP = ["\u2070", "\u00B9", "\u00B2", "\u00B3", "\u2074", "\u2075", "\u2076", "\u2077", "\u2078", "\u2079"];
  const SUB = ["\u2080", "\u2081", "\u2082", "\u2083", "\u2084", "\u2085", "\u2086", "\u2087", "\u2088", "\u2089"];

  // Turns keyboard-friendly math (x^2, <=, x_1, " - ") into proper symbols
  MathWolf.pretty = function (text) {
    return String(text)
      .replace(/\^(\d)/g, function (m, d) { return SUP[Number(d)]; })
      .replace(/_(\d)/g, function (m, d) { return SUB[Number(d)]; })
      .replace(/<=/g, "\u2264")
      .replace(/>=/g, "\u2265")
      .replace(/ \* /g, " \u00D7 ")
      .replace(/ - /g, " \u2212 ")
      .replace(/(^|[\s(=,{])-(?=[\w(])/g, "$1\u2212");
  };

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = arr[i];
      arr[i] = arr[j];
      arr[j] = t;
    }
    return arr;
  }

  function isValidItem(item) {
    return (
      item &&
      typeof item.q === "string" &&
      Array.isArray(item.c) &&
      item.c.length >= 2 &&
      Number.isInteger(item.a) &&
      item.a >= 0 &&
      item.a < item.c.length
    );
  }

  // Draws the next question of a tier. Questions are dealt from a shuffled
  // deck, so nothing repeats until the whole tier has been used.
  MathWolf.drawFromBank = function (tier) {
    const bank = MathWolf.questionBank && MathWolf.questionBank[tier];
    if (!bank || bank.length === 0) return null;

    for (let attempt = 0; attempt < bank.length; attempt++) {
      let deck = MathWolf._decks[tier];
      if (!deck || deck.length === 0) {
        deck = shuffle(bank.map(function (item, i) { return i; }));
        const last = MathWolf._lastDrawn[tier];
        if (deck.length > 1 && deck[deck.length - 1] === last) {
          const t = deck[0];
          deck[0] = deck[deck.length - 1];
          deck[deck.length - 1] = t;
        }
        MathWolf._decks[tier] = deck;
      }
      const index = deck.pop();
      MathWolf._lastDrawn[tier] = index;
      const item = bank[index];

      if (!isValidItem(item)) {
        console.error("MathWolf: bad question in tier '" + tier + "' at index " + index);
        continue;
      }

      const options = shuffle(
        item.c.map(function (text, i) {
          return { text: MathWolf.pretty(text), correct: i === item.a };
        })
      );
      return {
        question: MathWolf.pretty(item.q),
        explanation: item.e ? MathWolf.pretty(item.e) : "",
        choices: options.map(function (o) { return o.text; }),
        correctIndex: options.findIndex(function (o) { return o.correct; }),
      };
    }
    return null;
  };

  // Simple backup used only if the question bank plugin is missing
  function fallbackProblem() {
    const a = 2 + Math.floor(Math.random() * 9);
    const b = 2 + Math.floor(Math.random() * 9);
    const answer = a * b;
    const set = new Set([answer]);
    let guard = 0;
    while (set.size < 4 && guard++ < 100) {
      const wrong = answer + (Math.random() < 0.5 ? 1 : -1) * (1 + Math.floor(Math.random() * 6));
      if (wrong > 0) set.add(wrong);
    }
    const options = shuffle(
      Array.from(set).map(function (v) {
        return { text: String(v), correct: v === answer };
      })
    );
    return {
      question: a + " \u00D7 " + b + " = ?",
      explanation: "",
      choices: options.map(function (o) { return o.text; }),
      correctIndex: options.findIndex(function (o) { return o.correct; }),
    };
  }

  // The one function every class plugin calls to get a problem
  MathWolf.makeProblem = function (tier) {
    const t = TIERS.indexOf(tier) >= 0 ? tier : "easy";
    const problem = MathWolf.drawFromBank(t);
    if (problem) return problem;
    if (!MathWolf._warned) {
      MathWolf._warned = true;
      console.warn("MathWolf: question bank not found - enable MathWolf_Questions.js");
    }
    return fallbackProblem();
  };

  //=====================================================================
  // Missed-question log for the post-battle review
  //=====================================================================
  MathWolf._misses = [];

  // chosenIndex = which answer was picked, or undefined if time ran out
  MathWolf.recordMiss = function (problem, chosenIndex) {
    if (!problem) return;
    for (const m of MathWolf._misses) {
      if (m.question === problem.question) return; // each question only once
    }
    MathWolf._misses.push({
      question: problem.question,
      chosenText: typeof chosenIndex === "number" ? problem.choices[chosenIndex] : null,
      correctText: problem.choices[problem.correctIndex],
      explanation: problem.explanation || "",
    });
  };

  //=====================================================================
  // Game_System - stores the current attack multiplier
  //=====================================================================
  const _Game_System_initialize = Game_System.prototype.initialize;
  Game_System.prototype.initialize = function () {
    _Game_System_initialize.call(this);
    this._mathWolfAttackMultiplier = 1.0;
  };

  Game_System.prototype.mathWolfAttackMultiplier = function () {
    return this._mathWolfAttackMultiplier || 1.0;
  };

  Game_System.prototype.setMathWolfAttackMultiplier = function (value) {
    this._mathWolfAttackMultiplier = value;
  };

  //=====================================================================
  // Game_Actor - role + weapon durability
  //=====================================================================
  Game_Actor.prototype.mathWolfRole = function () {
    const actorMeta = this.actor().meta.MathWolfRole;
    if (actorMeta) return String(actorMeta).trim();
    const cls = this.currentClass();
    const classMeta = cls ? cls.meta.MathWolfRole : null;
    return classMeta ? String(classMeta).trim() : null;
  };

  Game_Actor.prototype.isMathWolfFighter = function () {
    return this.mathWolfRole() === "Fighter";
  };

  // True while the actor has any state tagged <MathWolfBerserk> in its Note
  Game_BattlerBase.prototype.isMathWolfBerserk = function () {
    return this.states().some(function (s) {
      return s && s.meta && s.meta.MathWolfBerserk;
    });
  };

  Game_Actor.prototype.mathWolfDurability = function () {
    if (this._mathWolfDurability === undefined) {
      this._mathWolfDurability = DURABILITY_MAX;
    }
    return this._mathWolfDurability;
  };

  Game_Actor.prototype.mathWolfRefillDurability = function () {
    this._mathWolfDurability = DURABILITY_MAX;
  };

  Game_Actor.prototype.mathWolfConsumeDurability = function () {
    this._mathWolfDurability = Math.max(0, this.mathWolfDurability() - 1);
  };

  //=====================================================================
  // Game_Temp - the QTE request queue (shared by every MathWolf class
  // plugin). tier = "easy" | "medium" | "hard", seconds = time limit.
  //=====================================================================
  Game_Temp.prototype.requestMathWolfQTE = function (title, tier, callback, seconds) {
    this._mathWolfRequest = {
      title: title,
      tier: tier,
      callback: callback,
      seconds: typeof seconds === "number" && seconds > 0 ? seconds : DEFAULT_QTE_SECONDS,
    };
  };

  Game_Temp.prototype.mathWolfRequest = function () {
    return this._mathWolfRequest || null;
  };

  Game_Temp.prototype.clearMathWolfRequest = function () {
    this._mathWolfRequest = null;
  };

  //=====================================================================
  // Refill durability at battle start
  //=====================================================================
  const _BattleManager_startBattle = BattleManager.startBattle;
  BattleManager.startBattle = function () {
    _BattleManager_startBattle.call(this);
    for (const actor of $gameParty.battleMembers()) {
      if (actor.isMathWolfFighter()) actor.mathWolfRefillDurability();
    }
  };

  //=====================================================================
  // Review hooks: start each battle with an empty miss list, and show the
  // review (once) right before the battle scene closes.
  //=====================================================================
  const _BattleManager_setup = BattleManager.setup;
  BattleManager.setup = function () {
    _BattleManager_setup.apply(this, arguments);
    MathWolf._misses = [];
    this._mathWolfReviewDone = false;
  };

  const _BattleManager_updateBattleEnd = BattleManager.updateBattleEnd;
  BattleManager.updateBattleEnd = function () {
    if (
      SHOW_REVIEW &&
      !this._mathWolfReviewDone &&
      !this.isBattleTest() &&
      MathWolf._misses.length > 0
    ) {
      const scene = SceneManager._scene;
      if (scene && scene.startMathWolfReview) {
        this._mathWolfReviewDone = true;
        scene.startMathWolfReview(MathWolf._misses.slice());
        return; // the scene stays busy until the player closes the review
      }
    }
    _BattleManager_updateBattleEnd.call(this);
  };

  //=====================================================================
  // PARRY: pause the action and ask a question before the hit lands
  //=====================================================================
  const _BattleManager_startAction = BattleManager.startAction;
  BattleManager.startAction = function () {
    this._mathWolfPrompted = new Set();
    _BattleManager_startAction.call(this);
  };

  const _BattleManager_updateAction = BattleManager.updateAction;
  BattleManager.updateAction = function () {
    if (this._mathWolfWaiting) return;

    const target = this._targets[0];
    const subject = this._subject;
    const canParry =
      target &&
      target.isActor &&
      target.isActor() &&
      target.isMathWolfFighter() &&
      target.isAlive() &&
      target.mathWolfDurability() > 0 &&
      subject &&
      subject.isEnemy &&
      subject.isEnemy() &&
      this._mathWolfPrompted &&
      !this._mathWolfPrompted.has(target);

    if (canParry) {
      this._mathWolfPrompted.add(target);
      this._mathWolfWaiting = true;
      target._mathWolfParrySuccess = false;

      const self = this;
      const title = "PARRY!  (Weapon durability: " + target.mathWolfDurability() + ")";
      $gameTemp.requestMathWolfQTE(
        title,
        PARRY_TIER,
        function (success) {
          target._mathWolfParrySuccess = success;
          if (success) target.mathWolfConsumeDurability();
          self._mathWolfWaiting = false;
        },
        PARRY_TIME
      );
      return;
    }

    _BattleManager_updateAction.call(this);
  };

  //=====================================================================
  // Damage math: attack multiplier + parry reduction
  //=====================================================================
  const _Game_Action_makeDamageValue = Game_Action.prototype.makeDamageValue;
  Game_Action.prototype.makeDamageValue = function (target, critical) {
    let value = _Game_Action_makeDamageValue.call(this, target, critical);

    const subject = this.subject();
    if (
      subject &&
      subject.isActor &&
      subject.isActor() &&
      subject.isMathWolfFighter() &&
      this.isAttack()
    ) {
      value = Math.floor(value * $gameSystem.mathWolfAttackMultiplier());
    }

    if (target && target._mathWolfParrySuccess && value > 0) {
      value = Math.floor(value * (1 - PARRY_REDUCTION));
    }

    return value;
  };

  const _Game_Action_apply = Game_Action.prototype.apply;
  Game_Action.prototype.apply = function (target) {
    _Game_Action_apply.call(this, target);
    if (target && target._mathWolfParrySuccess) {
      target._mathWolfParrySuccess = false;
    }
  };

  //=====================================================================
  // Window_MathPrompt - title, countdown, wrapped question text, and the
  // shrinking timer bar. Long word problems wrap onto several lines, and
  // the font shrinks a little if a question is extra long.
  //=====================================================================
  function Window_MathPrompt() {
    this.initialize(...arguments);
  }

  Window_MathPrompt.prototype = Object.create(Window_Base.prototype);
  Window_MathPrompt.prototype.constructor = Window_MathPrompt;

  Window_MathPrompt.prototype.initialize = function (rect) {
    Window_Base.prototype.initialize.call(this, rect);
    this._title = "";
    this._lines = [];
    this._qSize = 22;
    this._rate = 1;
    this._secs = 0;
  };

  Window_MathPrompt.prototype.setup = function (title, question, totalFrames) {
    this._title = title;
    this._rate = 1;
    this._secs = Math.ceil(totalFrames / 60);
    this.layoutQuestion(question);
    this.refresh();
  };

  // Splits text into lines that fit the window width (current font size)
  Window_MathPrompt.prototype.wrapLines = function (text, maxWidth) {
    const lines = [];
    const paragraphs = String(text).split("\n");
    for (const para of paragraphs) {
      const words = para.split(" ");
      let line = "";
      for (const word of words) {
        const test = line ? line + " " + word : word;
        if (!line || this.textWidth(test) <= maxWidth) {
          line = test;
        } else {
          lines.push(line);
          line = word;
        }
      }
      lines.push(line);
    }
    return lines;
  };

  // Picks the biggest font size at which the whole question fits
  Window_MathPrompt.prototype.layoutQuestion = function (question) {
    const maxHeight = this.innerHeight - 30 - 22;
    const sizes = [22, 20, 18, 16];
    let chosenSize = 16;
    let chosenLines = [];
    for (const size of sizes) {
      this.contents.fontSize = size;
      const lines = this.wrapLines(question, this.innerWidth);
      chosenSize = size;
      chosenLines = lines;
      if (lines.length * (size + 4) <= maxHeight) break;
    }
    this._qSize = chosenSize;
    this._lines = chosenLines;
  };

  Window_MathPrompt.prototype.updateTimer = function (frames, totalFrames) {
    const rate = Math.max(0, Math.min(1, frames / totalFrames));
    const secs = Math.max(0, Math.ceil(frames / 60));
    if (secs !== this._secs || Math.abs(rate - this._rate) > 0.004) {
      this._secs = secs;
      this._rate = rate;
      this.refresh();
    }
  };

  Window_MathPrompt.prototype.refresh = function () {
    this.contents.clear();
    const w = this.innerWidth;

    // Title (left) and seconds remaining (right)
    this.contents.fontSize = 20;
    this.changeTextColor(ColorManager.systemColor());
    this.drawText(this._title, 0, 0, w, "left");
    this.changeTextColor(this._rate > 0.3 ? ColorManager.normalColor() : ColorManager.powerDownColor());
    this.drawText(this._secs + "s", 0, 0, w, "right");

    // The question
    this.contents.fontSize = this._qSize;
    this.resetTextColor();
    let y = 30;
    for (const line of this._lines) {
      this.drawText(line, 0, y, w, "left");
      y += this._qSize + 4;
    }

    // Timer bar along the bottom
    const barH = 12;
    const barY = this.innerHeight - barH - 2;
    this.contents.fillRect(0, barY, w, barH, "rgba(0,0,0,0.5)");
    const color = this._rate > 0.3 ? "#ffcc44" : "#ff5544";
    this.contents.fillRect(0, barY, Math.floor(w * this._rate), barH, color);

    this.contents.fontSize = $gameSystem.mainFontSize();
  };

  //=====================================================================
  // Window_MathReview - post-battle explanation of one missed question
  //=====================================================================
  function Window_MathReview() {
    this.initialize(...arguments);
  }

  Window_MathReview.prototype = Object.create(Window_Base.prototype);
  Window_MathReview.prototype.constructor = Window_MathReview;
  Window_MathReview.prototype.wrapLines = Window_MathPrompt.prototype.wrapLines;

  Window_MathReview.prototype.initialize = function (rect) {
    Window_Base.prototype.initialize.call(this, rect);
    this._entries = [];
    this._index = 0;
    this._layout = [];
    this._size = 20;
  };

  Window_MathReview.prototype.setEntries = function (entries) {
    this._entries = entries;
    this._index = 0;
    this.layoutEntry();
    this.refresh();
  };

  Window_MathReview.prototype.hasNext = function () {
    return this._index < this._entries.length - 1;
  };

  Window_MathReview.prototype.next = function () {
    if (!this.hasNext()) return false;
    this._index++;
    this.layoutEntry();
    this.refresh();
    return true;
  };

  Window_MathReview.prototype.prev = function () {
    if (this._index <= 0) return false;
    this._index--;
    this.layoutEntry();
    this.refresh();
    return true;
  };

  // Lines of text for one entry at a given font size
  Window_MathReview.prototype.buildLines = function (entry, size) {
    this.contents.fontSize = size;
    const w = this.innerWidth;
    const out = [];
    const self = this;
    function addPara(text, color, gapBefore) {
      const lines = self.wrapLines(text, w);
      for (let i = 0; i < lines.length; i++) {
        out.push({ text: lines[i], color: color, gap: i === 0 ? gapBefore : 0 });
      }
    }
    const yours = entry.chosenText === null ? TXT_TIMEUP : entry.chosenText;
    addPara(entry.question, ColorManager.normalColor(), 0);
    addPara(TXT_YOURS + ": " + yours, ColorManager.powerDownColor(), 10);
    addPara(TXT_RIGHT + ": " + entry.correctText, ColorManager.powerUpColor(), 0);
    if (entry.explanation) {
      addPara(TXT_EXPL + ":", ColorManager.systemColor(), 10);
      addPara(entry.explanation, ColorManager.normalColor(), 0);
    }
    return out;
  };

  // Picks the biggest font size at which everything fits
  Window_MathReview.prototype.layoutEntry = function () {
    const entry = this._entries[this._index];
    const maxHeight = this.innerHeight - 30 - 26;
    const sizes = [20, 18, 16, 14];
    let chosenSize = 14;
    let chosenLines = [];
    for (const size of sizes) {
      const lines = this.buildLines(entry, size);
      let height = 0;
      for (const l of lines) height += l.gap + size + 4;
      chosenSize = size;
      chosenLines = lines;
      if (height <= maxHeight) break;
    }
    this._size = chosenSize;
    this._layout = chosenLines;
  };

  Window_MathReview.prototype.refresh = function () {
    this.contents.clear();
    const w = this.innerWidth;

    this.contents.fontSize = 22;
    this.changeTextColor(ColorManager.systemColor());
    this.drawText(
      TXT_TITLE + " (" + (this._index + 1) + "/" + this._entries.length + ")",
      0, 0, w, "left"
    );

    this.contents.fontSize = this._size;
    let y = 30;
    for (const line of this._layout) {
      y += line.gap;
      this.changeTextColor(line.color);
      this.drawText(line.text, 0, y, w, "left");
      y += this._size + 4;
    }

    this.contents.fontSize = 16;
    this.changeTextColor(ColorManager.systemColor());
    this.drawText(this.hasNext() ? HINT_NEXT : HINT_DONE, 0, this.innerHeight - 24, w, "right");

    this.resetTextColor();
    this.contents.fontSize = $gameSystem.mainFontSize();
  };

  //=====================================================================
  // Window_MathChoices - the answer list (A, B, C, D - one per row)
  //=====================================================================
  function Window_MathChoices() {
    this.initialize(...arguments);
  }

  Window_MathChoices.prototype = Object.create(Window_Command.prototype);
  Window_MathChoices.prototype.constructor = Window_MathChoices;

  Window_MathChoices.prototype.initialize = function (rect) {
    this._choices = [];
    Window_Command.prototype.initialize.call(this, rect);
    this.deactivate();
    this.hide();
  };

  Window_MathChoices.prototype.setChoices = function (choices) {
    this._choices = choices;
    this.refresh();
    this.select(0);
  };

  Window_MathChoices.prototype.maxCols = function () {
    return 1;
  };

  Window_MathChoices.prototype.itemHeight = function () {
    return 36;
  };

  Window_MathChoices.prototype.itemTextAlign = function () {
    return "left";
  };

  Window_MathChoices.prototype.makeCommandList = function () {
    const labels = ["A", "B", "C", "D", "E", "F"];
    for (let i = 0; i < this._choices.length; i++) {
      this.addCommand(labels[i] + ".  " + this._choices[i], "answer", true, i);
    }
  };

  // Which choice (0-3) is highlighted
  Window_MathChoices.prototype.currentChoice = function () {
    return this.currentExt();
  };

  //=====================================================================
  // Scene_Battle - hosting the QTE
  //=====================================================================
  const _Scene_Battle_createAllWindows =
    Scene_Battle.prototype.createAllWindows;
  Scene_Battle.prototype.createAllWindows = function () {
    _Scene_Battle_createAllWindows.call(this);
    this.createMathWolfWindows();
  };

  Scene_Battle.prototype.createMathWolfWindows = function () {
    const margin = 24;
    const width = Graphics.boxWidth - margin * 2;
    const top = 8;
    const gap = 6;
    const promptHeight = 240;
    const choiceHeight = 36 * 4 + 24;

    const promptRect = new Rectangle(margin, top, width, promptHeight);
    this._mathPromptWindow = new Window_MathPrompt(promptRect);
    this._mathPromptWindow.hide();
    this.addWindow(this._mathPromptWindow);

    const choiceRect = new Rectangle(margin, top + promptHeight + gap, width, choiceHeight);
    this._mathChoiceWindow = new Window_MathChoices(choiceRect);
    this._mathChoiceWindow.setHandler("ok", this.onMathWolfAnswer.bind(this));
    this.addWindow(this._mathChoiceWindow);

    const reviewRect = new Rectangle(margin, top, width, 430);
    this._mathReviewWindow = new Window_MathReview(reviewRect);
    this._mathReviewWindow.hide();
    this.addWindow(this._mathReviewWindow);

    this._mathWolfActive = false;
    this._mathWolfReviewActive = false;
  };

  Scene_Battle.prototype.startMathWolfQTE = function (request) {
    this._mathWolfActive = true;
    this._mathWolfCallback = request.callback;
    this._mathWolfProblem = MathWolf.makeProblem(request.tier);
    this._mathWolfTimerTotal = Math.max(1, Math.round(request.seconds * 60));
    this._mathWolfTimer = this._mathWolfTimerTotal;

    if (this._actorCommandWindow) this._actorCommandWindow.deactivate();
    if (this._partyCommandWindow) this._partyCommandWindow.deactivate();
    if (this._enemyWindow) this._enemyWindow.deactivate();
    if (this._actorWindow) this._actorWindow.deactivate();

    this._mathPromptWindow.setup(
      request.title,
      this._mathWolfProblem.question,
      this._mathWolfTimerTotal
    );
    this._mathPromptWindow.show();
    this._mathPromptWindow.open();

    this._mathChoiceWindow.setChoices(this._mathWolfProblem.choices);
    this._mathChoiceWindow.show();
    this._mathChoiceWindow.open();
    this._mathChoiceWindow.activate();
  };

  Scene_Battle.prototype.onMathWolfAnswer = function () {
    const chosen = this._mathChoiceWindow.currentChoice();
    this.finishMathWolfQTE(chosen === this._mathWolfProblem.correctIndex, chosen);
  };

  Scene_Battle.prototype.finishMathWolfQTE = function (success, chosenIndex) {
    if (!this._mathWolfActive) return;
    this._mathWolfActive = false;
    if (!success) MathWolf.recordMiss(this._mathWolfProblem, chosenIndex);

    this._mathChoiceWindow.deactivate();
    this._mathChoiceWindow.hide();
    this._mathPromptWindow.hide();

    SoundManager.playOk();

    const callback = this._mathWolfCallback;
    this._mathWolfCallback = null;
    if (callback) callback(success);
  };

  Scene_Battle.prototype.isMathWolfActive = function () {
    return !!this._mathWolfActive;
  };

  Scene_Battle.prototype.startMathWolfReview = function (entries) {
    this._mathWolfReviewActive = true;
    this._mathWolfReviewDelay = 12; // ignore input briefly so a held key can't skip it
    this._mathReviewWindow.setEntries(entries);
    this._mathReviewWindow.show();
    this._mathReviewWindow.open();
  };

  Scene_Battle.prototype.updateMathWolfReview = function () {
    if (this._mathWolfReviewDelay > 0) {
      this._mathWolfReviewDelay--;
      return;
    }
    if (Input.isTriggered("ok") || TouchInput.isTriggered()) {
      SoundManager.playCursor();
      if (!this._mathReviewWindow.next()) this.finishMathWolfReview();
    } else if (Input.isTriggered("left")) {
      if (this._mathReviewWindow.prev()) SoundManager.playCursor();
    } else if (Input.isTriggered("cancel") || TouchInput.isCancelled()) {
      SoundManager.playCancel();
      this.finishMathWolfReview();
    }
  };

  Scene_Battle.prototype.finishMathWolfReview = function () {
    this._mathWolfReviewActive = false;
    this._mathReviewWindow.hide();
    MathWolf._misses = [];
  };

  const _Scene_Battle_update = Scene_Battle.prototype.update;
  Scene_Battle.prototype.update = function () {
    if (this._mathWolfReviewActive) {
      this.updateMathWolfReview();
    } else if (this._mathWolfActive) {
      this._mathWolfTimer--;
      this._mathPromptWindow.updateTimer(this._mathWolfTimer, this._mathWolfTimerTotal);
      if (this._mathWolfTimer <= 0) {
        this.finishMathWolfQTE(false);
      }
    } else {
      const request = $gameTemp.mathWolfRequest();
      if (request) {
        $gameTemp.clearMathWolfRequest();
        this.startMathWolfQTE(request);
      }
    }
    _Scene_Battle_update.call(this);
  };

  // Freeze battle processing while the player is answering
  const _Scene_Battle_isBusy = Scene_Battle.prototype.isBusy;
  Scene_Battle.prototype.isBusy = function () {
    return (
      this.isMathWolfActive() ||
      !!this._mathWolfReviewActive ||
      _Scene_Battle_isBusy.call(this)
    );
  };

  //=====================================================================
  // ATTACK: ask a question after the target is picked
  //=====================================================================
  const _Scene_Battle_onEnemyOk = Scene_Battle.prototype.onEnemyOk;
  Scene_Battle.prototype.onEnemyOk = function () {
    const actor = BattleManager.actor();
    const action = BattleManager.inputtingAction();

    const isFighterAttack =
      actor &&
      actor.isMathWolfFighter() &&
      action &&
      action.isAttack() &&
      !this._mathWolfAttackResolved;

    if (isFighterAttack) {
      this._enemyWindow.deactivate();
      const self = this;

      // Check if Berserk is active BEFORE asking the first question
      if (actor.isMathWolfBerserk()) {
        const chainTitle = "BERSERK FLURRY! Keep swinging!";
        $gameTemp.requestMathWolfQTE(
          chainTitle,
          CHAIN_TIER,
          function (chainSuccess) {
            // Apply the Berserk multiplier directly (2.20x if correct, 1.50x if wrong)
            $gameSystem.setMathWolfAttackMultiplier(chainSuccess ? CHAIN_MULT : SUCCESS_MULT);
            self._mathWolfAttackResolved = true;
            _Scene_Battle_onEnemyOk.call(self);
            self._mathWolfAttackResolved = false;
          },
          CHAIN_TIME
        );
      } else {
        // Normal fighter attack
        const title = "STRIKE! Solve to hit hard";
        $gameTemp.requestMathWolfQTE(
          title,
          ATTACK_TIER,
          function (firstSuccess) {
            $gameSystem.setMathWolfAttackMultiplier(firstSuccess ? SUCCESS_MULT : FAIL_MULT);
            self._mathWolfAttackResolved = true;
            _Scene_Battle_onEnemyOk.call(self);
            self._mathWolfAttackResolved = false;
          },
          ATTACK_TIME
        );
      }
    } else {
      _Scene_Battle_onEnemyOk.call(this);
    }
  };