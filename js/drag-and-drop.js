import { Utils } from './utils.js'

export class DragAndDropHandler {
  constructor () {
    this.clearHandlers()
  }

  addDragHandler (data, node, onStartDrag, img) {
    if (typeof (onStartDrag) !== 'function') throw new Error("You didn't define a drag start function!")
    if (typeof (node.id) !== 'string' || node.id === '') throw new Error("Node doesn't have an id!")
    this.onStartDrag[node.id] = onStartDrag

    node.setAttribute('draggable', 'true')

    node.addEventListener('dragstart', e => {
      e.dataTransfer.effectAllowed = 'copy' // only dropEffect='copy' will be dropable
      e.dataTransfer.setData('Text', data) // required otherwise doesn't work
      if ('id' in node === false || node.id in this.onStartDrag === false) {
        console.error("Can't call drag start function!")
      }
      this.onStartDrag[node.id](node)
      if (img) e.dataTransfer.setDragImage(img, img.width * 0.9, img.height * 0.9)
    })
  }

  addDropHandler (node, onDrop) {
    if (typeof (onDrop) !== 'function') throw new Error("You didn't define a drop function!")
    if (typeof (node.id) !== 'string') throw new Error("Node doesn't have an id!")
    this.onDrop[node.id] = onDrop

    node.addEventListener('dragover', e => {
      e.preventDefault()
      node.classList.add('over')
      e.dataTransfer.dropEffect = 'copy'
      return false
    })
    node.addEventListener('dragleave', () => node.classList.remove('over'))

    node.addEventListener('drop', e => {
      if (e.stopPropagation) e.stopPropagation()
      e.preventDefault()

      Utils.checkHereUp(e.target, elem => {
        const hasDropAction = 'id' in elem && elem.id in this.onDrop
        if (hasDropAction) {
          this.onDrop[elem.id](elem, e.dataTransfer.getData('Text'))
        }
        return hasDropAction
      })

      return false
    })
  }

  removeDragHandler (node) {
    if (node && node.id in this.onStartDrag) delete this.onStartDrag[node.id]
  }

  removeDropHandler (node) {
    if (node && node.id in this.onDrop) delete this.onDrop[node.id]
  }

  clearHandlers () {
    this.onStartDrag = {}
    this.onDrop = {}
  }
}
