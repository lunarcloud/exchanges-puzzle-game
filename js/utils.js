class Utils {
    constructor() {

        this.chromeApp = (typeof(window.chrome) !== "undefined" && typeof(chrome.runtime) !== "undefined" && typeof(chrome.runtime.id) !== "undefined");
        this.popup = (window.opener && !window.statusbar.visible);
        this.navigatorAppQuittable = typeof(navigator) !== "undefined" && typeof(navigator.app) !== "undefined" && typeof(navigator.app.exitApp) === "function";
        this.quittable = this.chromeApp || this.popup || this.navigatorAppQuittable;
    }

    quit() {
        if ( !this.quittable ) return;

        if (this.navigatorAppQuittable) {
            navigator.app.exitApp();
        } else if ( this.quittable ) {
            window.close();
        }
    }

    fullscreenToggle() {
        screenfull.toggle();
    }
}

