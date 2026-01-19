// i18n utility for manual language switching
window.GeminiNav = window.GeminiNav || {};

window.GeminiNav.i18n = {
    currentLang: 'zh_CN',

    messages: {
        zh_CN: {
            searchPlaceholder: '搜索对话...',
            noConversation: '暂无对话',
            restoreHidden: '↩ 恢复隐藏项',
            minimize: '最小化',
            adjustFontSize: '调整字体大小',
            hide: '隐藏',
            settings: '设置'
        },
        en: {
            searchPlaceholder: 'Search...',
            noConversation: 'No conversations',
            restoreHidden: '↩ Restore Hidden',
            minimize: 'Minimize',
            adjustFontSize: 'Adjust font size',
            hide: 'Hide',
            settings: 'Settings'
        }
    },

    init(callback) {
        chrome.storage.local.get(['language'], (result) => {
            if (result.language) {
                this.currentLang = result.language;
            }
            if (callback) callback();
        });
    },

    setLanguage(lang) {
        this.currentLang = lang;
        chrome.storage.local.set({ language: lang });
    },

    get(key) {
        const langMessages = this.messages[this.currentLang] || this.messages['zh_CN'];
        return langMessages[key] || key;
    }
};
