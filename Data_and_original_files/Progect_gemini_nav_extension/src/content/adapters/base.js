window.GeminiNav = window.GeminiNav || {};

window.GeminiNav.PlatformAdapter = class PlatformAdapter {
    constructor() {
        this.name = 'Base Adapter';
    }

    /**
     * Check if the current URL matches this platform
     * @returns {boolean}
     */
    matches() {
        return false;
    }

    /**
     * Get all user question elements
     * @returns {NodeList|Array}
     */
    getQuestions() {
        return [];
    }

    /**
     * Get the text content from a question element
     * @param {HTMLElement} element
     * @returns {string}
     */
    getQuestionText(element) {
        return '';
    }
};
