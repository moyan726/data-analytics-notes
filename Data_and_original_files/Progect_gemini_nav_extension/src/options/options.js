// Localization strings
const i18n = {
    zh_CN: {
        pageTitle: '🧭 AI Navigator 设置',
        sectionAppearance: '🎨 外观',
        sectionBehavior: '⚡ 行为',
        labelLanguage: '语言 / Language',
        labelTheme: '主题',
        labelNumbering: '编号样式',
        labelVisibleItems: '显示条数',
        labelAutoCollapse: '悬浮模式',
        toggleDesc: '鼠标离开 5 秒后收起为小图标',
        themeAuto: '自动 (跟随系统)',
        themeLight: '浅色',
        themeDark: '深色',
        sectionShortcuts: '⌨️ 快捷键',
        shortcutToggle: '显示/隐藏面板',
        shortcutNavigate: '上/下导航',
        shortcutMinimize: '最小化面板',
        sectionAbout: 'ℹ️ 关于',
        aboutText: 'AI Navigator 是一款通用的 AI 对话导航助手，支持 Gemini、ChatGPT 和 Claude。',
        btnSave: '保存设置',
        btnReset: '重置',
        previewTitle: '实时预览',
        searchPlaceholder: '搜索对话...',
        previewText1: '这是第一个问题...',
        previewText2: '这是第二个问题...',
        previewText3: '这是第三个问题...',
        saved: '✓ 设置已保存',
        reset: '✓ 已重置为默认设置'
    },
    en: {
        pageTitle: '🧭 AI Navigator Settings',
        sectionAppearance: '🎨 Appearance',
        sectionBehavior: '⚡ Behavior',
        labelLanguage: 'Language / 语言',
        labelTheme: 'Theme',
        labelNumbering: 'Numbering Style',
        labelVisibleItems: 'Visible Items',
        labelAutoCollapse: 'Floating Mode',
        toggleDesc: 'Collapse to icon 5s after mouse leaves',
        themeAuto: 'Auto (System)',
        themeLight: 'Light',
        themeDark: 'Dark',
        sectionShortcuts: '⌨️ Shortcuts',
        shortcutToggle: 'Toggle Panel',
        shortcutNavigate: 'Navigate Up/Down',
        shortcutMinimize: 'Minimize Panel',
        sectionAbout: 'ℹ️ About',
        aboutText: 'AI Navigator is a universal AI conversation navigator supporting Gemini, ChatGPT, and Claude.',
        btnSave: 'Save Settings',
        btnReset: 'Reset',
        previewTitle: 'Live Preview',
        searchPlaceholder: 'Search...',
        previewText1: 'This is question 1...',
        previewText2: 'This is question 2...',
        previewText3: 'This is question 3...',
        saved: '✓ Settings saved',
        reset: '✓ Reset to defaults'
    }
};

function applyLanguage(lang) {
    const t = i18n[lang] || i18n['zh_CN'];
    const setIfExists = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };
    const setPlaceholder = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.placeholder = value;
    };

    setIfExists('page-title', t.pageTitle);
    setIfExists('section-appearance', t.sectionAppearance);
    setIfExists('section-behavior', t.sectionBehavior);
    setIfExists('label-language', t.labelLanguage);
    setIfExists('label-theme', t.labelTheme);
    setIfExists('label-numbering', t.labelNumbering);
    setIfExists('label-visible-items', t.labelVisibleItems);
    setIfExists('label-auto-collapse', t.labelAutoCollapse);
    setIfExists('toggle-desc', t.toggleDesc);
    setIfExists('theme-auto', t.themeAuto);
    setIfExists('theme-light', t.themeLight);
    setIfExists('theme-dark', t.themeDark);
    setIfExists('section-shortcuts', t.sectionShortcuts);
    setIfExists('shortcut-toggle', t.shortcutToggle);
    setIfExists('shortcut-navigate', t.shortcutNavigate);
    setIfExists('shortcut-minimize', t.shortcutMinimize);
    setIfExists('section-about', t.sectionAbout);
    setIfExists('about-text', t.aboutText);
    setIfExists('btn-save-text', t.btnSave);
    setIfExists('btn-reset-text', t.btnReset);
    setIfExists('preview-title', t.previewTitle);
    setPlaceholder('preview-search-input', t.searchPlaceholder);
    setIfExists('preview-text-1', t.previewText1);
    setIfExists('preview-text-2', t.previewText2);
    setIfExists('preview-text-3', t.previewText3);
}

