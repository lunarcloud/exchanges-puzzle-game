
class Puzzle {
    constructor(levelDefinition) {
        if (typeof(levelDefinition) !== "object") {
            throw "level definition missing!";
        }

        this.goalElement = document.getElementById("goal");
        this.focusElement = document.getElementById("focus");
        this.mapElement = document.getElementById("map");

        this.title = levelDefinition.title;
        this.goal = levelDefinition.goal;
        this.map = levelDefinition.map;

        this.goalElement.innerHTML = '<img src="media/sprites/item/' + this.goal.icon + '.png">'
        + '<label>' + this.goal.text + '</label>';
        this.focusElement.innerHTML = ''; // clear
        this.mapElement.innerHTML = ''; // clear

        var mapHTML = '';
        for (var i = 0; i < this.map.length; i++) {
            mapHTML += '<tr>';
            for (var j = 0; j < this.map[i].length; j++) {
                let cell = this.map[i][j];
                mapHTML += '<td class="' + cell.type + '" type="' + cell.type + '" name="' + cell.name + '">';
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
        for (var i = 0; i < tableCells.length; i++) {
            new TapOrHoldHandler(
                tableCells[i],
                node => this.focus(node),
                node => this.ask(node),
                node => this.clearAsk(node)
            );
        }
        console.debug("Created Puzzle Controller");
    }

    focus(node) {
        let type = node.getAttribute("type");
        let name = node.getAttribute("name");
        console.debug("Focus: " + type + " | " + name);
        node.classList.add("focusing");
        setTimeout(() => {
            requestAnimationFrame(() => {
                node.classList.remove("focusing");
            });
        }, 300);
    }

    ask(node) {
        let type = node.getAttribute("type");
        let name = node.getAttribute("name");
        console.debug("Ask: " + type + " | " + name);
        requestAnimationFrame(() => {
            node.classList.add("asking");
        });
    }

    clearAsk(node) {
        let type = node.getAttribute("type");
        let name = node.getAttribute("name");
        console.debug("Clear Ask: " + type + " | " + name);
        requestAnimationFrame(() => {
            node.classList.remove("asking");
        });
    }
}
