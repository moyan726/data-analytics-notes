(function () {
  var state = {
    mermaidLoaded: false,
    mathjaxLoaded: false,
    mermaidLoading: null,
    mathjaxLoading: null,
    mermaidInitialized: false,
    lightboxInitialized: false,
    lightboxOpen: false,
    lightboxLastFocused: null,
    lightbox: null
  }

  function ensureScript(src, id) {
    return new Promise(function (resolve, reject) {
      if (id && document.getElementById(id)) {
        resolve()
        return
      }

      var existing = document.querySelector('script[src="' + src + '"]')
      if (existing) {
        if (existing.getAttribute('data-loaded') === 'true') {
          resolve()
          return
        }
        existing.addEventListener('load', function () {
          existing.setAttribute('data-loaded', 'true')
          resolve()
        })
        existing.addEventListener('error', reject)
        return
      }

      var script = document.createElement('script')
      if (id) script.id = id
      script.src = src
      script.async = true
      script.defer = true
      script.addEventListener('load', function () {
        script.setAttribute('data-loaded', 'true')
        resolve()
      })
      script.addEventListener('error', reject)
      document.head.appendChild(script)
    })
  }

  function enhanceImages() {
    var root = document.querySelector('.md-content') || document
    var images = root.querySelectorAll('img')
    for (var i = 0; i < images.length; i++) {
      var img = images[i]
      if (!img.getAttribute('decoding')) img.setAttribute('decoding', 'async')
      if (!img.getAttribute('fetchpriority')) img.setAttribute('fetchpriority', 'auto')
    }
  }

  function setAriaLabelIfMissing(el, label) {
    if (!el || !label) return
    if (!el.getAttribute('aria-label')) {
      el.setAttribute('aria-label', label)
    }
  }

  function enhanceControlA11y() {
    var selectorToLabel = [
      { selector: 'label[for="__drawer"]', label: '打开主导航菜单' },
      { selector: 'label[for="__search"]', label: '打开站内搜索' },
      { selector: '.md-top', label: '返回页面顶部' },
      { selector: '.md-search__input', label: '搜索文档内容' }
    ]

    for (var i = 0; i < selectorToLabel.length; i++) {
      var item = selectorToLabel[i]
      var elements = document.querySelectorAll(item.selector)
      for (var j = 0; j < elements.length; j++) {
        setAriaLabelIfMissing(elements[j], item.label)
      }
    }
  }

  function enhanceButtonA11y() {
    var buttons = document.querySelectorAll('.md-typeset a.md-button')
    for (var i = 0; i < buttons.length; i++) {
      var button = buttons[i]
      if (button.getAttribute('aria-label')) continue

      var label = (button.textContent || '').replace(/\s+/g, ' ').trim()
      if (label) {
        button.setAttribute('aria-label', label)
      }
    }
  }

  function shouldSkipZoomForImage(img) {
    if (!img) return true
    if (img.closest('.hero-badges, .card-tags, .md-social, .md-header, .md-footer, .md-nav')) return true
    if (img.getAttribute('data-no-zoom') === 'true') return true
    return false
  }

  function bindZoomTrigger(el, opener) {
    if (!el || typeof opener !== 'function') return
    if (el.getAttribute('data-zoom-bound') === 'true') return

    el.setAttribute('data-zoom-bound', 'true')

    el.addEventListener('click', function (e) {
      if (state.lightboxOpen) return
      if (typeof e.button === 'number' && e.button !== 0) return
      e.preventDefault()
      e.stopPropagation()
      opener()
    })

    el.addEventListener('keydown', function (e) {
      if (state.lightboxOpen) return
      if (e.key !== 'Enter' && e.key !== ' ') return
      e.preventDefault()
      e.stopPropagation()
      opener()
    })
  }

  function enhanceZoomableMedia() {
    var root = document.querySelector('.md-typeset') || document

    var images = root.querySelectorAll('img')
    for (var i = 0; i < images.length; i++) {
      var img = images[i]
      if (shouldSkipZoomForImage(img)) continue
      if (img.closest('.mermaid, .diagram-figure')) continue

      var linked = img.closest('a')
      if (linked && linked.getAttribute('href')) {
        var href = linked.getAttribute('href')
        var isImageLink = /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(href)
        if (!isImageLink) continue
      }

      img.classList.add('zoomable-media')
      if (!img.getAttribute('tabindex')) img.setAttribute('tabindex', '0')
      setAriaLabelIfMissing(img, '点击放大查看图片')
      if (!img.getAttribute('title')) img.setAttribute('title', '点击放大查看图片')

      bindZoomTrigger(img, (function (currentImg) {
        return function () {
          openMediaLightboxFromImage(currentImg)
        }
      })(img))
    }
  }

  function getFigureCaptionText(el) {
    if (!el) return ''
    var figure = el.closest('figure')
    if (!figure) return ''
    var caption = figure.querySelector('figcaption')
    if (!caption || !caption.textContent) return ''
    return caption.textContent.replace(/\s+/g, ' ').trim()
  }

  function ensureMediaLightbox() {
    if (state.lightboxInitialized) return

    var overlay = document.createElement('div')
    overlay.className = 'media-lightbox'
    overlay.setAttribute('hidden', '')
    overlay.setAttribute('aria-hidden', 'true')
    overlay.setAttribute('role', 'dialog')
    overlay.setAttribute('aria-modal', 'true')

    var closeBtn = document.createElement('button')
    closeBtn.className = 'media-lightbox__close'
    closeBtn.setAttribute('type', 'button')
    closeBtn.setAttribute('aria-label', '关闭图片预览')
    closeBtn.textContent = '×'

    var content = document.createElement('div')
    content.className = 'media-lightbox__content'

    var image = document.createElement('img')
    image.className = 'media-lightbox__image'
    image.setAttribute('alt', '')

    var caption = document.createElement('p')
    caption.className = 'media-lightbox__caption'

    content.appendChild(image)
    content.appendChild(caption)
    overlay.appendChild(closeBtn)
    overlay.appendChild(content)
    document.body.appendChild(overlay)

    state.lightbox = {
      overlay: overlay,
      closeBtn: closeBtn,
      image: image,
      caption: caption
    }

    closeBtn.addEventListener('click', closeMediaLightbox)
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) {
        closeMediaLightbox()
      }
    })

    document.addEventListener('keydown', function (e) {
      if (!state.lightboxOpen) return
      if (e.key === 'Escape') {
        e.preventDefault()
        closeMediaLightbox()
      }
    })

    state.lightboxInitialized = true
  }

  function openMediaLightboxFromImage(img) {
    if (!img) return
    var src = img.currentSrc || img.getAttribute('src')
    if (!src) {
      showToast('图片无法预览')
      return
    }
    ensureMediaLightbox()

    var lb = state.lightbox
    var captionText = getFigureCaptionText(img) || img.getAttribute('alt') || ''
    lb.image.style.display = 'block'
    lb.image.onerror = function () {
      lb.image.onerror = null
      showToast('图片加载失败，请稍后重试')
      closeMediaLightbox()
    }
    lb.image.src = src
    lb.image.alt = img.getAttribute('alt') || ''
    lb.caption.textContent = captionText

    showMediaLightbox()
  }

  function showMediaLightbox() {
    var lb = state.lightbox
    if (!lb) return

    state.lightboxLastFocused = document.activeElement
    state.lightboxOpen = true

    lb.overlay.removeAttribute('hidden')
    lb.overlay.setAttribute('aria-hidden', 'false')
    document.body.classList.add('media-lightbox-open')
    lb.closeBtn.focus()
  }

  function closeMediaLightbox() {
    if (!state.lightbox || !state.lightboxOpen) return
    var lb = state.lightbox

    state.lightboxOpen = false
    lb.overlay.setAttribute('hidden', '')
    lb.overlay.setAttribute('aria-hidden', 'true')
    lb.image.removeAttribute('src')
    lb.caption.textContent = ''
    document.body.classList.remove('media-lightbox-open')

    if (state.lightboxLastFocused && typeof state.lightboxLastFocused.focus === 'function') {
      state.lightboxLastFocused.focus()
    }
  }

  function pageHasMermaid() {
    return Boolean(document.querySelector('.mermaid'))
  }

  function pageHasMath() {
    return Boolean(document.querySelector('.arithmatex, script[type^="math/tex"], mjx-container'))
  }

  function loadMermaidIfNeeded() {
    if (!pageHasMermaid()) return Promise.resolve()
    if (state.mermaidLoaded) return Promise.resolve()
    if (state.mermaidLoading) return state.mermaidLoading

    state.mermaidLoading = ensureScript('https://unpkg.com/mermaid@10/dist/mermaid.min.js', '__mermaid')
      .then(function () {
        state.mermaidLoaded = true
      })
      .catch(function (e) {
        state.mermaidLoading = null
        throw e
      })

    return state.mermaidLoading
  }

  function renderMermaid() {
    if (!pageHasMermaid()) return
    if (!window.mermaid) return

    if (!state.mermaidInitialized) {
      window.mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        fontFamily: 'Noto Sans SC, sans-serif',
        flowchart: {
          useMaxWidth: true,
          htmlLabels: true,
          curve: 'basis'
        },
        sequence: {
          useMaxWidth: true,
          mirrorActors: true
        }
      })
      state.mermaidInitialized = true
    }

    try {
      if (typeof window.mermaid.run === 'function') {
        window.mermaid.run({ querySelector: '.mermaid' })
      }
    } catch (_) { }
  }

  function enhanceMermaidAccessibility() {
    var blocks = document.querySelectorAll('.mermaid')
    for (var i = 0; i < blocks.length; i++) {
      var block = blocks[i]
      var svg = block.querySelector('svg')
      if (!svg) continue

      svg.setAttribute('role', 'img')
      svg.setAttribute('focusable', 'false')

      var figure = block.closest('.diagram-figure')
      var titleText = '流程图'
      var descText = ''

      if (figure) {
        var caption = figure.querySelector('figcaption')
        if (caption && caption.textContent) {
          titleText = caption.textContent.trim()
        }

        var desc = figure.querySelector('.visually-hidden')
        if (desc && desc.textContent) {
          descText = desc.textContent.trim()
        }
      }

      var svgId = svg.getAttribute('id') || ('mermaid-svg-' + i)
      svg.setAttribute('id', svgId)

      var titleId = svgId + '-title'
      var descId = svgId + '-desc'

      var titleEl = svg.querySelector('title')
      if (!titleEl) {
        titleEl = document.createElementNS('http://www.w3.org/2000/svg', 'title')
        svg.insertBefore(titleEl, svg.firstChild)
      }
      titleEl.setAttribute('id', titleId)
      titleEl.textContent = titleText

      if (descText) {
        var descEl = svg.querySelector('desc')
        if (!descEl) {
          descEl = document.createElementNS('http://www.w3.org/2000/svg', 'desc')
          svg.insertBefore(descEl, titleEl.nextSibling)
        }
        descEl.setAttribute('id', descId)
        descEl.textContent = descText
        svg.setAttribute('aria-describedby', descId)
      }

      svg.setAttribute('aria-labelledby', titleId)
    }
  }

  function loadMathJaxIfNeeded() {
    if (!pageHasMath()) return Promise.resolve()
    if (state.mathjaxLoaded) return Promise.resolve()
    if (state.mathjaxLoading) return state.mathjaxLoading

    if (!window.MathJax) {
      window.MathJax = {
        tex: {
          inlineMath: [['\\(', '\\)']],
          displayMath: [['\\[', '\\]']],
          processEscapes: true,
          processEnvironments: true
        },
        options: {
          ignoreHtmlClass: '.*|',
          processHtmlClass: 'arithmatex'
        }
      }
    }

    state.mathjaxLoading = ensureScript('https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js', '__mathjax')
      .then(function () {
        state.mathjaxLoaded = true
      })
      .catch(function (e) {
        state.mathjaxLoading = null
        throw e
      })

    return state.mathjaxLoading
  }

  function typesetMath() {
    if (!pageHasMath()) return
    if (!window.MathJax || !window.MathJax.typesetPromise) return
    try {
      window.MathJax.typesetPromise()
    } catch (_) { }
  }

  // ========== TOC Scroll Synchronization Fix ==========
  // Fixes the issue where TOC sidebar doesn't scroll on long pages
  var tocState = {
    observer: null
  }

  function initTocScrollSync() {
    // Clean up previous observers
    if (tocState.observer) {
      tocState.observer.disconnect()
      tocState.observer = null
    }
    if (tocState.mutationObserver) {
      tocState.mutationObserver.disconnect()
      tocState.mutationObserver = null
    }

    // Find TOC container
    var tocNav = document.querySelector('.md-sidebar--secondary .md-nav--secondary')
    if (!tocNav) return

    // Mark items that have children as nested
    var allItems = tocNav.querySelectorAll('.md-nav__item')
    allItems.forEach(function (item) {
      var childNav = item.querySelector(':scope > .md-nav')
      if (childNav) {
        item.classList.add('md-nav__item--nested')
      }
    })

    // Click handler for toggling expansion
    tocNav.addEventListener('click', function (e) {
      var link = e.target.closest('.md-nav__link')
      if (!link) return

      var item = link.parentElement
      if (!item || !item.classList.contains('md-nav__item--nested')) return

      // Toggle expansion on click
      if (item.classList.contains('toc-expanded')) {
        collapseItem(item)
      } else {
        expandItemExclusive(item, tocNav)
      }
    })

    // Watch for Material theme's active link changes via MutationObserver
    tocState.mutationObserver = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          var target = mutation.target
          if (target.classList.contains('md-nav__link') && target.classList.contains('md-nav__link--active')) {
            var item = target.parentElement
            if (item) {
              expandToItem(item, tocNav)
              scrollTocToActiveLink(target, tocNav)
            }
          }
        }
      })
    })

    tocState.mutationObserver.observe(tocNav, {
      attributes: true,
      attributeFilter: ['class'],
      subtree: true
    })

    // Initial sync
    var activeLink = tocNav.querySelector('.md-nav__link--active')
    if (activeLink) {
      var activeItem = activeLink.parentElement
      if (activeItem) {
        expandToItem(activeItem, tocNav)
        scrollTocToActiveLink(activeLink, tocNav)
      }
    }
  }


  // Expand a single item and collapse siblings (exclusive expansion)
  function expandItemExclusive(item, tocNav) {
    if (!item) return

    // Collapse all items at the same level and deeper, except parents of the target
    var parent = item.parentElement
    if (parent) {
      var siblings = parent.querySelectorAll(':scope > .md-nav__item.toc-expanded')
      siblings.forEach(function (sibling) {
        if (sibling !== item) {
          collapseItem(sibling)
        }
      })
    }

    // Expand the target item
    item.classList.add('toc-expanded')

    // Also ensure all parent items are expanded
    expandParents(item, tocNav)
  }

  // Expand all parent items of an element
  function expandParents(el, tocNav) {
    var parent = el.parentElement
    while (parent && parent !== tocNav) {
      if (parent.classList.contains('md-nav__item') && parent.classList.contains('md-nav__item--nested')) {
        parent.classList.add('toc-expanded')
      }
      parent = parent.parentElement
    }
  }

  // Collapse an item and all its children
  function collapseItem(item) {
    item.classList.remove('toc-expanded')
    var children = item.querySelectorAll('.toc-expanded')
    children.forEach(function (child) {
      child.classList.remove('toc-expanded')
    })
  }

  // Expand to a specific item, collapsing all non-ancestors
  function expandToItem(targetItem, tocNav) {
    if (!targetItem || !tocNav) return

    // Build the ancestor chain for the target item
    var ancestors = []
    var el = targetItem
    while (el && el !== tocNav) {
      if (el.classList.contains('md-nav__item')) {
        ancestors.push(el)
      }
      el = el.parentElement
    }

    // Collapse all expanded items that are NOT in the ancestor chain
    var allExpanded = tocNav.querySelectorAll('.toc-expanded')
    allExpanded.forEach(function (expanded) {
      if (ancestors.indexOf(expanded) === -1) {
        expanded.classList.remove('toc-expanded')
      }
    })

    // Expand all ancestors (from root to target)
    ancestors.reverse().forEach(function (ancestor) {
      if (ancestor.classList.contains('md-nav__item--nested')) {
        ancestor.classList.add('toc-expanded')
      }
    })

    // If the target item itself is nested, expand it
    if (targetItem.classList.contains('md-nav__item--nested')) {
      targetItem.classList.add('toc-expanded')
    }
  }

  function scrollTocToActiveLink(tocLink, tocNav) {
    if (!tocLink || !tocNav) return

    var scrollContainer = tocNav.closest('.md-sidebar__scrollwrap') || tocNav.closest('.md-sidebar--secondary')
    if (!scrollContainer) return

    var linkRect = tocLink.getBoundingClientRect()
    var containerRect = scrollContainer.getBoundingClientRect()

    var isAbove = linkRect.top < containerRect.top + 20
    var isBelow = linkRect.bottom > containerRect.bottom - 20

    if (isAbove || isBelow) {
      var linkOffsetTop = tocLink.offsetTop
      var containerHeight = scrollContainer.clientHeight
      var scrollTarget = linkOffsetTop - (containerHeight / 2) + (tocLink.offsetHeight / 2)

      try {
        scrollContainer.scrollTo({ top: scrollTarget, behavior: 'smooth' })
      } catch (_) {
        scrollContainer.scrollTop = scrollTarget
      }
    }
  }

  function onRouteUpdate() {
    enhanceImages()
    enhanceControlA11y()
    enhanceButtonA11y()
    enhanceZoomableMedia()
    initTocScrollSync()
    Promise.all([loadMermaidIfNeeded(), loadMathJaxIfNeeded()])
      .then(function () {
        renderMermaid()
        enhanceMermaidAccessibility()
        enhanceZoomableMedia()
        typesetMath()
      })
      .catch(function () { })
  }

  if (typeof document$ !== 'undefined' && document$ && typeof document$.subscribe === 'function') {
    document$.subscribe(onRouteUpdate)
  } else {
    document.addEventListener('DOMContentLoaded', onRouteUpdate)
  }

  // Email Copy Logic
  document.addEventListener('click', function (e) {
    if (e.target && e.target.closest('.email-copy-btn')) {
      e.preventDefault();
      var btn = e.target.closest('.email-copy-btn');
      var email = btn.getAttribute('data-email');
      if (email) {
        navigator.clipboard.writeText(email).then(function () {
          showToast('📋 邮箱已复制: ' + email);
        }, function (err) {
          console.error('Copy failed', err);
          prompt('复制失败，请手动复制:', email);
        });
      }
    }
  });

  function showToast(message) {
    // Remove existing toast
    var existing = document.querySelector('.custom-toast');
    if (existing) document.body.removeChild(existing);

    var toast = document.createElement('div');
    toast.className = 'custom-toast';
    toast.innerText = message;
    document.body.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(function () {
      toast.classList.add('show');
    });

    setTimeout(function () {
      toast.classList.remove('show');
      setTimeout(function () {
        if (toast.parentNode) document.body.removeChild(toast);
      }, 300);
    }, 2000);
  }

})();
