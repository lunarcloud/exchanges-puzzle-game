/* globals screenfull */

export class Utils {
  static fullscreenToggle () {
    screenfull.toggle()
  }

  static checkHereUp (element, check) {
    while (element instanceof window.HTMLElement) {
      if (check(element)) {
        return true
      } else {
        element = element.parentElement
      }
    }
    return false
  }
}

window.Storage.prototype.setObject = function (key, value) {
  this.setItem(key, JSON.stringify(value))
}

window.Storage.prototype.getObject = function (key) {
  var value = this.getItem(key)
  return value && JSON.parse(value)
}
