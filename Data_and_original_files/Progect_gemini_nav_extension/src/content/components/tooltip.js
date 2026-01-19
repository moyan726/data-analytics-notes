window.GeminiNav = window.GeminiNav || {};

window.GeminiNav.Tooltip = class Tooltip {
    constructor() {
        this.element = document.createElement('div');
        this.element.className = 'gemini-nav-tooltip';
        document.body.appendChild(this.element);
        this.timer = null;
    }

    show(text, targetElement) {
        this.hide();
        this.timer = setTimeout(() => {
            this.element.textContent = text;
            this.element.classList.add('visible');

            const rect = targetElement.getBoundingClientRect();
            const tooltipRect = this.element.getBoundingClientRect();

            let top = rect.top + (rect.height - tooltipRect.height) / 2;
            let left = rect.left - tooltipRect.width - 10;

            if (top < 10) top = 10;
            if (left < 10) {
                left = rect.right + 10;
            }

            this.element.style.top = `${top}px`;
            this.element.style.left = `${left}px`;
        }, 300);
    }

    hide() {
        if (this.timer) clearTimeout(this.timer);
        this.element.classList.remove('visible');
    }
};
