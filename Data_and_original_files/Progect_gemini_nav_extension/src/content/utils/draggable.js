// Draggable utility with boundary constraints and top-edge recovery
window.GeminiNav = window.GeminiNav || {};

window.GeminiNav.Draggable = class Draggable {
    constructor(element, handle, onDragEnd) {
        this.element = element;
        this.handle = handle || element;
        this.onDragEnd = onDragEnd;
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
        this.startLeft = 0;
        this.startTop = 0;
        this.edgeRecoveryTimeout = null;

        this.handle.addEventListener('mousedown', this.onMouseDown.bind(this));
        document.addEventListener('mousemove', this.onMouseMove.bind(this));
        document.addEventListener('mouseup', this.onMouseUp.bind(this));

        // Check top edge on initial load
        this.scheduleTopEdgeRecovery();
    }

    onMouseDown(e) {
        if (e.target.closest('.gemini-nav-btn, input, .gemini-nav-controls')) {
            return;
        }

        // Clear recovery timeout when user starts dragging
        if (this.edgeRecoveryTimeout) {
            clearTimeout(this.edgeRecoveryTimeout);
            this.edgeRecoveryTimeout = null;
        }

        this.isDragging = true;
        this.startX = e.clientX;
        this.startY = e.clientY;

        const rect = this.element.getBoundingClientRect();
        this.startLeft = rect.left;
        this.startTop = rect.top;

        this.element.style.transition = 'none';
        e.preventDefault();
    }

    onMouseMove(e) {
        if (!this.isDragging) return;

        const deltaX = e.clientX - this.startX;
        const deltaY = e.clientY - this.startY;

        let newLeft = this.startLeft + deltaX;
        let newTop = this.startTop + deltaY;

        // Boundary constraints: 25% of panel must remain visible
        const rect = this.element.getBoundingClientRect();
        const panelWidth = rect.width;
        const panelHeight = rect.height;
        const minVisible = 0.25;

        const minLeft = -(panelWidth * (1 - minVisible));
        const maxLeft = window.innerWidth - (panelWidth * minVisible);
        const minTop = -(panelHeight * (1 - minVisible));
        const maxTop = window.innerHeight - (panelHeight * minVisible);

        newLeft = Math.max(minLeft, Math.min(maxLeft, newLeft));
        newTop = Math.max(minTop, Math.min(maxTop, newTop));

        this.element.style.left = newLeft + 'px';
        this.element.style.top = newTop + 'px';
        this.element.style.right = 'auto';
        this.element.style.transform = 'none';
    }

    onMouseUp() {
        if (!this.isDragging) return;

        this.isDragging = false;
        this.element.style.transition = '';

        if (this.onDragEnd) {
            this.onDragEnd({
                left: this.element.style.left,
                top: this.element.style.top
            });
        }

        // Check top edge recovery after drag ends
        this.scheduleTopEdgeRecovery();
    }

    // Schedule top edge recovery check (3 seconds)
    scheduleTopEdgeRecovery() {
        if (this.edgeRecoveryTimeout) {
            clearTimeout(this.edgeRecoveryTimeout);
        }

        this.edgeRecoveryTimeout = setTimeout(() => {
            this.checkTopEdgeRecovery();
        }, 3000);
    }

    // Only check if panel's top is too close to browser UI
    checkTopEdgeRecovery() {
        const rect = this.element.getBoundingClientRect();
        const safeTopMargin = 50; // Header needs to be visible

        // Only recover if top edge is covered by browser UI
        if (rect.top < safeTopMargin) {
            // Animate to safe position
            this.element.style.transition = 'top 0.3s ease';
            this.element.style.top = (safeTopMargin + 10) + 'px';
            this.element.style.transform = 'none';
            this.element.style.right = 'auto';

            // Save new position after animation
            setTimeout(() => {
                this.element.style.transition = '';
                if (this.onDragEnd) {
                    this.onDragEnd({
                        left: this.element.style.left,
                        top: this.element.style.top
                    });
                }
            }, 300);
        }
    }
};
