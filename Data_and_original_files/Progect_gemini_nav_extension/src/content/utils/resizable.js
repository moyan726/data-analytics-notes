window.GeminiNav = window.GeminiNav || {};

window.GeminiNav.Resizable = class Resizable {
    constructor(element, options = {}) {
        this.element = element;
        this.onResizeEnd = options.onResizeEnd;
        this.minWidth = options.minWidth || 200;
        this.minHeight = options.minHeight || 100;

        this.init();
    }

    init() {
        this.createHandle('right');
        this.createHandle('bottom');
        this.createHandle('bottom-right');
    }

    createHandle(position) {
        const handle = document.createElement('div');
        handle.className = `gemini-nav-resize-handle ${position}`;
        this.element.appendChild(handle);

        handle.addEventListener('mousedown', (e) => this.onMouseDown(e, position));
    }

    onMouseDown(e, position) {
        e.stopPropagation();
        this.isResizing = true;
        this.currentHandle = position;
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.startWidth = this.element.offsetWidth;
        this.startHeight = this.element.offsetHeight;

        document.body.style.userSelect = 'none';
        document.addEventListener('mousemove', this.onMouseMoveBound = this.onMouseMove.bind(this));
        document.addEventListener('mouseup', this.onMouseUpBound = this.onMouseUp.bind(this));
    }

    onMouseMove(e) {
        if (!this.isResizing) return;

        const dx = e.clientX - this.startX;
        const dy = e.clientY - this.startY;

        if (this.currentHandle.includes('right')) {
            const newWidth = Math.max(this.minWidth, this.startWidth + dx);
            this.element.style.width = `${newWidth}px`;
        }

        if (this.currentHandle.includes('bottom')) {
            const newHeight = Math.max(this.minHeight, this.startHeight + dy);
            this.element.style.height = `${newHeight}px`;
            // Remove max-height from scroll container if set, to allow panel to grow
            const scrollContainer = this.element.querySelector('#gemini-nav-scroll');
            if (scrollContainer) {
                scrollContainer.style.maxHeight = 'none';
            }
        }
    }

    onMouseUp() {
        if (!this.isResizing) return;
        this.isResizing = false;
        document.body.style.userSelect = '';
        document.removeEventListener('mousemove', this.onMouseMoveBound);
        document.removeEventListener('mouseup', this.onMouseUpBound);

        if (this.onResizeEnd) {
            this.onResizeEnd({
                width: this.element.style.width,
                height: this.element.style.height
            });
        }
    }
};
