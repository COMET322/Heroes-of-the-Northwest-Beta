/*:
 * @target MZ
 * @plugindesc Fixes canvas stretching and mouse alignment for web.
 * @author Wavedash / Fixed
 */
(() => {
    // 1. Force the canvas to fill the window
    Graphics._defaultStretchMode = function () {
        return true;
    };

    // 2. Fix the mouse/touch coordinates
    const _Graphics_pageToCanvasX = Graphics.pageToCanvasX;
    Graphics.pageToCanvasX = function(pageX) {
        if (this._canvas) {
            const rect = this._canvas.getBoundingClientRect();
            const scaleX = this._width / rect.width;
            return (pageX - rect.left) * scaleX;
        }
        return _Graphics_pageToCanvasX.call(this, pageX);
    };

    const _Graphics_pageToCanvasY = Graphics.pageToCanvasY;
    Graphics.pageToCanvasY = function(pageY) {
        if (this._canvas) {
            const rect = this._canvas.getBoundingClientRect();
            const scaleY = this._height / rect.height;
            return (pageY - rect.top) * scaleY;
        }
        return _Graphics_pageToCanvasY.call(this, pageY);
    };
})();