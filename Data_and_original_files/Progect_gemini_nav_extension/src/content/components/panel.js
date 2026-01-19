window.GeminiNav = window.GeminiNav || {};

window.GeminiNav.Panel = class Panel {
    constructor(adapter) {
        this.adapter = adapter;
        this.visibleItems = 6;
        this.itemHeight = 44;
        this.navPanel = null;
        this.scrollContainer = null;
        this.hiddenIndices = new Set();
        this.currentActiveIndex = -1;
        this.lastQuestionCount = 0;
        this.intersectionObserver = null;
        this.tooltip = null;
        this.currentFontSize = '14px';
        this.filterQuery = '';
        this.numberingStyle = 'dot';
        this.autoCollapse = false;
        this.floatingIcon = null;
        this.fontSizeDropdown = null;
        this.collapseTimeout = null;
    }

    t(key) {
        return window.GeminiNav.i18n ? window.GeminiNav.i18n.get(key) : key;
    }

    create() {
        if (this.navPanel) return this.navPanel;

        this.createFloatingIcon();

        this.navPanel = document.createElement('div');
        this.navPanel.id = 'gemini-nav-panel';
        this.navPanel.className = 'idle';
        document.body.appendChild(this.navPanel);

        // Header
        const header = document.createElement('div');
        header.className = 'gemini-nav-header';

        const title = document.createElement('span');
        title.className = 'gemini-nav-title';
        title.textContent = this.adapter.name || 'AI Nav';
        header.appendChild(title);

        const controls = document.createElement('div');
        controls.className = 'gemini-nav-controls';

        // Font size dropdown
        const fontSizeWrapper = document.createElement('div');
        fontSizeWrapper.className = 'gemini-nav-fontsize-wrapper';

        const fontSizeBtn = document.createElement('span');
        fontSizeBtn.className = 'gemini-nav-btn';
        fontSizeBtn.textContent = 'A';
        fontSizeBtn.title = this.t('adjustFontSize');
        fontSizeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleFontSizeDropdown();
        });
        fontSizeWrapper.appendChild(fontSizeBtn);

        const dropdown = document.createElement('div');
        dropdown.className = 'gemini-nav-fontsize-dropdown';
        dropdown.style.display = 'none';

        [12, 14, 16].forEach(size => {
            const option = document.createElement('div');
            option.className = 'gemini-nav-fontsize-option';
            option.textContent = size + 'px';
            option.dataset.size = size;
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                this.setFontSize(size + 'px');
                dropdown.style.display = 'none';
            });
            dropdown.appendChild(option);
        });
        fontSizeWrapper.appendChild(dropdown);
        this.fontSizeDropdown = dropdown;
        controls.appendChild(fontSizeWrapper);

        // Settings button
        const settingsBtn = document.createElement('span');
        settingsBtn.className = 'gemini-nav-btn gemini-nav-settings-btn';
        settingsBtn.innerHTML = '⚙';
        settingsBtn.title = this.t('settings') || '设置';
        settingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            chrome.runtime.sendMessage({ action: 'openOptions' });
        });
        controls.appendChild(settingsBtn);

        const minimizeBtn = document.createElement('span');
        minimizeBtn.className = 'gemini-nav-btn';
        minimizeBtn.textContent = '−';
        minimizeBtn.title = this.t('minimize');
        minimizeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.minimize();
        });
        controls.appendChild(minimizeBtn);

        header.appendChild(controls);
        this.navPanel.appendChild(header);

        // Search
        const searchRow = document.createElement('div');
        searchRow.className = 'gemini-nav-search-row';

        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.className = 'gemini-nav-search-input';
        searchInput.placeholder = this.t('searchPlaceholder');
        searchInput.addEventListener('input', (e) => {
            this.filterQuery = e.target.value.toLowerCase();
            this.rebuild();
        });
        searchInput.addEventListener('mousedown', (e) => e.stopPropagation());
        searchRow.appendChild(searchInput);
        this.navPanel.appendChild(searchRow);
        this.searchInput = searchInput;

        // Scroll container
        this.scrollContainer = document.createElement('div');
        this.scrollContainer.id = 'gemini-nav-scroll';
        this.navPanel.appendChild(this.scrollContainer);

        // Footer
        const footer = document.createElement('div');
        footer.className = 'gemini-nav-footer';
        footer.style.display = 'none';

        const restoreBtn = document.createElement('span');
        restoreBtn.className = 'gemini-nav-restore-btn';
        restoreBtn.textContent = this.t('restoreHidden');
        restoreBtn.addEventListener('click', () => {
            this.hiddenIndices.clear();
            this.rebuild();
        });
        footer.appendChild(restoreBtn);
        this.navPanel.appendChild(footer);
        this.footerElement = footer;
        this.restoreBtn = restoreBtn;

        // Draggable
        if (window.GeminiNav.Draggable) {
            new window.GeminiNav.Draggable(this.navPanel, header, (pos) => {
                chrome.storage.local.set({ panelPosition: pos });
            });
        }

        // Resizable
        if (window.GeminiNav.Resizable) {
            new window.GeminiNav.Resizable(this.navPanel, {
                onResizeEnd: (size) => {
                    chrome.storage.local.set({ panelSize: size });
                }
            });
        }

        // Restore settings
        chrome.storage.local.get(['panelPosition', 'panelSize', 'fontSize', 'theme', 'numbering', 'firstUse', 'language', 'visibleItems', 'autoCollapse'], (result) => {
            if (result.panelPosition) {
                this.navPanel.style.left = result.panelPosition.left;
                this.navPanel.style.top = result.panelPosition.top;
                this.navPanel.style.transform = 'none';
                this.navPanel.style.right = 'auto';
            }
            if (result.panelSize) {
                this.navPanel.style.width = result.panelSize.width;
                this.navPanel.style.height = result.panelSize.height;
                if (result.panelSize.height) {
                    const sc = this.navPanel.querySelector('#gemini-nav-scroll');
                    if (sc) sc.style.maxHeight = 'none';
                }
            }
            if (result.fontSize) {
                this.currentFontSize = result.fontSize;
                this.navPanel.style.setProperty('--gn-font-size', result.fontSize);
            }
            if (result.theme) this.applyTheme(result.theme);
            if (result.numbering) this.numberingStyle = result.numbering;
            if (result.language && window.GeminiNav.i18n) {
                window.GeminiNav.i18n.currentLang = result.language;
                this.updateLanguageUI();
            }
            if (result.visibleItems) this.visibleItems = result.visibleItems;
            if (result.autoCollapse !== undefined) {
                this.autoCollapse = result.autoCollapse;
            }
            if (result.firstUse === undefined || result.firstUse === true) {
                this.showFirstUseHighlight();
                chrome.storage.local.set({ firstUse: false });
            }
        });

        // Auto-collapse with 5-second delay
        this.navPanel.addEventListener('mouseenter', () => {
            if (this.collapseTimeout) {
                clearTimeout(this.collapseTimeout);
                this.collapseTimeout = null;
            }
            this.navPanel.classList.remove('idle', 'collapsed');
            this.navPanel.classList.add('visible');
            if (this.autoCollapse) {
                this.floatingIcon.style.display = 'none';
            }
        });

        this.navPanel.addEventListener('mouseleave', () => {
            this.navPanel.classList.remove('visible');
            this.navPanel.classList.add('idle');
            if (this.autoCollapse) {
                this.collapseTimeout = setTimeout(() => {
                    this.navPanel.classList.add('collapsed');
                    this.floatingIcon.style.display = 'flex';
                }, 5000);
            }
        });

        document.addEventListener('click', () => {
            if (this.fontSizeDropdown) this.fontSizeDropdown.style.display = 'none';
        });

        this.scrollContainer.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.scrollContainer.scrollTop += e.deltaY;
        }, { passive: false });

        return this.navPanel;
    }

    createFloatingIcon() {
        this.floatingIcon = document.createElement('div');
        this.floatingIcon.id = 'gemini-nav-floating-icon';
        this.floatingIcon.innerHTML = '🧭';
        this.floatingIcon.title = 'AI Navigator';
        this.floatingIcon.style.display = 'none';

        this.floatingIcon.addEventListener('click', () => {
            if (this.collapseTimeout) {
                clearTimeout(this.collapseTimeout);
                this.collapseTimeout = null;
            }
            this.floatingIcon.style.display = 'none';
            this.navPanel.classList.remove('collapsed', 'idle');
            this.navPanel.classList.add('visible');
        });

        document.body.appendChild(this.floatingIcon);
    }

    toggleFontSizeDropdown() {
        if (this.fontSizeDropdown.style.display === 'none') {
            this.fontSizeDropdown.style.display = 'block';
            const options = this.fontSizeDropdown.querySelectorAll('.gemini-nav-fontsize-option');
            options.forEach(opt => {
                opt.classList.toggle('active', opt.dataset.size + 'px' === this.currentFontSize);
            });
        } else {
            this.fontSizeDropdown.style.display = 'none';
        }
    }

    setFontSize(size) {
        this.currentFontSize = size;
        this.navPanel.style.setProperty('--gn-font-size', size);
        chrome.storage.local.set({ fontSize: size });
    }

    updateLanguageUI() {
        if (this.searchInput) this.searchInput.placeholder = this.t('searchPlaceholder');
        if (this.restoreBtn) this.restoreBtn.textContent = this.t('restoreHidden');
        this.rebuild();
    }

    showFirstUseHighlight() {
        this.navPanel.classList.add('first-use-highlight', 'visible');
        this.navPanel.classList.remove('idle');
        setTimeout(() => {
            this.navPanel.classList.remove('first-use-highlight', 'visible');
            this.navPanel.classList.add('idle');
        }, 3000);
    }

    applyTheme(theme) {
        this.navPanel.classList.remove('theme-light', 'theme-dark', 'theme-auto');
        this.navPanel.classList.add(`theme-${theme}`);
    }

    formatNumber(index) {
        const num = index + 1;
        switch (this.numberingStyle) {
            case 'paren': return `(${num})`;
            case 'hash': return `#${num}`;
            default: return `${num}.`;
        }
    }

    updateActiveState() {
        this.scrollContainer.querySelectorAll('.gemini-nav-item').forEach(item => {
            item.classList.toggle('active', parseInt(item.dataset.index) === this.currentActiveIndex);
        });
    }

    rebuild(scrollToBottom = false) {
        const questions = this.adapter.getQuestions();
        this.scrollContainer.innerHTML = '';

        if (questions.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'gemini-nav-empty';
            empty.textContent = this.t('noConversation');
            this.scrollContainer.appendChild(empty);
            this.lastQuestionCount = 0;
            this.footerElement.style.display = 'none';
            return;
        }

        this.lastQuestionCount = questions.length;
        this.footerElement.style.display = this.hiddenIndices.size > 0 ? 'flex' : 'none';

        if (!this.tooltip && window.GeminiNav.Tooltip) {
            this.tooltip = new window.GeminiNav.Tooltip();
        }

        questions.forEach((q, index) => {
            if (this.hiddenIndices.has(index)) return;
            const text = this.adapter.getQuestionText(q);
            if (this.filterQuery && !text.toLowerCase().includes(this.filterQuery)) return;

            const displayText = text.length > 12 ? text.substring(0, 12) + '...' : text;

            const item = document.createElement('div');
            item.className = 'gemini-nav-item';
            item.dataset.index = index;
            if (index === this.currentActiveIndex) item.classList.add('active');

            const numberSpan = document.createElement('span');
            numberSpan.className = 'gemini-nav-item-number';
            numberSpan.textContent = this.formatNumber(index);

            const textSpan = document.createElement('span');
            textSpan.className = 'gemini-nav-item-text';
            textSpan.textContent = displayText;

            const removeBtn = document.createElement('span');
            removeBtn.className = 'gemini-nav-item-remove';
            removeBtn.textContent = '−';
            removeBtn.title = this.t('hide');
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.hiddenIndices.add(index);
                this.rebuild();
            });

            item.addEventListener('click', () => {
                this.currentActiveIndex = index;
                q.scrollIntoView({ behavior: 'smooth', block: 'center' });
                this.updateActiveState();
            });

            if (this.tooltip) {
                item.addEventListener('mouseenter', () => this.tooltip.show(text, item));
                item.addEventListener('mouseleave', () => this.tooltip.hide());
            }

            item.appendChild(numberSpan);
            item.appendChild(textSpan);
            item.appendChild(removeBtn);
            this.scrollContainer.appendChild(item);
        });

        const maxHeight = this.visibleItems * this.itemHeight;
        this.scrollContainer.style.maxHeight = this.navPanel.style.height ? 'none' : maxHeight + 'px';

        if (scrollToBottom) {
            this.scrollContainer.scrollTop = this.scrollContainer.scrollHeight;
        }
    }

    setupScrollObserver() {
        const questions = this.adapter.getQuestions();
        if (questions.length === 0) return;

        if (this.intersectionObserver) this.intersectionObserver.disconnect();

        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const idx = Array.from(this.adapter.getQuestions()).indexOf(entry.target);
                    if (idx !== -1 && idx !== this.currentActiveIndex) {
                        this.currentActiveIndex = idx;
                        this.updateActiveState();
                    }
                }
            });
        }, { threshold: 0.5 });

        questions.forEach((q) => this.intersectionObserver.observe(q));
    }

    navigate(direction) {
        const items = this.scrollContainer.querySelectorAll('.gemini-nav-item');
        if (items.length === 0) return;

        const currentVisualIndex = Array.from(items).findIndex(item => parseInt(item.dataset.index) === this.currentActiveIndex);
        let newIndex = currentVisualIndex === -1 ? (direction > 0 ? 0 : items.length - 1) : currentVisualIndex + direction;

        if (newIndex >= 0 && newIndex < items.length) {
            items[newIndex].click();
        }
    }

    toggle() {
        if (this.navPanel.style.display === 'none' || this.navPanel.classList.contains('collapsed')) {
            if (this.collapseTimeout) {
                clearTimeout(this.collapseTimeout);
                this.collapseTimeout = null;
            }
            this.navPanel.style.display = 'flex';
            this.navPanel.classList.remove('collapsed', 'hidden');
            if (this.autoCollapse) this.floatingIcon.style.display = 'none';
        } else {
            this.navPanel.classList.add('hidden');
            this.navPanel.style.display = 'none';
        }
    }

    minimize() {
        this.navPanel.classList.toggle('minimized');
    }
};
