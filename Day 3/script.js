

(function () {
  'use strict';

  var THEME_STORAGE_KEY = 'arslan_phase6_theme';
  var PROGRESS_STORAGE_KEY = 'arslan_phase6_progress';
  var TOTAL_DAYS = 18;

  var siteHeader = document.getElementById('site-header');
  var topNavbar = document.getElementById('top-navbar');
  var mainNavbar = document.getElementById('main-navbar');
  var mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  var courseNavControls = document.getElementById('course-nav-controls');
  var daySelector = document.getElementById('day-selector');
  var themeSelector = document.getElementById('theme-selector');
  var lessonCompleteBtn = document.getElementById('lesson-complete-btn');
  var tocToggleBtn = document.getElementById('toc-toggle-btn');
  var tocList = document.getElementById('toc-list');
  var quizForm = document.getElementById('day-quiz-form');
  var quizRetryBtn = document.getElementById('quiz-retry-btn');
  var quizResultBanner = document.getElementById('quiz-result-banner');
  var footerYearEl = document.getElementById('footer-year');

  function getSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  function applyTheme(mode) {
    var safeMode = mode === 'dark' || mode === 'light' || mode === 'system' ? mode : 'system';
    var resolved = safeMode === 'system' ? getSystemTheme() : safeMode;

    document.documentElement.setAttribute('data-theme', resolved);
    document.documentElement.setAttribute('data-theme-mode', safeMode);

    if (themeSelector && themeSelector.value !== safeMode) {
      themeSelector.value = safeMode;
    }
  }

  function loadTheme() {
    var savedMode = 'system';
    try {
      savedMode = localStorage.getItem(THEME_STORAGE_KEY) || 'system';
    } catch (err) {
      savedMode = 'system';
    }
    applyTheme(savedMode);
  }

  function saveTheme(mode) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (err) {
    }
    applyTheme(mode);
  }

  function initThemeControls() {
    loadTheme();

    if (themeSelector) {
      themeSelector.addEventListener('change', function () {
        saveTheme(themeSelector.value);
      });
    }

    if (window.matchMedia) {
      var mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      var onSystemThemeChange = function () {
        var currentMode = 'system';
        try {
          currentMode = localStorage.getItem(THEME_STORAGE_KEY) || 'system';
        } catch (err) {
          currentMode = 'system';
        }
        if (currentMode === 'system') {
          applyTheme('system');
        }
      };

      if (typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', onSystemThemeChange);
      } else if (typeof mediaQuery.addListener === 'function') {
        mediaQuery.addListener(onSystemThemeChange);
      }
    }
  }

  function syncHeaderHeights() {
    if (!topNavbar || !mainNavbar) {
      return;
    }
    var topHeight = topNavbar.offsetHeight;
    var mainHeight = mainNavbar.offsetHeight;
    var totalHeight = topHeight + mainHeight;

    document.documentElement.style.setProperty('--top-nav-height', topHeight + 'px');
    document.documentElement.style.setProperty('--main-nav-height', mainHeight + 'px');
    document.documentElement.style.setProperty('--header-height', totalHeight + 'px');
  }

  function initScrollNavbar() {
    if (!siteHeader) {
      return;
    }

    var lastScrollY = window.scrollY || window.pageYOffset || 0;
    var ticking = false;

    function updateNavbarVisibility() {
      var currentScrollY = Math.max(0, window.scrollY || window.pageYOffset || 0);
      var delta = currentScrollY - lastScrollY;

      if (currentScrollY <= 20) {
        siteHeader.classList.remove('top-hidden');
      } else if (delta > 4) {
        siteHeader.classList.add('top-hidden');
      } else if (delta < -4) {
        siteHeader.classList.remove('top-hidden');
      }

      lastScrollY = currentScrollY;
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(updateNavbarVisibility);
        ticking = true;
      }
    }, { passive: true });
  }

  function closeMobileMenu() {
    if (!mobileMenuToggle || !courseNavControls) {
      return;
    }
    courseNavControls.classList.remove('is-open');
    mobileMenuToggle.setAttribute('aria-expanded', 'false');
  }

  function initMobileMenu() {
    if (!mobileMenuToggle || !courseNavControls) {
      return;
    }

    mobileMenuToggle.addEventListener('click', function () {
      var isOpen = courseNavControls.classList.toggle('is-open');
      mobileMenuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    document.addEventListener('click', function (event) {
      if (!courseNavControls.classList.contains('is-open')) {
        return;
      }
      if (mainNavbar && !mainNavbar.contains(event.target)) {
        closeMobileMenu();
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        closeMobileMenu();
      }
    });
  }

  function initDaySelector() {
    if (!daySelector) {
      return;
    }

    daySelector.addEventListener('change', function () {
      var target = daySelector.value;
      if (target) {
        window.location.href = target;
      }
    });
  }

  function getCompletedDays() {
    try {
      var raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
      if (!raw) {
        return [];
      }
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }
      var valid = [];
      for (var i = 0; i < parsed.length; i += 1) {
        var num = Number(parsed[i]);
        if (Number.isInteger(num) && num >= 1 && num <= TOTAL_DAYS && valid.indexOf(num) === -1) {
          valid.push(num);
        }
      }
      valid.sort(function (a, b) {
        return a - b;
      });
      return valid;
    } catch (err) {
      return [];
    }
  }

  function saveCompletedDays(days) {
    try {
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(days));
    } catch (err) {
    }
  }

  function renderLessonCompletion() {
    if (!lessonCompleteBtn) {
      return;
    }
    var dayNum = Number(lessonCompleteBtn.getAttribute('data-day') || document.body.getAttribute('data-day'));
    if (!Number.isInteger(dayNum)) {
      return;
    }
    var completed = getCompletedDays();
    var isDone = completed.indexOf(dayNum) !== -1;

    lessonCompleteBtn.classList.toggle('is-done', isDone);
    lessonCompleteBtn.setAttribute('aria-pressed', isDone ? 'true' : 'false');
    lessonCompleteBtn.textContent = isDone ? 'Day ' + dayNum + ' Completed' : 'Mark Day ' + dayNum + ' Complete';
  }

  function initLessonCompletion() {
    if (!lessonCompleteBtn) {
      return;
    }

    renderLessonCompletion();

    lessonCompleteBtn.addEventListener('click', function () {
      var dayNum = Number(lessonCompleteBtn.getAttribute('data-day') || document.body.getAttribute('data-day'));
      if (!Number.isInteger(dayNum) || dayNum < 1 || dayNum > TOTAL_DAYS) {
        return;
      }
      var completed = getCompletedDays();
      var idx = completed.indexOf(dayNum);
      if (idx === -1) {
        completed.push(dayNum);
      } else {
        completed.splice(idx, 1);
      }
      completed.sort(function (a, b) {
        return a - b;
      });
      saveCompletedDays(completed);
      renderLessonCompletion();
    });
  }

  function initToc() {
    if (tocToggleBtn && tocList) {
      tocToggleBtn.addEventListener('click', function () {
        var collapsed = tocList.classList.toggle('is-collapsed');
        tocToggleBtn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
        tocToggleBtn.textContent = collapsed ? 'Show' : 'Hide';
      });
    }

    if (!tocList) {
      return;
    }

    var tocLinks = tocList.querySelectorAll('a[href^="#"]');
    var sections = [];
    for (var i = 0; i < tocLinks.length; i += 1) {
      var id = tocLinks[i].getAttribute('href').slice(1);
      var el = document.getElementById(id);
      if (el) {
        sections.push({ el: el, link: tocLinks[i] });
      }
    }

    if (!sections.length) {
      return;
    }

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        for (var j = 0; j < entries.length; j += 1) {
          if (entries[j].isIntersecting) {
            for (var k = 0; k < sections.length; k += 1) {
              sections[k].link.classList.toggle('active', sections[k].el === entries[j].target);
            }
          }
        }
      }, {
        rootMargin: '-20% 0px -65% 0px',
        threshold: 0
      });

      for (var m = 0; m < sections.length; m += 1) {
        observer.observe(sections[m].el);
      }
    }
  }

  function copyTextFallback(text) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    var ok = false;
    try {
      ok = document.execCommand('copy');
    } catch (err) {
      ok = false;
    }
    document.body.removeChild(textarea);
    return ok;
  }

  function initCopyButtons() {
    var copyButtons = document.querySelectorAll('.copy-code-btn');
    for (var i = 0; i < copyButtons.length; i += 1) {
      copyButtons[i].addEventListener('click', function (event) {
        var btn = event.currentTarget;
        var card = btn.closest('.code-card');
        if (!card) {
          return;
        }
        var codeEl = card.querySelector('pre code') || card.querySelector('pre');
        if (!codeEl) {
          return;
        }
        var text = codeEl.textContent || '';

        var markCopied = function () {
          btn.textContent = 'Copied';
          btn.classList.add('is-copied');
          window.setTimeout(function () {
            btn.textContent = 'Copy';
            btn.classList.remove('is-copied');
          }, 1800);
        };

        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
          navigator.clipboard.writeText(text).then(markCopied, function () {
            if (copyTextFallback(text)) {
              markCopied();
            }
          });
        } else if (copyTextFallback(text)) {
          markCopied();
        }
      });
    }
  }

  function initQuiz() {
    if (!quizForm) {
      return;
    }

    var questions = quizForm.querySelectorAll('.quiz-question');

    quizForm.addEventListener('submit', function (event) {
      event.preventDefault();
      var score = 0;
      var total = questions.length;
      var unanswered = 0;

      for (var i = 0; i < total; i += 1) {
        var qEl = questions[i];
        var correctAnswer = qEl.getAttribute('data-answer');
        var explanation = qEl.getAttribute('data-explanation') || '';
        var feedbackEl = qEl.querySelector('.quiz-feedback');
        var selected = qEl.querySelector('input[type="radio"]:checked');

        qEl.classList.remove('is-correct', 'is-incorrect');
        if (feedbackEl) {
          feedbackEl.classList.remove('is-correct', 'is-incorrect');
        }

        if (!selected) {
          unanswered += 1;
          qEl.classList.add('is-incorrect');
          if (feedbackEl) {
            feedbackEl.classList.add('is-incorrect');
            feedbackEl.textContent = 'No option selected. Correct answer: ' + correctAnswer.toUpperCase() + '. ' + explanation;
          }
        } else if (selected.value === correctAnswer) {
          score += 1;
          qEl.classList.add('is-correct');
          if (feedbackEl) {
            feedbackEl.classList.add('is-correct');
            feedbackEl.textContent = 'Correct. ' + explanation;
          }
        } else {
          qEl.classList.add('is-incorrect');
          if (feedbackEl) {
            feedbackEl.classList.add('is-incorrect');
            feedbackEl.textContent = 'Incorrect. Correct answer: ' + correctAnswer.toUpperCase() + '. ' + explanation;
          }
        }
      }

      if (quizResultBanner) {
        var pct = total > 0 ? Math.round((score / total) * 100) : 0;
        var summary = 'Score: ' + score + ' / ' + total + ' (' + pct + '%)';
        if (unanswered > 0) {
          summary += ' — ' + unanswered + ' question(s) left unanswered.';
        } else if (pct >= 80) {
          summary += ' — Strong grasp of Day 3 performance optimization concepts.';
        } else {
          summary += ' — Review the explanations above and retry to reinforce weak areas.';
        }
        quizResultBanner.textContent = summary;
        quizResultBanner.hidden = false;
      }
    });

    if (quizRetryBtn) {
      quizRetryBtn.addEventListener('click', function () {
        var radios = quizForm.querySelectorAll('input[type="radio"]');
        for (var i = 0; i < radios.length; i += 1) {
          radios[i].checked = false;
        }
        for (var j = 0; j < questions.length; j += 1) {
          questions[j].classList.remove('is-correct', 'is-incorrect');
          var fb = questions[j].querySelector('.quiz-feedback');
          if (fb) {
            fb.classList.remove('is-correct', 'is-incorrect');
            fb.textContent = '';
          }
        }
        if (quizResultBanner) {
          quizResultBanner.hidden = true;
          quizResultBanner.textContent = '';
        }
      });
    }
  }

  function initAccordions() {
    var triggers = document.querySelectorAll('.accordion-trigger');
    for (var i = 0; i < triggers.length; i += 1) {
      triggers[i].addEventListener('click', function (event) {
        var trigger = event.currentTarget;
        var isExpanded = trigger.getAttribute('aria-expanded') === 'true';
        var nextState = !isExpanded;
        var panel = trigger.nextElementSibling;
        var icon = trigger.querySelector('.accordion-icon');

        trigger.setAttribute('aria-expanded', nextState ? 'true' : 'false');
        if (panel) {
          panel.hidden = !nextState;
        }
        if (icon) {
          icon.textContent = nextState ? '-' : '+';
        }
      });
    }
  }

  function initFooterYear() {
    if (footerYearEl) {
      footerYearEl.textContent = String(new Date().getFullYear());
    }
  }

  window.addEventListener('storage', function (event) {
    if (event.key === THEME_STORAGE_KEY) {
      loadTheme();
    }
    if (event.key === PROGRESS_STORAGE_KEY) {
      renderLessonCompletion();
    }
  });

  window.addEventListener('resize', syncHeaderHeights);
  window.addEventListener('orientationchange', syncHeaderHeights);

  syncHeaderHeights();
  initThemeControls();
  initScrollNavbar();
  initMobileMenu();
  initDaySelector();
  initLessonCompletion();
  initToc();
  initCopyButtons();
  initQuiz();
  initAccordions();
  initFooterYear();
})();
