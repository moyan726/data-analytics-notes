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
    // Clean up previous observer
    if (tocState.observer) {
      tocState.observer.disconnect()
      tocState.observer = null
    }

    // Find TOC container
    var tocNav = document.querySelector('.md-sidebar--secondary .md-nav')
    if (!tocNav) return

    // Find heading elements with IDs
    var content = document.querySelector('.md-content')
    if (!content) return

    var headings = content.querySelectorAll('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]')
    if (headings.length === 0) return

    // IntersectionObserver options
    var observerOptions = {
      root: null,
      rootMargin: '-80px 0px -70% 0px',
      threshold: 0
    }

    tocState.observer = new IntersectionObserver(function (entries) {
      var visibleHeadings = []
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          visibleHeadings.push({
            id: entry.target.id,
            top: entry.boundingClientRect.top
          })
        }
      })

      if (visibleHeadings.length === 0) return

      visibleHeadings.sort(function (a, b) { return a.top - b.top })
      var activeId = visibleHeadings[0].id

      var tocLink = tocNav.querySelector('a[href="#' + CSS.escape(activeId) + '"]')
      if (!tocLink) return

      if (tocState.scrollTimeout) clearTimeout(tocState.scrollTimeout)

      tocState.scrollTimeout = setTimeout(function () {
        scrollTocToActiveLink(tocLink, tocNav)
      }, 50)
    }, observerOptions)

    headings.forEach(function (heading) {
      tocState.observer.observe(heading)
    })
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
})()
