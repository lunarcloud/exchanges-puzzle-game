
export class DragAndDropHandler {
    constructor() {
        this.clear();
    }
    
    add(node, draggable, onStartDrag, onDrop) {

        if (draggable) {
            if (typeof(onStartDrag) !== "function") throw "You didn't define a drag start function!";
            this.onStartDrag[node] = onStartDrag;
            node.setAttribute('draggable', 'true');
            node.addEventListener('dragstart', e => {
                e.dataTransfer.effectAllowed = 'copy'; // only dropEffect='copy' will be dropable
                e.dataTransfer.setData('Text', node.id); // required otherwise doesn't work
                this.onStartDrag[node](node);
                e.dataTransfer.setDragImage(
                    node.querySelector("img"),
                    node.querySelector("img").width * 0.9,
                    node.querySelector("img").height * 0.9
                );
            });
        }

        if (typeof(onDrop) !== "function") throw "You didn't define a drop function!";
        this.onDrop[node] = onDrop;

        node.addEventListener('dragover', e => {
            e.preventDefault();
            node.classList.add('over');
            e.dataTransfer.dropEffect = 'copy';
            return false;
        });
        node.addEventListener('dragenter', e => { node.classList.add('over'); return false; }); // IE only?
        node.addEventListener('dragleave', function () { node.classList.remove('over'); });

        node.addEventListener('drop', e => {
            if (e.stopPropagation) e.stopPropagation();
            e.preventDefault();
            var node = document.getElementById(e.dataTransfer.getData('Text'));
            this.onDrop[node](e.target, node);
            return false;
        });
    }
    
    clear() {
        this.onStartDrag = {};
        this.onDrop = {};
    }
}
