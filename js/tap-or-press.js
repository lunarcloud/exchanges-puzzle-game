
class TapOrHoldHandler {
    constructor (ignoreDialogOut) {

        this.clear();
        this.utils = new Utils();

        this.ignoreDialogOut = ignoreDialogOut || true;
        this.holdTime = 1000;
        this.releaseCooldown = 300;
        this.holding = null;
        this.presstimer = null;

        document.addEventListener("click", e => this.click(e), {passive: true});
        document.addEventListener("mousedown", e => this.start(e), {passive: true});
        document.addEventListener("touchstart", e => this.start(e), {passive: true});
        document.addEventListener("mouseout", e => this.cancel(e), {passive: true});
        document.addEventListener("mouseup", e => this.cancel(e), {passive: true});
        document.addEventListener("touchend", e => this.cancel(e), {passive: true});
        document.addEventListener("touchleave", e => this.cancel(e), {passive: true});
        document.addEventListener("touchcancel", e => this.cancel(e), {passive: true});
    }

    add(node, onTap, onHold, onRelease) {
        if (typeof(onTap) == "function") this.onTap[node] = onTap;
        if (typeof(onHold) == "function") this.onHold[node] = onHold;
        if (typeof(onRelease) == "function") this.onRelease[node] = onRelease;
    }

    clear() {
        this.onTap = {};
        this.onHold = {};
        this.onRelease = {};

    }

    click(e) {
        if (this.presstimer !== null) {
            clearTimeout(this.presstimer);
            this.presstimer = null;
        }
        var handler = this;
        var check = function(target) {
            if (typeof(handler.onTap[target]) === "function") {
                handler.onTap[target](target);
                handler.holding = target;
                return true;
            }
            return false;
        };

        if (this.holding) return false;
        else {
            this.utils.checkHereUp(e.target, check);
        }
    }

    start(e) {
        if (e.type === "click" && e.button !== 0) return;

        this.holding = null;

        var handler = this;
        var check = function(target) {
            if (typeof(handler.onHold[target]) === "function") {
                handler.onHold[target](target);
                handler.holding = target;
                return true;
            }
            return false;
        };

        this.presstimer = setTimeout(function() {
            handler.utils.checkHereUp(e.target, check);
        }, this.holdTime);
        return false;
    }


    cancel(e) {
        if (this.ignoreDialogOut && (e.type === "mouseout" || e.type === "touchleave")) {
            var check = function(target) {
                return target.tagName != "DIALOG";
            };
            if (this.utils.checkHereUp(e.target, check)) return;
        }

        if (this.presstimer !== null) {
            clearTimeout(this.presstimer);
            this.presstimer = null;
        }
        if (this.holding) {
            var handler = this;
            setTimeout(() => {
                handler.holding = null;
            }, this.releaseCooldown);
            if (typeof(this.onRelease[this.holding]) === "function") this.onRelease[this.holding](this.holding);
        }
    }
}
