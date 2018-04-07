
class TapOrHoldHandler {
    constructor (node, onTap, onHold, onRelease) {

        this.onTap = typeof(onTap) == "function" ? onTap : e => {};
        this.onHold = typeof(onHold) == "function" ? onHold : e => {};
        this.onRelease = typeof(onRelease) == "function" ? onRelease : e => {};

        this.holdTime = 1000;
        this.releaseCooldown = 300;
        this.holding = false;
        this.presstimer = null;
        this.node = node;

        node.addEventListener("click", e => this.click(e), {passive: true});
        node.addEventListener("mousedown", e => this.start(e), {passive: true});
        node.addEventListener("touchstart", e => this.start(e), {passive: true});
        node.addEventListener("mouseout", e => this.cancel(e), {passive: true});
        node.addEventListener("mouseup", e => this.cancel(e), {passive: true});
        node.addEventListener("touchend", e => this.cancel(e), {passive: true});
        node.addEventListener("touchleave", e => this.cancel(e), {passive: true});
        node.addEventListener("touchcancel", e => this.cancel(e), {passive: true});
    }

    click(e) {
        if (this.presstimer !== null) {
            clearTimeout(this.presstimer);
            this.presstimer = null;
        }
        if (this.holding) return false;
        else this.onTap(this.node);
    }

    start(e) {
        if (e.type === "click" && e.button !== 0) return;

        var handler = this;
        this.holding = false;
        this.presstimer = setTimeout(function() {
            handler.onHold(handler.node);
            handler.holding = true;
        }, this.holdTime);
        return false;
    }


    cancel(e) {
        if (this.presstimer !== null) {
            clearTimeout(this.presstimer);
            this.presstimer = null;
        }
        if (this.holding) {
            var handler = this;
            setTimeout(() => {
                handler.holding = false;
            }, this.releaseCooldown);
            this.onRelease(this.node);
        }
    }
}
