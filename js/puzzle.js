
class Puzzle {
    constructor(levelDefinition) {
        console.debug("Created Puzzle Controller");
    }

    load(levelDefinition) {

        if (typeof(levelDefinition) !== "object") throw "level definition missing!";
        this.originalDefinition = levelDefinition;

        this.goalElement = document.getElementById("goal");
        this.focusDisplay = document.getElementById("focus");
        this.mapElement = document.getElementById("map");

        this.dialog = document.querySelector('dialog');
        dialogPolyfill.registerDialog(this.dialog);

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
                let cell = this.map[i][j];
                if (cell.empty) {
                    mapHTML += '<td>';
                } else {
                    mapHTML += '<td class="' + cell.type + '" type="' + cell.type + '" name="' + cell.name + '" desire="' + (cell.desire ? cell.desire : '')  + '" gives="' + (cell.gives ? cell.gives : '')  + '">'
                    + '<a class="' + cell.type + '">'
                        + '<img src="media/sprites/' + cell.type + '/' + cell.name + '.png">'
                        + '<label>' + cell.name + '</label>'
                        + '</a>';
                }
                mapHTML += '</td>';
            }
            mapHTML += '</tr>';
        }
        this.mapElement.innerHTML = mapHTML;

        this.tapOrHoldHandler = new TapOrHoldHandler(true);
        this.dragAndDropHandler = new DragAndDropHandler();

        var tableCells = document.querySelectorAll("#map td");
        for (var i = 0; i < tableCells.length; i++) {
            tableCells[i].id = "table-cell-" + i;
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
    }

    combine(node) {
        if (this.focusTarget === null || node == this.focusTarget) return;
        // TODO Combination logic

        let focusName = this.focusTarget.getAttribute("name");

        let name = node.getAttribute("name");
        let type = node.getAttribute("type");
        let desire = node.getAttribute("desire");
        let gives = node.getAttribute("gives");

        if (desire == focusName) {
            console.debug("Combine " + name + " with " + focusName + ". Dropping " + gives + ".");
        }

        this.focusTarget = null;
        this.focusDisplay.innerHTML = ""; // clear
    }

    ask(node) {
        let type = node.getAttribute("type");
        let name = node.getAttribute("name");
        let desire = node.getAttribute("desire");
        if (type !== "npc") return;

        console.debug("Ask: " + type + " | " + name);

        // TODO fill in modal content
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
}
