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

  var progressPercentageEl = document.getElementById('progress-percentage');
  var progressBarEl = document.getElementById('overall-progress-bar');
  var progressFillEl = document.getElementById('overall-progress-fill');
  var progressSummaryTextEl = document.getElementById('progress-summary-text');
  var continueLearningBtn = document.getElementById('continue-learning-btn');
  var resetProgressBtn = document.getElementById('reset-progress-btn');
  var footerYearEl = document.getElementById('footer-year');

  var filterButtons = document.querySelectorAll('.filter-btn');
  var dayCards = document.querySelectorAll('.day-card');
  var completionButtons = document.querySelectorAll('.completion-toggle');

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

  function renderProgressUI() {
    var completed = getCompletedDays();
    var count = completed.length;
    var pct = Math.round((count / TOTAL_DAYS) * 100);

    if (progressPercentageEl) {
      progressPercentageEl.textContent = pct + '% Complete';
    }
    if (progressBarEl) {
      progressBarEl.setAttribute('aria-valuenow', String(pct));
    }
    if (progressFillEl) {
      progressFillEl.style.width = pct + '%';
    }
    if (progressSummaryTextEl) {
      progressSummaryTextEl.textContent = count + ' of ' + TOTAL_DAYS + ' days marked completed';
    }

    for (var i = 0; i < dayCards.length; i += 1) {
      var card = dayCards[i];
      var dayNum = Number(card.getAttribute('data-day'));
      var isDone = completed.indexOf(dayNum) !== -1;
      card.classList.toggle('is-completed', isDone);
    }

    for (var j = 0; j < completionButtons.length; j += 1) {
      var btn = completionButtons[j];
      var toggleDay = Number(btn.getAttribute('data-day-toggle'));
      var btnDone = completed.indexOf(toggleDay) !== -1;
      btn.classList.toggle('is-done', btnDone);
      btn.setAttribute('aria-pressed', btnDone ? 'true' : 'false');
      btn.textContent = btnDone ? 'Completed' : 'Mark Done';
    }

    if (continueLearningBtn) {
      var nextDay = 1;
      while (nextDay <= TOTAL_DAYS && completed.indexOf(nextDay) !== -1) {
        nextDay += 1;
      }

      if (count === 0) {
        continueLearningBtn.href = 'Day 1/index.html';
        continueLearningBtn.textContent = 'Start at Day 1';
      } else if (nextDay > TOTAL_DAYS) {
        continueLearningBtn.href = 'Day 18/index.html';
        continueLearningBtn.textContent = 'Review Day 18';
      } else {
        continueLearningBtn.href = 'Day ' + nextDay + '/index.html';
        continueLearningBtn.textContent = 'Continue: Day ' + nextDay;
      }
    }
  }

  function initProgressTracking() {
    for (var i = 0; i < completionButtons.length; i += 1) {
      completionButtons[i].addEventListener('click', function (event) {
        var dayNum = Number(event.currentTarget.getAttribute('data-day-toggle'));
        if (!Number.isInteger(dayNum) || dayNum < 1 || dayNum > TOTAL_DAYS) {
          return;
        }
        var completed = getCompletedDays();
        var existingIndex = completed.indexOf(dayNum);
        if (existingIndex === -1) {
          completed.push(dayNum);
        } else {
          completed.splice(existingIndex, 1);
        }
        completed.sort(function (a, b) {
          return a - b;
        });
        saveCompletedDays(completed);
        renderProgressUI();
      });
    }

    if (resetProgressBtn) {
      resetProgressBtn.addEventListener('click', function () {
        saveCompletedDays([]);
        renderProgressUI();
      });
    }

    renderProgressUI();
  }

  function initRoadmapFilters() {
    if (!filterButtons.length || !dayCards.length) {
      return;
    }

    for (var i = 0; i < filterButtons.length; i += 1) {
      filterButtons[i].addEventListener('click', function (event) {
        var activeBtn = event.currentTarget;
        var filterValue = activeBtn.getAttribute('data-filter') || 'all';

        for (var j = 0; j < filterButtons.length; j += 1) {
          filterButtons[j].classList.remove('active');
        }
        activeBtn.classList.add('active');

        for (var k = 0; k < dayCards.length; k += 1) {
          var card = dayCards[k];
          var category = card.getAttribute('data-category');
          var shouldShow = filterValue === 'all' || category === filterValue;
          card.classList.toggle('is-hidden', !shouldShow);
        }
      });
    }
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
      renderProgressUI();
    }
  });

  window.addEventListener('resize', syncHeaderHeights);
  window.addEventListener('orientationchange', syncHeaderHeights);

  syncHeaderHeights();
  initThemeControls();
  initScrollNavbar();
  initMobileMenu();
  initDaySelector();
  initProgressTracking();
  initRoadmapFilters();
  initFooterYear();
})();