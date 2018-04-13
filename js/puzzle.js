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

    generateCellHTML(id, data) {
        if (typeof(data.type) !== "string") {
            return '<td id="' + id + '"></td>';
        } else {
            return '<td id="' + id + '" class="' + data.type + '" type="' + data.type + '" name="' + data.name + '" desire="' + (data.desire ? data.desire : '')  + '" gives="' + (data.gives ? data.gives : '')  + '">'
                + '<img src="media/sprites/' + data.type + '/' + data.name + '.png">'
                + '<label>' + data.name + '</label>'
                + '</td>';
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

        this.goalElement.innerHTML = '<img src="media/sprites/item/' + this.goal + '.png">'
        + '<label>' + this.goal + '</label>';
        this.focusDisplay.innerHTML = ''; // clear
        this.mapElement.innerHTML = ''; // clear

        var mapHTML = '';
        for (var i = 0; i < this.map.length; i++) {
            mapHTML += '<tr>';
            for (var j = 0; j < this.map[i].length; j++) {
                mapHTML += this.generateCellHTML('map-' + i + '-' + j, this.map[i][j]);
            }
            mapHTML += '</tr>';
        }
        this.mapElement.innerHTML = mapHTML;

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

        this.focusDisplay.innerHTML = '<img src="media/sprites/item/' + name + '.png">'
            + '<label>' + name + '</label>';

        this.checkWin();
    }

    combine(node) {
        if (this.focusTarget === null || node == this.focusTarget) return;
        // TODO Combination logic

        let focusName = this.focusTarget.getAttribute("name");

        let name = node.getAttribute("name");
        let type = node.getAttribute("type");
        let desire = node.getAttribute("desire");
        let gives = node.getAttribute("gives");

        var puzzle = this;

        /* TODO fix that this only works dragging td to td */
        if (desire == focusName) {
            console.debug("Combine " + name + " with " + focusName + ". Dropping " + gives + ".");
            node.style.opacity = 0;
            var id = node.id;
            setTimeout(() => {
                puzzle.focusTarget.innerHTML = this.generateCellHTML(puzzle.focusTarget.id, {});
                node.parentElement.innerHTML = this.generateCellHTML(node.id, { "type": "item", "name": gives });
                puzzle.focusTarget = null;
                puzzle.focus(document.getElementById(id));
            }, 100);
        }
    }

    ask(node) {
        let type = node.getAttribute("type");
        let name = node.getAttribute("name");
        let desire = node.getAttribute("desire");
        if (type !== "npc") return;

        this.dialog.innerHTML = '<h2>Wants</h2>'
            + '<img src="media/sprites/item/' + desire + '.png">'
            + '<label>' + desire + '</label>';

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

            this.dialog.innerHTML = '<h2>You Won!</h2>'
            + '<img src="media/sprites/item/' + this.goal + '.png">'
            /*+ '<label>' + this.goal + '</label>'*/
            + '<br>'
            + '<button id="win-menu" class="big-button">↶</button>'
            + '<button id="win-next" class="big-button">⏭</button>';

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
