(function () {
  var state = {
    mermaidLoaded: false,
    mathjaxLoaded: false,
    mermaidLoading: null,
    mathjaxLoading: null,
    mermaidInitialized: false
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
      if (!img.getAttribute('loading')) img.setAttribute('loading', 'lazy')
      if (!img.getAttribute('decoding')) img.setAttribute('decoding', 'async')
      if (!img.getAttribute('fetchpriority')) img.setAttribute('fetchpriority', 'auto')
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
    observer: null,
    scrollTimeout: null
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
    if (tocState.scrollHandler) {
      window.removeEventListener('scroll', tocState.scrollHandler)
      tocState.scrollHandler = null
    }

    // Find TOC container
    var tocNav = document.querySelector('.md-sidebar--secondary .md-nav--secondary')
    if (!tocNav) return

    // Find heading elements with IDs
    var content = document.querySelector('.md-content')
    if (!content) return

    var headings = content.querySelectorAll('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]')
    if (headings.length === 0) return

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

    // Scroll-based fallback: find heading closest to top of viewport
    var headingsArray = Array.prototype.slice.call(headings)
    var lastActiveId = null

    tocState.scrollHandler = function () {
      if (tocState.scrollTimeout) return // Throttle

      tocState.scrollTimeout = setTimeout(function () {
        tocState.scrollTimeout = null

        var scrollTop = window.pageYOffset || document.documentElement.scrollTop
        var headerOffset = 100 // Account for fixed header

        // Find the heading that is closest to (but above) the current scroll position
        var activeHeading = null
        for (var i = 0; i < headingsArray.length; i++) {
          var heading = headingsArray[i]
          var headingTop = heading.getBoundingClientRect().top + scrollTop
          if (headingTop <= scrollTop + headerOffset) {
            activeHeading = heading
          } else {
            break
          }
        }

        // Fallback to first heading if none found
        if (!activeHeading && headingsArray.length > 0) {
          activeHeading = headingsArray[0]
        }

        if (activeHeading && activeHeading.id !== lastActiveId) {
          lastActiveId = activeHeading.id

          var tocLink = tocNav.querySelector('a[href="#' + CSS.escape(activeHeading.id) + '"]')
          if (tocLink) {
            var item = tocLink.parentElement
            expandToItem(item, tocNav)
            scrollTocToActiveLink(tocLink, tocNav)
          }
        }
      }, 100)
    }

    window.addEventListener('scroll', tocState.scrollHandler, { passive: true })

    // Initial sync
    tocState.scrollHandler()
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

      var innerScroll = scrollContainer.querySelector('.md-sidebar__inner') || scrollContainer

      try {
        innerScroll.scrollTo({ top: scrollTarget, behavior: 'smooth' })
      } catch (_) {
        innerScroll.scrollTop = scrollTarget
      }
    }
  }

  function onRouteUpdate() {
    enhanceImages()
    initTocScrollSync()
    Promise.all([loadMermaidIfNeeded(), loadMathJaxIfNeeded()])
      .then(function () {
        renderMermaid()
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
