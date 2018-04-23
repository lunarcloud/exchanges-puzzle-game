
export class DragAndDropHandler {
    constructor() {
        this.clearHandlers();
    }
    
    addDragHandler(data, node, onStartDrag, img) {

        if (typeof(onStartDrag) !== "function") throw "You didn't define a drag start function!";
        this.onStartDrag[node.id] = onStartDrag;

        node.setAttribute('draggable', 'true');

        node.addEventListener('dragstart', e => {
            e.dataTransfer.effectAllowed = 'copy'; // only dropEffect='copy' will be dropable
            e.dataTransfer.setData('Text', data); // required otherwise doesn't work
            this.onStartDrag[node.id](node);
            if (img) e.dataTransfer.setDragImage( img, img.width * 0.9, img.height * 0.9);
        });
    }

    addDropHandler(node, onDrop, checkParentIfFail) {

        if (typeof(onDrop) !== "function") throw "You didn't define a drop function!";
        this.onDrop[node.id] = onDrop;

        node.addEventListener('dragover', e => {
            e.preventDefault();
            node.classList.add('over');
            e.dataTransfer.dropEffect = 'copy';
            return false;
        });
        node.addEventListener('dragleave', () => node.classList.remove('over'));

        node.addEventListener('drop', e => {
            if (e.stopPropagation) e.stopPropagation();
            e.preventDefault();

            var node = document.getElementById(e.originalTarget.id);
            if (node == null) {
                node = document.getElementById(e.originalTarget.alt);
            }

            if (typeof(this.onDrop[node.id]) === "function") {
                this.onDrop[node.id](e.target, node);
            } else if (checkParentIfFail !== false && typeof(this.onDrop[node.parentElement.id]) === "function") {
                this.onDrop[node.parentElement.id](e.target, node.parentElement);
            }

            return false;
        });
    }

    clearHandlers() {
        this.onStartDrag = {};
        this.onDrop = {};
    }
}
