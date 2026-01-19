window.GeminiNav = window.GeminiNav || {};

window.GeminiNav.ChatGPTAdapter = class ChatGPTAdapter extends window.GeminiNav.PlatformAdapter {
    constructor() {
        super();
        this.name = 'ChatGPT Nav';
    }

    matches() {
        return window.location.hostname.includes('chatgpt.com') ||
            window.location.hostname.includes('chat.openai.com');
    }

    getQuestions() {
        // Multiple fallback selectors for ChatGPT
        const selectors = [
            '[data-message-author-role="user"]',
            '.text-base[data-message-author-role="user"]',
            '[class*="user-message"]',
            '.prose.dark\\:prose-invert[data-message-author-role="user"]'
        ];

        for (const selector of selectors) {
            const questions = document.querySelectorAll(selector);
            if (questions.length > 0) return questions;
        }
        return document.querySelectorAll('[data-message-author-role="user"]');
    }

    getQuestionText(element) {
        return element.innerText.trim();
    }
};
