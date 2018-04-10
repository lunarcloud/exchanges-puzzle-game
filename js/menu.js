
class Menu {
    constructor() {
        this.menuPane = document.querySelector("body > menu");
        this.levelListElement = document.getElementById("level-list");
        this.gamePane = document.querySelector("body > game");
        this.fullscreenButton = document.getElementById("fullscreen-button");
        this.fullscreenButton2 = document.getElementById("fullscreen-button2");
        this.backToMenuButton = document.getElementById("back-to-menu-button");

        this.puzzle = new Puzzle();
        this.currentLevel = null;

        this.backToMenuButton.addEventListener("click", e => {
            this.currentLevel = null;
            this.show();
        });
        this.fullscreenButton.addEventListener("click", e => Utils.fullscreenToggle());
        this.fullscreenButton2.addEventListener("click", e => Utils.fullscreenToggle());

        var menu = this;
        this.loadLevels().then(() => {
            console.log("Found " + menu.levels.length + " levels.");

            menu.progression = localStorage.getObject('progression');
            if (menu.progression == null) {
                menu.progression = {'unlocked': 1, levels: []};
                localStorage.setObject('progression', menu.progression);
            }

            this.levelListElement.innerHTML = "";
            for (var i = 0; i < menu.levels.length; i++) {
                menu.addLevelToList(i+1, menu.levels[i].title, (i + 1) <= menu.progression.unlocked, menu.progression.levels[i]);
            }

            console.debug("Created Menu Controller.");
        });
    }

    loadLevels() {
        this.levels = [];

        var checkNextLevel = (index, listResolve, listReject) => {
            fetch("./json/level/" + index + ".json")
            .then(function(r) {
                if (!r.ok)  throw Error(r.status);
                else return r;
            })
            .then(r => {
                return r.json().then(level => {
                    this.levels.push(level);
                    return checkNextLevel(index+1, listResolve, listReject);
                });
            })
            .catch(error => {
                if (error.message == 404 || error.message == "Failed to fetch") {
                    listResolve();
                } else {
                    alert("Couldn't load puzzle " + index + "!");
                    listReject();
                }
            });
        };

        return new Promise((resolve, reject) => {
            checkNextLevel(1, resolve, reject);
        });
    }

    addLevelToList(index, name, enabled, progress) {
        var menu = this;
        var item = document.createElement('li');
        //item.id = "level-" + index;
        item.textContent = name != '' ? name : "Level " + index;
        if (enabled) item.addEventListener('click', e => menu.loadLevel(index));
        else item.setAttribute("disabled", true);
        this.levelListElement.appendChild(item);
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
        return new Promise((resolve, reject) => {
            try {
                this.puzzle.load(this.levels[index-1]);
                this.hide();
                resolve();
            } catch(error) {
                alert("Level " + index + " is not correctly defined!");
                reject();
            }
        });
    }
};
