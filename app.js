/* ==========================================================================
   zamm.my.id - app.js
   Interactive UI Controller: Navbar, Tabs, Code Snippet, 3D Controls
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initLanguageTabs();
  initCodeCopy();
  initAnimalControls();
  initScrollSpy();
});

/* ==========================================================================
   1. Mobile Navigation Drawer
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

  // Close when clicking on any mobile nav link
  drawer.querySelectorAll('.drawer-link').forEach(link => {
    link.addEventListener('click', closeDrawer);
  });

  // Close on Escape key (R-32)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) {
      closeDrawer();
      burger.focus();
    }
  });
}

/* ==========================================================================
   2. Interactive Language Code Tabs
   ========================================================================== */
function initLanguageTabs() {
  const tabs = document.querySelectorAll('.code-tab');
  const panels = {
    html: document.getElementById('codePanelHtml'),
    css: document.getElementById('codePanelCss'),
    js: document.getElementById('codePanelJs')
  };

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const selected = tab.dataset.tab;

      // Update Tab Buttons
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
   3. Copy Code Button with Toast Feedback
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
   4. 3D Forest Animal Controller Buttons
   ========================================================================== */
function initAnimalControls() {
  const buttons = document.querySelectorAll('.animal-btn');
  const animToggleBtn = document.getElementById('animToggleBtn');
  const animIcon = document.getElementById('animIcon');
  const animText = document.getElementById('animText');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const animal = btn.dataset.animal;
      if (window.forest3D) {
        window.forest3D.setFocus(animal);
      }
    });
  });

  if (animToggleBtn && animIcon && animText) {
    animToggleBtn.addEventListener('click', () => {
      if (window.forest3D) {
        const isRunning = window.forest3D.toggleAnimation();
        if (isRunning) {
          animIcon.textContent = '⏸️';
          animText.textContent = 'Animasi Aktif';
        } else {
          animIcon.textContent = '▶️';
          animText.textContent = 'Jeda';
        }
      }
    });
  }
}

/* ==========================================================================
   5. Active Navbar Link Highlight on Scroll
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
