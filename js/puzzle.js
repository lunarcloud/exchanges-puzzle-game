import {TapOrHoldHandler} from './tap-or-press.js';
import {DragAndDropHandler} from './drag-and-drop.js';

export class Puzzle {
    constructor(dialog, winHandler, returnHandler, nextHandler) {
        this.winHandler = winHandler;
        this.returnHandler = returnHandler;
        this.nextHandler = nextHandler;

        this.goalElement = document.getElementById("goal");
        this.focusDisplay = document.getElementById("focus");
        this.mapElement = document.getElementById("map");
        this.dialog = dialog;

        console.debug("Created Puzzle Controller");
    }

    load(index, levelDefinition) {

        this.index = index;
        if (typeof(levelDefinition) !== "object") throw "level definition missing!";
        this.originalDefinition = levelDefinition;


        this.title = levelDefinition.title;
        this.goal = levelDefinition.goal;
        this.map = levelDefinition.map;

        let goalIcon = typeof(this.goal.icon) === "string" ? this.goal.icon : this.goal.name;
        this.replaceFocusOrGoal(this.goalElement, "media/sprites/" + goalIcon + ".svg", this.goal.name);
        this.mapElement.innerHTML = ''; // clear
        this.unfocus();

        for (var i = 0; i < this.map.length; i++) {
            let row = document.createElement("tr");
            for (var j = 0; j < this.map[i].length; j++) {
                let cell = this.generateCell('map-' + i + '-' + j, this.map[i][j]);
                row.appendChild(cell);
            }
            this.mapElement.appendChild(row);
        }

        this.tapOrHoldHandler = new TapOrHoldHandler(true);
        this.dragAndDropHandler = new DragAndDropHandler();

        var tableCells = document.querySelectorAll("#map td");
        for (var i = 0; i < tableCells.length; i++) {
            this.tapOrHoldHandler.add(
                tableCells[i],
                node => this.focusOrCombine(node),
                node => this.ask(node),
                node => this.clearAsk(node)
            );

            if (tableCells[i].getAttribute("type") == "item") {
                this.dragAndDropHandler.addDragHandler(
                    "dummy drag data",
                    tableCells[i],
                    node => this.focus(node),
                    tableCells[i].querySelector("img")
                );
                this.dragAndDropHandler.addDragHandler(
                    "dummy drag data",
                    tableCells[i].querySelector("img"),
                    node => this.focus(node),
                    tableCells[i].querySelector("img")
                );
            }
            this.dragAndDropHandler.addDropHandler(
                tableCells[i],
                node => this.combine(node),
                true
            );
        }
        console.debug("Loaded Puzzle: " + this.title);
    }


    generateCell(id, data) {
        var clone = document.importNode(document.getElementById("item-cell").content.querySelector("td"), true);
        clone.id = id;
        clone.querySelector("img").alt = id;
        clone.querySelector("img").src = '"media/sprites/' + data.type + '/' + data.name + '.svg"';

        if (typeof(data) !== "object" || typeof(data.type) !== "string" || typeof(data.name) !== "string") {
            clone.innerHTML = ''; // empty cell
        } else {
            clone.classList.add(data.type);
            for (var i in data) {
                if (i == 'gives' && typeof(data[i]) === "object") {
                    clone.setAttribute(i, JSON.stringify(data[i]));
                } else {
                    clone.setAttribute(i, data[i]);
                }
            }
            clone.querySelector("img").src = 'media/sprites/' + (typeof(data.icon) === "string" ? data.icon : data.name) + '.svg';
            clone.querySelector("img").addEventListener("contextmenu", e => {e.preventDefault(); e.stopPropagation(); return false;});
            if (typeof(data.desire) === typeof([]) && data.desire.length > 1) {
                clone.querySelector("progress").setAttribute("max", data.desire.length);
            }
        }
        return clone;
    }

    replaceFocusOrGoal(element, img, name) {
        var clone = document.importNode(document.getElementById("focus-or-goal-content").content, true);
        clone.querySelector("img").src = img;
        element.innerHTML = '';
        element.appendChild(clone);
        element.setAttribute("name", name);
    }

    getArrayFromAttr(node, name) {
        var text = node.getAttribute(name);
        return typeof(text) === "string" ? text.split(',') : [];
    }

    getGivesFromNode(node) {
        let text = node.getAttribute("gives");
        if (typeof(text) !== "string") {
            return {};
        } else if (text.startsWith("{") && text.endsWith("}")) {
            return JSON.parse(text);
        } else {
            return { type: "item", name: text };
        }
    }

    focusOrCombine(node) {
        if (this.focusTarget === node) {
            return;
        } else if (this.focusTarget !== null) {
            this.combine(node);
        } else if (node.getAttribute("type") == "item") {
            this.focus(node);
        }
    }

    focus(node) {
        if (node.nodeName == "IMG") {
            node = node.parentElement;
        }

        let type = node.getAttribute("type");
        let name = node.getAttribute("name");
        let icon = node.hasAttribute("icon") ? node.getAttribute("icon") : node.getAttribute("name");

        if (type != "item") {
            this.unfocus();
            return;
        }

        if (node == this.focusTarget) return;
        console.debug("Focus: " + type + " | " + name);

        let previousTarget = this.focusTarget;
        this.focusTarget = node;

        node.classList.add("focusing");
        setTimeout(() => requestAnimationFrame(() => node.classList.remove("focusing")), 300);

        this.replaceFocusOrGoal(this.focusDisplay, "media/sprites/" + icon + ".svg", name);
        this.checkWin();
    }