document.addEventListener('DOMContentLoaded', () => {
    const languageSelect = document.getElementById('language');
    const themeSelect = document.getElementById('theme');
    const numberingSelect = document.getElementById('numbering');
    const visibleItemsSelect = document.getElementById('visibleItems');
    const autoCollapseCheckbox = document.getElementById('autoCollapse');
    const saveBtn = document.getElementById('save');
    const resetBtn = document.getElementById('reset');
    const status = document.getElementById('status');
    const previewPanel = document.getElementById('preview-panel');

    const previewNums = [
        document.getElementById('preview-num-1'),
        document.getElementById('preview-num-2'),
        document.getElementById('preview-num-3')
    ];

    // Restore options
    chrome.storage.local.get(['language', 'theme', 'numbering', 'visibleItems', 'autoCollapse'], (items) => {
        if (items.language) {
            languageSelect.value = items.language;
            applyLanguage(items.language);
        }
        if (items.theme) {
            themeSelect.value = items.theme;
            updatePreviewTheme(items.theme);
        }
        if (items.numbering) {
            numberingSelect.value = items.numbering;
            updatePreviewNumbering(items.numbering);
        }
        if (items.visibleItems) {
            visibleItemsSelect.value = items.visibleItems;
        }
        if (items.autoCollapse !== undefined) {
            autoCollapseCheckbox.checked = items.autoCollapse;
        }
    });

    languageSelect.addEventListener('change', () => applyLanguage(languageSelect.value));
    themeSelect.addEventListener('change', () => updatePreviewTheme(themeSelect.value));
    numberingSelect.addEventListener('change', () => updatePreviewNumbering(numberingSelect.value));

    function updatePreviewTheme(theme) {
        previewPanel.classList.remove('dark');
        if (theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            previewPanel.classList.add('dark');
        }
    }

    function updatePreviewNumbering(style) {
        const formats = { 'dot': ['1.', '2.', '3.'], 'paren': ['(1)', '(2)', '(3)'], 'hash': ['#1', '#2', '#3'] };
        const nums = formats[style] || formats['dot'];
        previewNums.forEach((el, i) => { if (el) el.textContent = nums[i]; });
    }

    saveBtn.addEventListener('click', () => {
        chrome.storage.local.set({
            language: languageSelect.value,
            theme: themeSelect.value,
            numbering: numberingSelect.value,
            visibleItems: parseInt(visibleItemsSelect.value),
            autoCollapse: autoCollapseCheckbox.checked
        }, () => {
            const t = i18n[languageSelect.value] || i18n['zh_CN'];
            status.textContent = t.saved;
            status.style.opacity = 1;
            setTimeout(() => { status.style.opacity = 0; }, 2000);
        });
    });

    resetBtn.addEventListener('click', () => {
        languageSelect.value = 'zh_CN';
        themeSelect.value = 'auto';
        numberingSelect.value = 'dot';
        visibleItemsSelect.value = '6';
        autoCollapseCheckbox.checked = false;
        applyLanguage('zh_CN');
        updatePreviewTheme('auto');
        updatePreviewNumbering('dot');

        chrome.storage.local.set({
            language: 'zh_CN', theme: 'auto', numbering: 'dot', visibleItems: 6, autoCollapse: false, firstUse: true
        }, () => {
            status.textContent = i18n['zh_CN'].reset;
            status.style.opacity = 1;
            setTimeout(() => { status.style.opacity = 0; }, 2000);
        });
    });

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (themeSelect.value === 'auto') updatePreviewTheme('auto');
    });
});
