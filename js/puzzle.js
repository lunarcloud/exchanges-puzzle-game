import { TapOrHoldHandler } from './tap-or-press.js'
import { DragAndDropHandler } from './drag-and-drop.js'

export class Puzzle {
  constructor (dialog, winHandler, returnHandler, nextHandler) {
    this.winHandler = winHandler
    this.returnHandler = returnHandler
    this.nextHandler = nextHandler

    this.goalElement = document.getElementById('goal')
    this.focusDisplay = document.getElementById('focus')
    this.mapElement = document.getElementById('map')
    this.dialog = dialog

    console.debug('Created Puzzle Controller')
  }

  load (index, levelDefinition) {
    this.index = index
    if (typeof (levelDefinition) !== 'object') throw new Error('level definition missing!')
    this.originalDefinition = levelDefinition

    this.title = levelDefinition.title
    this.goal = levelDefinition.goal
    this.map = levelDefinition.map
    this.icons = typeof (levelDefinition.icons) === 'object' ? levelDefinition.icons : {}

    const goalIcon = typeof (this.icons[this.goal]) === 'string' ? this.icons[this.goal] : this.goal
    this.replaceFocusOrGoal(this.goalElement, 'media/sprites/' + goalIcon + '.svg', this.goal)
    this.mapElement.innerHTML = '' // clear
    this.unfocus()

    for (let i = 0; i < this.map.length; i++) {
      const row = document.createElement('tr')
      for (let j = 0; j < this.map[i].length; j++) {
        const cell = this.generateCell('map-' + i + '-' + j, this.map[i][j])
        row.appendChild(cell)
      }
      this.mapElement.appendChild(row)
    }

    this.tapOrHoldHandler = new TapOrHoldHandler(true)
    this.dragAndDropHandler = new DragAndDropHandler()

    var tableCells = document.querySelectorAll('#map td')
    for (let i = 0; i < tableCells.length; i++) {
      this.addCellHandler(tableCells[i])
    }
    console.debug('Loaded Puzzle: ' + this.title)
  }

  addCellHandler (cell) {
    this.tapOrHoldHandler.add(
      cell,
      node => this.focusOrCombine(node),
      node => this.ask(node),
      node => this.clearAsk(node)
    )

    if (cell.getAttribute('type') === 'item') {
      const imageElem = cell.querySelector('img')
      const focusAction = node => this.focus(node)
      this.dragAndDropHandler.addDragHandler(cell.id, cell, focusAction, imageElem)
      this.dragAndDropHandler.addDragHandler(cell.id, imageElem, focusAction, imageElem)
    }
    this.dragAndDropHandler.addDropHandler(cell, (node, sourceid) => this.combine(node))
  }

  removeCellHandler (cell) {
    this.tapOrHoldHandler.remove(cell)

    if (cell.getAttribute('type') === 'item') {
      this.dragAndDropHandler.removeDragHandler(cell)
      this.dragAndDropHandler.removeDragHandler(cell.querySelector('img'))
    }
    this.dragAndDropHandler.removeDropHandler(cell)
  }

  generateCell (id, data) {
    var clone = document.importNode(document.getElementById('item-cell').content.querySelector('td'), true)
    clone.id = id

    if (typeof (data) !== 'object' || typeof (data.type) !== 'string' || typeof (data.name) !== 'string') {
      clone.innerHTML = '' // empty cell
    } else {
      clone.classList.add(data.type)
      for (var i in data) {
        if (i === 'gives' && typeof (data[i]) === 'object') {
          clone.setAttribute(i, JSON.stringify(data[i]))
        } else {
          clone.setAttribute(i, data[i])
        }
      }

      clone.querySelector('img').id = id + '-img'
      clone.querySelector('img').alt = id
      if (data.type !== 'hidden') {
        const icon = typeof (this.icons[data.name]) === 'string' ? this.icons[data.name] : data.name
        clone.setAttribute('icon', icon)
        clone.querySelector('img').src = 'media/sprites/' + icon + '.svg'
      }
      clone.querySelector('img').addEventListener('contextmenu', e => { e.preventDefault(); e.stopPropagation(); return false })
      if (typeof (data.desire) === typeof ([]) && data.desire.length > 1) {
        clone.querySelector('progress').setAttribute('max', data.desire.length)
      }
    }
    return clone
  }

  replaceFocusOrGoal (element, img, name) {
    var clone = document.importNode(document.getElementById('focus-or-goal-content').content, true)
    clone.querySelector('img').src = img
    element.innerHTML = ''
    element.appendChild(clone)
    element.setAttribute('name', name)
  }

  getArrayFromAttr (node, name) {
    var text = node.getAttribute(name)
    return typeof (text) === 'string' ? text.split(',') : []
  }

  getGivesFromNode (node) {
    const text = node.getAttribute('gives')
    if (typeof (text) !== 'string') {
      return {}
    } else if (text.startsWith('{') && text.endsWith('}')) {
      return JSON.parse(text)
    } else {
      return { type: 'item', name: text }
    }
  }

  focusOrCombine (node) {
    if (this.focusTarget === node) {

    } else if (this.focusTarget !== null) {
      this.combine(node)
    } else if (node.getAttribute('type') === 'item') {
      this.focus(node)
    }
  }

