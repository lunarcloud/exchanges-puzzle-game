import {Utils} from './utils.js';
import {Puzzle} from './puzzle.js';

export class Menu {
    constructor() {

        var menu = this;

        this.currentIndex = 1;

        this.menuPane = document.querySelector("body > menu");
        this.levelListElement = document.getElementById("level-list");
        this.gamePane = document.querySelector("body > game");
        this.fullscreenButton = document.getElementById("fullscreen-button");
        this.fullscreenButton2 = document.getElementById("fullscreen-button2");
        this.backToMenuButton = document.getElementById("back-to-menu-button");
        this.retryButton = document.getElementById("retry-button");

        this.dialog = document.querySelector('dialog');
        dialogPolyfill.registerDialog(this.dialog);

        /* eslint-disable no-unused-vars */
        this.backToMenuButton.addEventListener("click", e => this.show());
        this.retryButton.addEventListener("click", e => this.loadLevel(this.currentIndex));
        this.fullscreenButton.addEventListener("click", e => Utils.fullscreenToggle());
        this.fullscreenButton2.addEventListener("click", e => Utils.fullscreenToggle());
        /* eslint-enable no-unused-vars */

        this.puzzle = new Puzzle(
            menu.dialog,
            /*winHandler*/ index => {
                menu.progression.unlocked = index+1;
                localStorage.setObject('progression', menu.progression);
                try {
                    menu.levelListElement.children[index].removeAttribute("disabled");
                    return true;
                } catch (err) {
                    /* No More levels! */
                    return false;
                }
            },
            /*returnHandler*/ () => menu.show(),
            /*nextHandler*/ index => menu.loadLevel(index+1)
        );

        this.loadLevels().then(() => {
            console.log("Found " + menu.levels.length + " levels.");

            menu.progression = localStorage.getObject('progression');
            if (menu.progression == null) {
                menu.progression = {'unlocked': 1, levels: []};
                localStorage.setObject('progression', menu.progression);
            }

            this.levelListElement.innerHTML = "";
            for (let i = 0; i < menu.levels.length; i++) {
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
                if (error.message == 403 || error.message == 404 || error.message == "Failed to fetch") {
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

    addLevelToList(index, name, enabled) {
        var menu = this;
        var item = document.createElement('li');
        //item.id = "level-" + index;
        item.textContent = name != '' ? name : "Level " + index;
        if (!enabled) item.setAttribute("disabled", true);
        item.addEventListener('click', e => { if (!e.target.hasAttribute("disabled")) menu.loadLevel(index); });
        this.levelListElement.appendChild(item);
    }

    hide() {
        try {
            this.dialog.close();
        } catch (error) { /* ignore */ }
        this.menuPane.style.opacity = 0;
        this.menuPane.style.zIndex = 0;
        this.gamePane.style.opacity = 1;
        this.gamePane.style.zIndex = 1;
    }

    show() {
        try {
            this.dialog.close();
        } catch (error) { /* ignore */ }
        this.menuPane.style.opacity = 1;
        this.menuPane.style.zIndex = 1;
        this.gamePane.style.opacity = 0;
        this.gamePane.style.zIndex = 0;
    }

    loadLevel(index) {
        this.currentIndex = index;
        var menu = this;
        return new Promise((resolve, reject) => {
            try {
                menu.puzzle.load(index, menu.levels[menu.currentIndex - 1]);
                menu.hide();
                resolve();
            } catch(error) {
                alert("Level " + index + " is not correctly defined!");
				console.error(error);
                reject();
            }
        });
    }
}
