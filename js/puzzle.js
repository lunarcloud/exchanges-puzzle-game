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

    generateCell(id, data) {
        var clone = document.importNode(
                document.getElementById("item-cell").content.querySelector("td"),
                true);
        clone.querySelector("img").src = '"media/sprites/' + data.type + '/' + data.name + '.png"';
        clone.id = id;

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
            clone.querySelector("img").src = 'media/sprites/'
                + data.type + '/'
                + (typeof(data.icon) === "string" ? data.icon : data.name)
                + '.png';
            clone.querySelector("label").textContent = data.name;
            if (typeof(data.desire) === typeof([]) && data.desire.length > 1) {
                clone.querySelector("progress").setAttribute("max", data.desire.length);
            }
        }
        return clone;
    }

    replaceFocusOrGoal(element, img, label) {
        var clone = document.importNode(
                document.getElementById("focus-or-goal-content").content,
                true);
        clone.querySelector("img").src = img;
        clone.querySelector("label").textContent = label;
        element.innerHTML = '';
        element.appendChild(clone);
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

    load(index, levelDefinition) {

        this.index = index;
        if (typeof(levelDefinition) !== "object") throw "level definition missing!";
        this.originalDefinition = levelDefinition;

        this.focusTarget = null;

        this.title = levelDefinition.title;
        this.goal = levelDefinition.goal;
        this.map = levelDefinition.map;

        this.replaceFocusOrGoal(this.goalElement, "media/sprites/item/" + this.goal + ".png", this.goal);
        this.focusDisplay.innerHTML = ''; // clear
        this.mapElement.innerHTML = ''; // clear

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
            this.dragAndDropHandler.add(
                tableCells[i],
                tableCells[i].getAttribute("type") == "item",
                node => this.focus(node),
                node => this.combine(node)
            );
        }
        console.debug("Loaded Puzzle: " + this.title);
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
        let type = node.getAttribute("type");
        let name = node.getAttribute("name");

        if (type != "item") return;

        if (node == this.focusTarget) return;
        console.debug("Focus: " + type + " | " + name);

        let previousTarget = this.focusTarget;
        this.focusTarget = node;

        node.classList.add("focusing");
        setTimeout(() => requestAnimationFrame(() => node.classList.remove("focusing")), 300);

        this.replaceFocusOrGoal(this.focusDisplay, "media/sprites/item/" + name + ".png", name);

        this.checkWin();
    }

    combine(node) {
        if (this.focusTarget === null || node == this.focusTarget) return;

        let focusName = this.focusTarget.getAttribute("name");

        let name = node.getAttribute("name");
        let type = node.getAttribute("type");
        let desire = this.getArrayFromAttr(node, "desire");
        let gives = this.getGivesFromNode(node, "gives");
        let holdUp = this.getArrayFromAttr(node, "holdup");

        var puzzle = this;

        /* TODO fix that this only works dragging td to td */
        if (desire.includes(focusName)) {

            let holdUpCount = 0;
            for (var i = 0; i < holdUp.length; i++) {
                let elem = document.querySelector("#map td[name=" + holdUp[i] + "]");
                if (typeof(elem) !== "undefined" && elem !== null) holdUpCount++;
            }
            if (holdUpCount > 0) {

                this.focusDisplay.innerHTML = '';
                puzzle.focusTarget = null;
                this.holdUpDialog(holdUp);
            } else {

                console.debug("Combine " + name + " with " + focusName + ".");
                let id = node.id;
                let progressbar = node.querySelector("progress");
                puzzle.focusTarget.innerHTML = '';
                while(puzzle.focusTarget.attributes.length > 0) puzzle.focusTarget.removeAttribute(puzzle.focusTarget.attributes[0].name);
                puzzle.focusTarget = null;
                puzzle.focusDisplay.innerHTML = '';

                setTimeout(() => {
                    let desireCount = progressbar.max;
                    for (var i = 0; i < desire.length; i++) {
                        let elem = document.querySelector("#map td[name=" + desire[i] + "]");
                        if (typeof(elem) !== "undefined" && elem !== null) desireCount--;
                    }
                    progressbar.value = desireCount;

                    if (progressbar.value >= progressbar.max) {
                        console.debug("Dropping " + gives + ".");
                        node.parentElement.replaceChild(
                            puzzle.generateCell(node.id, gives),
                            node);
                        puzzle.focus(document.getElementById(id));
                    }
                }, 100);
            }
        }
    }

    ask(node) {
        let type = node.getAttribute("type");
        let name = node.getAttribute("name");
        let desire = this.getArrayFromAttr(node, "desire");
        if (desire.length < 1) return;
        let holdup = this.getArrayFromAttr(node, "holdup");

        let askElem = document.importNode(document.getElementById("dialog-ask").content, true);
        for (var i = 0; i < desire.length; i++) {
            let itemElem = document.importNode(document.getElementById("item").content, true);
            itemElem.querySelector("img").src = 'media/sprites/item/' + desire[i] + '.png';
            itemElem.querySelector("label").textContent = desire[i];
            askElem.appendChild(itemElem);
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
        var clone = document.importNode(
                document.getElementById("dialog-hold-up").content,
                true);

        let holdElem = document.importNode(document.getElementById("dialog-hold-up").content, true);

        for (var i = 0; i < holdUpList.length; i++) {
            let icon = document.querySelector("#map td[name=" + holdUpList[i] + "]").icon;
            let itemElem = document.importNode(document.getElementById("item").content, true);
            itemElem.querySelector("img").src = 'media/sprites/item/' + icon + '.png';
            itemElem.querySelector("label").textContent = holdUpList[i];
            holdElem.querySelector("items").appendChild(itemElem);
        }

        this.dialog.innerHTML = "";
        this.dialog.appendChild(holdElem);

        try{
            this.dialog.showModal();
            requestAnimationFrame(() => node.classList.add("asking"));
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
        if (this.focusDisplay.querySelector("label").textContent == this.goalElement.querySelector("label").textContent) {

            this.winHandler(this.index);

            var clone = document.importNode(
                document.getElementById("dialog-win").content,
                true);
            clone.querySelector("img").src = 'media/sprites/item/' + this.goal + '.png';

            this.dialog.innerHTML = "";
            this.dialog.appendChild(clone);

            document.getElementById("win-menu").addEventListener("click", e => this.returnHandler());
            document.getElementById("win-next").addEventListener("click", e => this.nextHandler(this.index));

            try{
                this.dialog.showModal();
            } catch(error) {
                // not important
            }
        }
    }
}