    unfocus() {
        this.focusDisplay.innerHTML = '';
        this.focusDisplay.removeAttribute("name");
        this.focusTarget = null;
    }

    combine(node) {
        if (this.focusTarget === null || node == this.focusTarget) return;

        if (node.nodeName == "IMG") {
            node = node.parentElement;
        }

        let focusName = this.focusTarget.getAttribute("name");

        let name = node.getAttribute("name");
        let type = node.getAttribute("type");
        let desire = this.getArrayFromAttr(node, "desire");
        let gives = this.getGivesFromNode(node, "gives");
        let holdUp = this.getArrayFromAttr(node, "holdup");
        let removes = this.getArrayFromAttr(node, "removes");

        var puzzle = this;

        /* TODO fix that this only works dragging td to td */
        if (desire.includes(focusName)) {

            let holdUpCount = 0;
            for (var i = 0; i < holdUp.length; i++) {
                let elem = document.querySelector("#map td[name=" + holdUp[i] + "]");
                if (typeof(elem) !== "undefined" && elem !== null) holdUpCount++;
            }

            if (holdUpCount > 0) {

                this.unfocus();
                this.holdUpDialog(holdUp);
            } else {

                console.debug("Combine " + name + " with " + focusName + ".");
                let id = node.id;
                let progressbar = node.querySelector("progress");

                for (var i = 0; i < removes.length; i++) {
                    let elem = document.querySelector("#map td[name=" + removes[i] + "]");
                    if (typeof(elem) === "undefined" || elem === null) continue;

                    let removeGives = this.getGivesFromNode(elem, "gives");
                    elem.parentElement.replaceChild(puzzle.generateCell(elem.id, removeGives), elem);
                }

                puzzle.focusTarget.parentElement.replaceChild(
                            puzzle.generateCell(puzzle.focusTarget.id, {}),
                            puzzle.focusTarget);

                puzzle.unfocus();

                setTimeout(() => {
                    progressbar.value++;
                    if (progressbar.value >= progressbar.max) {
                        console.debug("Dropping " + gives.name + ".");
                        node.parentElement.replaceChild(puzzle.generateCell(node.id, gives), node);
                        puzzle.focus(document.getElementById(node.id));
                    }
                }, 100);
            }
        } else {
            this.unfocus();
        }
    }

    ask(node) {
        let type = node.getAttribute("type");
        let name = node.getAttribute("name");
        let desire = this.getArrayFromAttr(node, "desire");
        if (desire.length < 1) return;
        let holdup = this.getArrayFromAttr(node, "holdup");

        let askElem = document.importNode(document.getElementById("dialog-ask").content, true);
        let askItems = askElem.querySelector("items");
        for (var i = 0; i < desire.length; i++) {
            if (this.mapElement.querySelector("[name='" + desire[i] + "']") == null) continue;

            let itemElem = document.importNode(document.getElementById("item").content, true);
            itemElem.querySelector("img").src = this.mapElement.querySelector("[name='" + desire[i] + "'] img").src;
            askItems.appendChild(itemElem);
        }

        this.dialog.innerHTML = "";
        this.dialog.appendChild(askElem);

        try{
            this.dialog.showModal();
            requestAnimationFrame(() => node.classList.add("asking"));
        } catch(error) {
            // not important
        }
    }

    holdUpDialog(holdUpList) {
        var clone = document.importNode(document.getElementById("dialog-hold-up").content, true);
        let holdElem = document.importNode(document.getElementById("dialog-hold-up").content, true);

        for (var i = 0; i < holdUpList.length; i++) {
            let holdingElem = document.querySelector("#map td[name=" + holdUpList[i] + "]");
            let icon = holdingElem.hasAttribute("icon") ? holdingElem.getAttribute("icon") : holdingElem.getAttribute("name");
            let itemElem = document.importNode(document.getElementById("item").content, true);
            itemElem.querySelector("img").src = 'media/sprites/' + icon + '.svg';
            holdElem.querySelector("items").appendChild(itemElem);
        }

        this.dialog.innerHTML = "";
        this.dialog.appendChild(holdElem);

        try{
            this.dialog.showModal();
        } catch(error) {
            // not important
        }
    }

    clearAsk(node) {
        let type = node.getAttribute("type");
        let name = node.getAttribute("name");
        console.debug("Clear Ask: " + type + " | " + name);
        this.dialog.close();
        requestAnimationFrame(() => {
            node.classList.remove("asking");
        });
    }

    checkWin() {
        if (this.focusDisplay.getAttribute("name") == this.goalElement.getAttribute("name")) {

            var moreLevels = this.winHandler(this.index);

            var clone = document.importNode(document.getElementById("dialog-win").content, true);
            clone.querySelector("img").src = this.goalElement.querySelector("img").src;

            this.dialog.innerHTML = '';
            this.dialog.appendChild(clone);

            document.getElementById("win-menu").addEventListener("click", e => this.returnHandler());
            if (moreLevels) document.getElementById("win-next").addEventListener("click", e => this.nextHandler(this.index));
            else document.getElementById("win-next").parentElement.removeChild(document.getElementById("win-next"));

            try{
                this.dialog.showModal();
            } catch(error) {
                // not important
            }
        }
    }
}
