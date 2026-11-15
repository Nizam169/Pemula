/* ==========================================================================
   zamm.my.id - app.js
   Interactive UI Controller:
   1. Real-time Jakarta Clock & Time-of-Day System (Pagi, Siang, Sore, Malam)
   2. 3D Forest Animal Controller & Interactive Movement (Rubah, Rusa, Burung Hantu, Kelinci)
   3. Anti-Slop Navbar & Accessible Mobile Drawer
   4. Programming Languages Code Showcase Tabs with Copy Feedback
   5. Smooth Scrollspy Navigation
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initJakartaTime();
  initAnimalControls();
  initLanguageTabs();
  initCodeCopy();
  initMobileNav();
  initScrollSpy();
});

/* ==========================================================================
   1. Real-Time Jakarta Clock & Time-of-Day Phase Engine (WIB: UTC+7)
   ========================================================================== */
let timeMode = 'auto'; // 'auto' | 'pagi' | 'siang' | 'sore' | 'malam'
let currentAutoPhase = 'malam';

function initJakartaTime() {
  const clockNav = document.getElementById('navJakartaClock');
  const clockNavPhase = document.getElementById('navClockPhase');
  const clockDrawer = document.getElementById('drawerJakartaClock');
  const clockDrawerPhase = document.getElementById('drawerClockPhase');
  const mainClock = document.getElementById('mainJakartaClock');
  const mainDate = document.getElementById('mainJakartaDate');
  const phaseTag = document.getElementById('currentPhaseTag');
  const phaseDesc = document.getElementById('currentPhaseDesc');
  const phasePills = document.querySelectorAll('.phase-pill');

  function updateClock() {
    const now = new Date();

    // Format current time in Jakarta timezone (Asia/Jakarta, UTC+7)
    const timeFormatter = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const dateFormatter = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const timeString = timeFormatter.format(now);
    const dateString = dateFormatter.format(now);

    // Calculate fractional hour in Jakarta time
    const parts = timeString.split(':').map(Number);
    const hour = parts[0] + parts[1] / 60;

    // Phase threshold:
    // Pagi:  05:00 - 10:59 WIB
    // Siang: 11:00 - 14:59 WIB
    // Sore:  15:00 - 18:29 WIB
    // Malam: 18:30 - 04:59 WIB
    let detectedPhase = 'malam';
    if (hour >= 5 && hour < 11) {
      detectedPhase = 'pagi';
    } else if (hour >= 11 && hour < 15) {
      detectedPhase = 'siang';
    } else if (hour >= 15 && hour < 18.5) {
      detectedPhase = 'sore';
    } else {
      detectedPhase = 'malam';
    }

    currentAutoPhase = detectedPhase;
    const activePhase = timeMode === 'auto' ? detectedPhase : timeMode;

    const phaseLabels = {
      pagi: 'Pagi Hari',
      siang: 'Siang Hari',
      sore: 'Sore Hari',
      malam: 'Malam Hari'
    };

    const phaseDescriptions = {
      pagi: 'Matahari terbit perlahan membasuh pepohonan cemara dengan kabut fajar yang sejuk.',
      siang: 'Pencahayaan terang benderang dari atas langit, seluruh fauna hutan aktif bergerak.',
      sore: 'Sinar keemasan golden hour menyinari dedaunan hutan sebelum senja berganti gelap.',
      malam: 'Suasana tenang bertabur kunang-kunang menyala dengan bulan terang di langit malam.'
    };

    // Update Navbar Widget
    if (clockNav) clockNav.textContent = `${timeString} WIB`;
    if (clockNavPhase) clockNavPhase.textContent = phaseLabels[activePhase];

    // Update Drawer Widget
    if (clockDrawer) clockDrawer.textContent = `${timeString} WIB`;
    if (clockDrawerPhase) clockDrawerPhase.textContent = phaseLabels[activePhase];

    // Update Main Section Widget
    if (mainClock) mainClock.textContent = timeString;
    if (mainDate) mainDate.textContent = `${dateString} : WIB (UTC+7)`;
    if (phaseTag) phaseTag.textContent = phaseLabels[activePhase];
    if (phaseDesc) phaseDesc.textContent = phaseDescriptions[activePhase];

    // Synchronize 3D Scene Lighting
    if (window.forest3D && typeof window.forest3D.setTimePhase === 'function') {
      window.forest3D.setTimePhase(activePhase);
    }
  }

  // Phase selection pill clicks
  phasePills.forEach(pill => {
    pill.addEventListener('click', () => {
      const selected = pill.dataset.phase;
      timeMode = selected;

      phasePills.forEach(p => {
        const isActive = p === pill;
        p.classList.toggle('active', isActive);
        p.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });

      updateClock();
    });
  });

  // Run immediately then tick every 1000ms
  updateClock();
  setInterval(updateClock, 1000);
}

/* ==========================================================================
   2. 3D Animal Controller & Interactive Movement
   ========================================================================== */
