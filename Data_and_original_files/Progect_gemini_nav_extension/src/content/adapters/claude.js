window.GeminiNav = window.GeminiNav || {};

window.GeminiNav.ClaudeAdapter = class ClaudeAdapter extends window.GeminiNav.PlatformAdapter {
    constructor() {
        super();
        this.name = 'Claude Nav';
    }

    matches() {
        return window.location.hostname.includes('claude.ai');
    }

    getQuestions() {
        // Multiple fallback selectors for Claude
        const selectors = [
            '[data-testid="user-message"]',
            '.font-user-message',
            '.human-message',
            '[class*="human"]',
            '.prose[data-is-streaming="false"]'
        ];

        for (const selector of selectors) {
            const questions = document.querySelectorAll(selector);
            if (questions.length > 0) return questions;
        }
        return document.querySelectorAll('.font-user-message, .human-message');
    }

    getQuestionText(element) {
        return element.innerText.trim();
    }
};
