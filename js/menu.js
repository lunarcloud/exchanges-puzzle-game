
class Menu {
    constructor() {
        this.menuPane = document.querySelector("body > menu");
        this.gamePane = document.querySelector("body > game");
        this.continueButton = document.getElementById("continue-button");
        this.startButton = document.getElementById("start-button");
        this.fullscreenButton = document.getElementById("fullscreen-button");
        this.fullscreenButton2 = document.getElementById("fullscreen-button2");
        this.quitButton = document.getElementById("quit-button");
        this.backToMenuButton = document.getElementById("back-to-menu-button");

        this.puzzle = new Puzzle();
        this.currentLevel = null;
        this.utils = new Utils();

        this.startButton.addEventListener("click", e => this.loadLevel(1));
        this.backToMenuButton.addEventListener("click", e => {
            this.currentLevel = null;
            this.show();
        });
        this.fullscreenButton.addEventListener("click", e => this.utils.fullscreenToggle());
        this.fullscreenButton2.addEventListener("click", e => this.utils.fullscreenToggle());
        if (this.utils.quittable) {
            this.quitButton.classList.remove("hidden");
            this.quitButton.addEventListener("click", e => this.utils.quit());
        }

        var level = parseInt(localStorage.getItem('level'));
        if (isNaN(level)) {
            localStorage.getItem('level', 1);
        } else if (level > 1) {
            this.startButton.classList.add("returning");
            this.continueButton.classList.remove("hidden");
        }

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
                this.puzzle.load(levelDefinition);
                this.hide();
            })
            .catch(error => {
                alert("Couldn't load puzzle " + index + "!");
            });
    }
};
