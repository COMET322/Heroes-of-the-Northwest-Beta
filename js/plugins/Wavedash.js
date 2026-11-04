/*:
 * @target MZ
 * @plugindesc Enables canvas stretch-to-fit in web browsers.
 * @author Wavedash
 */
(() => {
    // RPG Maker MZ only stretches the canvas for mobile or nwjs by default.
    // This overrides the default stretch mode to scale to the viewport.
    Graphics._defaultStretchMode = function () {
        return true;
    };
})();