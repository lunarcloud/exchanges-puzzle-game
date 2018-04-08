
class Puzzle {
    constructor(levelDefinition) {
        if (typeof(levelDefinition) !== "object") {
            throw "level definition missing!";
        }

        this.goalElement = document.getElementById("goal");
        this.focusDisplay = document.getElementById("focus");
        this.mapElement = document.getElementById("map");

        this.dialog = document.querySelector('dialog');
        dialogPolyfill.registerDialog(this.dialog);

        this.focusTarget = null;

        this.title = levelDefinition.title;
        this.goal = levelDefinition.goal;
        this.map = levelDefinition.map;

        this.goalElement.innerHTML = '<img src="media/sprites/item/' + this.goal.icon + '.png">'
        + '<label>' + this.goal.text + '</label>';
        this.focusDisplay.innerHTML = ''; // clear
        this.mapElement.innerHTML = ''; // clear

        var mapHTML = '';
        for (var i = 0; i < this.map.length; i++) {
            mapHTML += '<tr>';
            for (var j = 0; j < this.map[i].length; j++) {
                let cell = this.map[i][j];
                mapHTML += '<td class="' + cell.type + '" type="' + cell.type + '" name="' + cell.name + '" icon="' + cell.icon + '">';
                if (cell.empty === false) {
                    mapHTML += '<a class="' + cell.type + '">'
                        + '<img src="media/sprites/' + cell.type + '/' + cell.icon + '.png">'
                        + '<label>' + cell.name + '</label>'
                        + '</a>';
                }
                mapHTML += '</td>';
            }
            mapHTML += '</tr>';
        }
        this.mapElement.innerHTML = mapHTML;

        var tableCells = document.querySelectorAll("#map td");
        this.tapOrHoldHandler = new TapOrHoldHandler(true);
        this.dragAndDropHandler = new DragAndDropHandler();
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
                node => {
                    this.focus(node);
                    this.combine(node);
                }
            );
        }
        console.debug("Created Puzzle Controller");
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
        let icon = node.getAttribute("icon");

        if (node == this.focusTarget) return;
        console.debug("Focus: " + type + " | " + name);

        let previousTarget = this.focusTarget;
        this.focusTarget = node;

        node.classList.add("focusing");
        setTimeout(() => requestAnimationFrame(() => node.classList.remove("focusing")), 300);

        this.focusDisplay.innerHTML = '<img src="media/sprites/item/' + icon + '.png">'
            + '<label>' + name + '</label>';
    }

    combine(node) {
        if (this.focusTarget === null) return;

        this.focusTarget = null;
        this.focusDisplay.innerHTML = ""; // clear
        // TODO Combination logic
    }

    ask(node) {
        let type = node.getAttribute("type");
        let name = node.getAttribute("name");
        let icon = node.getAttribute("icon");
        if (type !== "npc") return;

        console.debug("Ask: " + type + " | " + name);

        // TODO fill in modal content

        this.dialog.showModal();
        requestAnimationFrame(() => node.classList.add("asking"));
    }

    clearAsk(node) {
        let type = node.getAttribute("type");
        let name = node.getAttribute("name");
        let icon = node.getAttribute("icon");
        console.debug("Clear Ask: " + type + " | " + name);
        this.dialog.close();
        requestAnimationFrame(() => {
            node.classList.remove("asking");
        });
    }
}
