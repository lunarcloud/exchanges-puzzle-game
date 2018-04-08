
class DragAndDropHandler {
    constructor() {
        this.clear();
    }
    
    add(node, draggable, onDrop) {
        if (typeof(onDrop) !== "function") throw "You didn't define a drop function!";
        this.onDrop[node] = onDrop;

        node.setAttribute('draggable', 'true');
        node.addEventListener('dragstart', e => {
          e.dataTransfer.effectAllowed = 'copy'; // only dropEffect='copy' will be dropable
          e.dataTransfer.setData('Text', node.id); // required otherwise doesn't work
        });

        node.addEventListener('dragover', e => {
            if (e.preventDefault) e.preventDefault(); // allows us to drop
            this.className = 'over';
            e.dataTransfer.dropEffect = 'copy';
            return false;
        });
        node.addEventListener('dragenter', e => { this.className = 'over'; return false; }); // IE only?
        node.addEventListener('dragleave', function () { this.className = ''; });

        node.addEventListener('drop', e => {
            if (e.stopPropagation) e.stopPropagation();
            var node = document.getElementById(e.dataTransfer.getData('Text'));
            this.onDrop[node](node);
            return false;
        });

    }
    
    clear() {
        this.onDrop = {};
    }
}