function initAnimalControls() {
  const animalSelectButtons = document.querySelectorAll('.animal-btn');
  const animToggleBtn = document.getElementById('animToggleBtn');
  const animIcon = document.getElementById('animIcon');
  const animText = document.getElementById('animText');

  // Movement Pad Buttons
  const btnForward = document.getElementById('btnMoveForward');
  const btnBackward = document.getElementById('btnMoveBackward');
  const btnTurnLeft = document.getElementById('btnRotateLeft');
  const btnTurnRight = document.getElementById('btnRotateRight');
  const btnJump = document.getElementById('btnJumpAnimal');
  const btnSpecial = document.getElementById('btnSpecialAction');
  const btnReset = document.getElementById('btnResetAnimal');

  // Animal Selection
  animalSelectButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const animal = btn.dataset.animal;
      if (window.forest3D) {
        window.forest3D.setFocus(animal);
      }
    });
  });

  // Movement Action Handlers
  if (btnForward) {
    btnForward.addEventListener('click', () => {
      if (window.forest3D) window.forest3D.moveForward();
    });
  }

  if (btnBackward) {
    btnBackward.addEventListener('click', () => {
      if (window.forest3D) window.forest3D.moveBackward();
    });
  }

  if (btnTurnLeft) {
    btnTurnLeft.addEventListener('click', () => {
      if (window.forest3D) window.forest3D.rotateLeft();
    });
  }

  if (btnTurnRight) {
    btnTurnRight.addEventListener('click', () => {
      if (window.forest3D) window.forest3D.rotateRight();
    });
  }

  if (btnJump) {
    btnJump.addEventListener('click', () => {
      if (window.forest3D) window.forest3D.jump();
    });
  }

  if (btnSpecial) {
    btnSpecial.addEventListener('click', () => {
      if (window.forest3D) window.forest3D.specialAction();
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (window.forest3D) window.forest3D.resetPosition();
    });
  }

  // Animation Pause / Resume for Accessibility (R-19 & R-39)
  if (animToggleBtn && animIcon && animText) {
    animToggleBtn.addEventListener('click', () => {
      if (window.forest3D) {
        const isRunning = window.forest3D.toggleAnimation();
        if (isRunning) {
          animIcon.textContent = '⏸';
          animText.textContent = 'Jeda';
          animToggleBtn.setAttribute('aria-label', 'Jeda animasi 3D');
        } else {
          animIcon.textContent = '▶';
          animText.textContent = 'Mulai';
          animToggleBtn.setAttribute('aria-label', 'Lanjutkan animasi 3D');
        }
      }
    });
  }
}

/* ==========================================================================
   3. Interactive Programming Languages Code Tabs
   ========================================================================== */
function initLanguageTabs() {
  const tabs = document.querySelectorAll('.code-tab');
  const panels = {
    html: document.getElementById('codePanelHtml'),
    css: document.getElementById('codePanelCss'),
    js: document.getElementById('codePanelJs'),
    python: document.getElementById('codePanelPython')
  };

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const selected = tab.dataset.tab;

      // Update Tab Button States
      tabs.forEach(t => {
        const isActive = t === tab;
        t.classList.toggle('active', isActive);
        t.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });

      // Update Code Panels
      Object.entries(panels).forEach(([key, panel]) => {
        if (panel) {
          panel.classList.toggle('active', key === selected);
        }
      });
    });
  });
}

/* ==========================================================================
   4. Copy Code Button with Accessible Toast Feedback
   ========================================================================== */
function initCodeCopy() {
  const copyBtn = document.getElementById('codeCopyBtn');
  const btnText = document.getElementById('copyBtnText');

  if (!copyBtn || !btnText) return;

  copyBtn.addEventListener('click', async () => {
    const activePanel = document.querySelector('.code-panel.active');
    if (!activePanel) return;

    const codeToCopy = activePanel.innerText;

    try {
      await navigator.clipboard.writeText(codeToCopy);
      btnText.textContent = 'Tersalin!';
      copyBtn.style.borderColor = 'var(--emerald-500)';
      copyBtn.style.color = 'var(--emerald-400)';

      setTimeout(() => {
        btnText.textContent = 'Salin Kode';
        copyBtn.style.borderColor = '';
        copyBtn.style.color = '';
      }, 2000);
    } catch (err) {
      btnText.textContent = 'Gagal Salin';
      setTimeout(() => {
        btnText.textContent = 'Salin Kode';
      }, 2000);
    }
  });
}

/* ==========================================================================
   5. Anti-Slop Mobile Navigation Drawer
   ========================================================================== */
function initMobileNav() {
  const burger = document.getElementById('burgerToggle');
  const drawer = document.getElementById('navDrawer');
  const closeBtn = document.getElementById('drawerClose');

  if (!burger || !drawer) return;

  function openDrawer() {
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    burger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  burger.addEventListener('click', () => {
    const isOpen = drawer.classList.contains('open');
    if (isOpen) closeDrawer();
    else openDrawer();
  });

  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);

  // Close when clicking any link inside the mobile drawer
  drawer.querySelectorAll('.drawer-link').forEach(link => {
    link.addEventListener('click', closeDrawer);
  });

  // Close on Escape key press (R-32 accessibility)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) {
      closeDrawer();
      burger.focus();
    }
  });
}

/* ==========================================================================
   6. Active Navbar Link Highlight on Scroll (ScrollSpy)
   ========================================================================== */
function initScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          const href = link.getAttribute('href');
          link.classList.toggle('active', href === `#${id}`);
        });
      }
    });
  }, {
    rootMargin: '-30% 0px -60% 0px'
  });

  sections.forEach(section => observer.observe(section));
}
