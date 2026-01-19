(function () {
    // Initialize i18n first
    if (window.GeminiNav.i18n) {
        window.GeminiNav.i18n.init();
    }

    const adapters = [
        new window.GeminiNav.GeminiAdapter(),
        new window.GeminiNav.ChatGPTAdapter(),
        new window.GeminiNav.ClaudeAdapter()
    ];

    const adapter = adapters.find(a => a.matches());

    if (!adapter) {
        console.log('AI Navigator: No matching adapter found for this page.');
        return;
    }

    const panel = new window.GeminiNav.Panel(adapter);
    panel.create();

    // Initial check
    const questions = adapter.getQuestions();
    if (questions.length > 0) {
        panel.rebuild();
        panel.setupScrollObserver();
    }

    let lastUrl = location.href;

    const observer = new MutationObserver(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            panel.hiddenIndices.clear();
            panel.currentActiveIndex = -1;
            panel.lastQuestionCount = 0;
            panel.filterQuery = '';
            const searchInput = panel.navPanel.querySelector('.gemini-nav-search-input');
            if (searchInput) searchInput.value = '';
        }

        const questions = adapter.getQuestions();
        const currentCount = questions.length;

        if (currentCount !== panel.lastQuestionCount) {
            panel.rebuild(currentCount > panel.lastQuestionCount);
            panel.setupScrollObserver();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.code === 'KeyG') {
            e.preventDefault();
            panel.toggle();
        }

        if (e.altKey) {
            if (e.code === 'ArrowUp') {
                e.preventDefault();
                panel.navigate(-1);
            } else if (e.code === 'ArrowDown') {
                e.preventDefault();
                panel.navigate(1);
            }
        }

        if (e.code === 'Escape') {
            if (panel.navPanel.style.display !== 'none') {
                panel.minimize();
            }
        }
    });

    // Listen for storage changes
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local') {
            if (changes.theme) {
                panel.applyTheme(changes.theme.newValue);
            }
            if (changes.numbering) {
                panel.numberingStyle = changes.numbering.newValue;
                panel.rebuild();
            }
            if (changes.language && window.GeminiNav.i18n) {
                window.GeminiNav.i18n.currentLang = changes.language.newValue;
                panel.updateLanguageUI();
            }
            if (changes.visibleItems) {
                panel.visibleItems = changes.visibleItems.newValue;
                panel.rebuild();
            }
            if (changes.autoCollapse) {
                panel.autoCollapse = changes.autoCollapse.newValue;
                if (panel.autoCollapse) {
                    panel.floatingIcon.style.display = 'flex';
                } else {
                    panel.floatingIcon.style.display = 'none';
                    panel.navPanel.classList.remove('collapsed');
                }
            }
        }
    });
})();
