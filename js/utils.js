export class Utils {
    constructor() {
    }

    static fullscreenToggle() {
        screenfull.toggle();
    }

    static checkHereUp(element, check) {
        while (element instanceof HTMLElement) {
            if (check(element)) {
                return true;
            } else {
                element = element.parentElement;
            }
        }
        return false;
    }
}

Storage.prototype.setObject = function(key, value) {
    this.setItem(key, JSON.stringify(value));
}

Storage.prototype.getObject = function(key) {
    var value = this.getItem(key);
    return value && JSON.parse(value);
}