  focus (node) {
    if (node.nodeName === 'IMG') {
      node = node.parentElement
    }

    const type = node.getAttribute('type')
    const name = node.getAttribute('name')
    const icon = typeof (this.icons[name]) === 'string' ? this.icons[name] : name

    if (type !== 'item') {
      this.unfocus()
      return
    }

    if (node === this.focusTarget) return
    console.debug('Focus: ' + type + ' | ' + name)

    // let previousTarget = this.focusTarget;
    this.focusTarget = node

    node.classList.add('focusing')
    setTimeout(() => window.requestAnimationFrame(() => node.classList.remove('focusing')), 300)

    this.replaceFocusOrGoal(this.focusDisplay, 'media/sprites/' + icon + '.svg', name)
    this.checkWin()
  }

  unfocus () {
    this.focusDisplay.innerHTML = ''
    this.focusDisplay.removeAttribute('name')
    this.focusTarget = null
  }

  combine (node) {
    if (this.focusTarget === null || node === this.focusTarget) return

    if (node.nodeName === 'IMG') {
      node = node.parentElement
    }

    const focusName = this.focusTarget.getAttribute('name')

    const name = node.getAttribute('name')
    // let type = node.getAttribute("type");
    const desire = this.getArrayFromAttr(node, 'desire')
    const gives = this.getGivesFromNode(node, 'gives')
    const holdUp = this.getArrayFromAttr(node, 'holdup')
    const removes = this.getArrayFromAttr(node, 'removes')

    var puzzle = this

    if (desire.includes(focusName)) {
      let holdUpCount = 0
      for (let i = 0; i < holdUp.length; i++) {
        const elem = document.querySelector('#map td[name=' + holdUp[i] + ']')
        if (typeof (elem) !== 'undefined' && elem !== null) holdUpCount++
      }

      if (holdUpCount > 0) {
        this.unfocus()
        this.holdUpDialog(holdUp)
      } else {
        console.debug('Combine ' + name + ' with ' + focusName + '.')
        const progressbar = node.querySelector('progress')

        for (let i = 0; i < removes.length; i++) {
          const elem = document.querySelector('#map td[name=' + removes[i] + ']')
          if (typeof (elem) === 'undefined' || elem === null) continue

          const removeGives = puzzle.generateCell(elem.id, this.getGivesFromNode(elem, 'gives'))
          elem.parentElement.replaceChild(removeGives, elem)

          puzzle.removeCellHandler(elem)
          puzzle.addCellHandler(removeGives)
        }

        puzzle.focusTarget.parentElement.replaceChild(puzzle.generateCell(puzzle.focusTarget.id, {}), puzzle.focusTarget)
        puzzle.unfocus()

        setTimeout(() => {
          progressbar.value++
          if (progressbar.value >= progressbar.max) {
            console.debug('Dropping ' + gives.name + '.')
            const newNode = puzzle.generateCell(node.id, gives)
            node.parentElement.replaceChild(newNode, node)
            puzzle.focus(newNode)

            puzzle.removeCellHandler(node)
            puzzle.addCellHandler(newNode)
          }
        }, 100)
      }
    } else {
      this.unfocus()
    }
  }

  ask (node) {
    const desire = this.getArrayFromAttr(node, 'desire')
    if (desire.length < 1) return

    const askElem = document.importNode(document.getElementById('dialog-ask').content, true)
    const askItems = askElem.querySelector('items')
    for (let i = 0; i < desire.length; i++) {
      const itemElem = document.importNode(document.getElementById('item').content, true)
      const icon = typeof (this.icons[desire[i]]) === 'string' ? this.icons[desire[i]] : desire[i]
      itemElem.querySelector('img').src = 'media/sprites/' + icon + '.svg'
      askItems.appendChild(itemElem)
    }

    this.dialog.innerHTML = ''
    this.dialog.appendChild(askElem)

    try {
      this.dialog.showModal()
      window.requestAnimationFrame(() => node.classList.add('asking'))
    } catch (error) {
      // not important
    }
  }

  holdUpDialog (holdUpList) {
    const holdElem = document.importNode(document.getElementById('dialog-hold-up').content, true)

    for (let i = 0; i < holdUpList.length; i++) {
      const holdingElem = document.querySelector('#map td[name=' + holdUpList[i] + ']')
      const itemElem = document.importNode(document.getElementById('item').content, true)
      const name = holdingElem.getAttribute('name')
      const icon = typeof (this.icons[name]) === 'string' ? this.icons[name] : name
      itemElem.querySelector('img').src = 'media/sprites/' + icon + '.svg'
      holdElem.querySelector('items').appendChild(itemElem)
    }

    this.dialog.innerHTML = ''
    this.dialog.appendChild(holdElem)

    try {
      this.dialog.showModal()
    } catch (error) {
      // not important
    }
  }

  clearAsk (node) {
    const type = node.getAttribute('type')
    const name = node.getAttribute('name')
    console.debug('Clear Ask: ' + type + ' | ' + name)
    this.dialog.close()
    window.requestAnimationFrame(() => {
      node.classList.remove('asking')
    })
  }

  checkWin () {
    if (this.focusDisplay.getAttribute('name') === this.goalElement.getAttribute('name')) {
      var moreLevels = this.winHandler(this.index)

      var clone = document.importNode(document.getElementById('dialog-win').content, true)
      clone.querySelector('img').src = this.goalElement.querySelector('img').src

      this.dialog.innerHTML = ''
      this.dialog.appendChild(clone)

      /* eslint-disable no-unused-vars */
      document.getElementById('win-menu').addEventListener('click', e => this.returnHandler())
      if (moreLevels) {
        document.getElementById('win-next').addEventListener('click', e => this.nextHandler(this.index))
      } else {
        document.getElementById('win-next').parentElement.removeChild(document.getElementById('win-next'))
      }
      /* eslint-enable no-unused-vars */

      try {
        this.dialog.showModal()
      } catch (error) {
        // not important
      }
    }
  }
}
