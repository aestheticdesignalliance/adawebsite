/* Prime Build: lightweight navigation, motion and accessible project galleries. */
(() => {
  'use strict';
  document.documentElement.classList.add('has-js');

  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#site-navigation');
  const updateHeader = () => header && header.classList.toggle('scrolled', window.scrollY > 25);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  const closeMenu = () => {
    if (!toggle || !nav) return;
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation menu');
    document.body.classList.remove('menu-open');
  };
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      nav.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
      document.body.classList.toggle('menu-open', open);
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
    window.addEventListener('resize', () => { if (window.innerWidth > 920) closeMenu(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        closeMenu();
        toggle.focus();
      }
    });
    document.addEventListener('click', e => {
      if (toggle.getAttribute('aria-expanded') === 'true' && !nav.contains(e.target) && !toggle.contains(e.target)) closeMenu();
    });
  }

  document.querySelectorAll('[data-current-year]').forEach(el => {
    el.textContent = String(new Date().getFullYear());
  });

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reducedMotion) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.09, rootMargin: '0px 0px 25px 0px' });
    revealItems.forEach(item => observer.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add('in-view'));
  }

  const base = 'assets/img/portfolio/residential/';
  const projectList = {
    'mccarter': { name: '777 McCarter Highway', photos: ['McCarter-4.png','McCarter-5.png','McCarter-6.png','McCarter-7.png','McCarter-8.png','McCarter-9.png','McCarter-10.png','McCarter-11.png'] },
    'cooper': { name: 'Cooper Avenue', photos: ['cooperave-1.png'] },
    'millbasin': { name: 'Brooklyn Mill Basin', photos: ['millbasin-1.png','millbasin-2.png','millbasin-3.png','millbasin-4.png','millbasin-5.png','millbasin-6.png','millbasin-7.png','millbasin-9.png','millbasin-11.png','millbasin-12.png'] },
    'bathroom': { name: 'Bathroom Toto', photos: ['bathroomtoto-1.png','bathroomtoto-2.png'] },
    'parkave': { name: 'Park Avenue', photos: ['parkave-1.png','parkave-2.png','parkave-3.png'] },
    'parkslope': { name: 'Park Slope', photos: ['parkslope-1.png','parkslope-2.png','parkslope-3.png'] },
    'soho': { name: 'SoHo', photos: ['soho-1.png','soho-2.png'] },
    'uppereast': { name: 'Upper East Side', photos: ['uppereast-1.png','uppereast-2.png','uppereast-3.png','uppereast-4.png','uppereast-5.png','uppereast-6.png','uppereast-7.png','uppereast-8.png'] },
    'upperwest': { name: 'Upper West Side', photos: ['upperwest-1.png','upperwest-2.png','upperwest-3.png','upperwest-4.png'] }
  };


  // Accessible collection filters: no third-party dependency, preserve deep links.
  const filterButtons = Array.from(document.querySelectorAll('[data-portfolio-filter]'));
  const projectCards = Array.from(document.querySelectorAll('.project-card[data-project]'));
  const countLabel = document.getElementById('portfolio-count');
  let activeFilter = 'all';

  function applyFilter(category) {
    activeFilter = category;
    let visibleCount = 0;
    projectCards.forEach(card => {
      const show = category === 'all' || card.dataset.category === category;
      card.hidden = !show;
      if (show) visibleCount++;
    });
    filterButtons.forEach(btn => {
      const active = btn.dataset.portfolioFilter === category;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
    if (countLabel) {
      countLabel.textContent = visibleCount + (visibleCount === 1 ? ' selected project' : ' selected projects');
    }
  }
  filterButtons.forEach(btn => btn.addEventListener('click', () => applyFilter(btn.dataset.portfolioFilter)));
  applyFilter('all');

  const dialog = document.querySelector('#project-gallery');
  if (!dialog) return;
  const img = dialog.querySelector('#gallery-image');
  const heading = dialog.querySelector('#gallery-title');
  const counter = dialog.querySelector('#gallery-counter');
  const caption = dialog.querySelector('#gallery-caption');
  const thumbs = dialog.querySelector('#gallery-thumbs');
  const description = dialog.querySelector('#gallery-description');
  const copyButton = dialog.querySelector('#gallery-share');
  const copyFeedback = dialog.querySelector('#gallery-link-feedback');
  const prev = dialog.querySelector('[data-gallery-prev]');
  const next = dialog.querySelector('[data-gallery-next]');
  const close = dialog.querySelector('[data-gallery-close]');
  let activeProject = null;
  let projectKey = null;
  let activeImage = 0;
  let lastTrigger = null;
  let openedByHash = false;

  const categoryLabels = {
    mccarter:'Development', bathroom:'Interiors', cooper:'Residential',
    millbasin:'Residential', parkave:'Residential', parkslope:'Residential',
    soho:'Residential', uppereast:'Residential', upperwest:'Residential'
  };
  const descriptions = {
    mccarter: 'Explore selected architectural and development project imagery.',
    bathroom: 'Explore selected bathroom detail and finish imagery.',
    millbasin: 'View selected residential interior photographs.',
    parkave: 'View selected residential interiors and finish details.',
    parkslope: 'View selected residential project photographs.',
    soho: 'View selected interior renovation photographs.',
    uppereast: 'Explore selected Upper East Side project imagery.',
    upperwest: 'Explore selected Upper West Side project imagery.',
    cooper: 'Explore selected Cooper Avenue project imagery.'
  };

  function renderImage() {
    if (!activeProject) return;
    const photos = activeProject.photos;
    activeImage = (activeImage + photos.length) % photos.length;
    const imgNumber = activeImage + 1;
    const filename = photos[activeImage];
    img.src = base + filename;
    img.alt = activeProject.name + ', photograph ' + imgNumber + ' of ' + photos.length;
    caption.textContent = activeProject.name + ' · ' + (categoryLabels[projectKey] || 'Project portfolio');
    counter.textContent = 'Photograph ' + imgNumber + ' of ' + photos.length;
    prev.hidden = photos.length < 2;
    next.hidden = photos.length < 2;
    thumbs.querySelectorAll('button').forEach((button, i) => {
      button.setAttribute('aria-current', String(i === activeImage));
    });
    const nextImage = photos[(activeImage + 1) % photos.length];
    if (nextImage && nextImage !== filename) {
      const preload = new Image();
      preload.src = base + nextImage;
    }
  }

  function openProject(id, trigger, fromLink) {
    const project = projectList[id];
    if (!project || typeof dialog.showModal !== 'function') return;
    if (dialog.open) dialog.close();
    projectKey = id;
    activeProject = project;
    activeImage = 0;
    lastTrigger = trigger || null;
    openedByHash = Boolean(fromLink);
    heading.textContent = project.name;
    description.textContent = descriptions[id] || 'Explore selected project photographs.';
    copyFeedback.textContent = '';
    thumbs.replaceChildren();
    project.photos.forEach((name, i) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', 'View photograph ' + (i + 1));
      button.setAttribute('aria-current', String(i === 0));
      const thumb = document.createElement('img');
      thumb.src = base + name;
      thumb.alt = '';
      thumb.loading = 'lazy';
      thumb.decoding = 'async';
      button.appendChild(thumb);
      button.addEventListener('click', () => {
        activeImage = i;
        renderImage();
      });
      thumbs.appendChild(button);
    });
    if (trigger && trigger.hidden) applyFilter('all');
    renderImage();
    dialog.showModal();
    close.focus();
    if (!fromLink && history.replaceState) {
      history.replaceState(null, '', window.location.pathname + window.location.search + '#project-' + id);
    }
  }

  projectCards.forEach(card => {
    card.addEventListener('click', event => {
      if (typeof dialog.showModal !== 'function') return;
      event.preventDefault();
      openProject(card.dataset.project, card, false);
    });
  });
  prev.addEventListener('click', () => { activeImage -= 1; renderImage(); });
  next.addEventListener('click', () => { activeImage += 1; renderImage(); });
  close.addEventListener('click', () => dialog.close());

  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    if (!openedByHash && window.location.hash.startsWith('#project-') && history.replaceState) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    if (lastTrigger) lastTrigger.focus({ preventScroll: true });
    activeProject = null;
    projectKey = null;
  });

  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight') {
      event.preventDefault(); activeImage += 1; renderImage();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault(); activeImage -= 1; renderImage();
    }
  });

  copyButton.addEventListener('click', async () => {
    if (!projectKey) return;
    const link = window.location.origin + window.location.pathname + '#project-' + projectKey;
    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(link);
      copyFeedback.textContent = 'Project link copied.';
    } catch (error) {
      copyFeedback.textContent = 'Copy this link: ' + link;
    }
  });

  function activateProjectFromLink() {
    const match = window.location.hash.match(/^#project-([a-z0-9_-]+)$/i);
    if (!match || !projectList[match[1]] || dialog.open) return;
    const trigger = projectCards.find(card => card.dataset.project === match[1]);
    if (trigger && trigger.hidden) applyFilter('all');
    openProject(match[1], trigger, true);
  }
  window.addEventListener('hashchange', activateProjectFromLink);
  activateProjectFromLink();
})();