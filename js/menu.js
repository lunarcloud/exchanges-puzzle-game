
class Menu {
    constructor() {
        this.menuPane = document.querySelector("body > menu");
        this.gamePane = document.querySelector("body > game");
        this.startButton = document.getElementById("start-button");

        this.currentLevel = null;

        this.startButton.addEventListener("click", e => this.loadLevel(1));

        console.debug("Created Menu Controller.");
    }

    hide() {
        this.menuPane.style.opacity = 0;
        this.menuPane.style.zIndex = 0;
        this.gamePane.style.opacity = 1;
        this.gamePane.style.zIndex = 1;
    }

    show() {
        this.menuPane.style.opacity = 1;
        this.menuPane.style.zIndex = 1;
        this.gamePane.style.opacity = 0;
        this.gamePane.style.zIndex = 0;
    }

    loadLevel(index) {
        fetch("./json/level/" + index + ".json")
            .then(response => {
                if (response.status === 200) {
                    return response.json();
                } else {
                    alert("Couldn't load puzzle " + index + "!");
                }
            })
            .then(levelDefinition => {
                this.currentLevel = new Puzzle(levelDefinition);
                this.hide();
            })
            .catch(error => {
                alert("Couldn't load puzzle " + index + "!");
            });
    }
};
