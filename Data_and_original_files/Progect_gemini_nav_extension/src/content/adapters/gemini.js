window.GeminiNav = window.GeminiNav || {};

window.GeminiNav.GeminiAdapter = class GeminiAdapter extends window.GeminiNav.PlatformAdapter {
    constructor() {
        super();
        this.name = 'Gemini Nav';
    }

    matches() {
        return window.location.hostname === 'gemini.google.com';
    }

    getQuestions() {
        // Primary selector
        let questions = document.querySelectorAll('.user-query-bubble-with-background');
        // Fallback selectors if primary fails
        if (questions.length === 0) {
            questions = document.querySelectorAll('[data-message-author-role="user"]');
        }
        if (questions.length === 0) {
            questions = document.querySelectorAll('.query-content');
        }
        return questions;
    }

    getQuestionText(element) {
        return element.innerText.trim();
    }
};
