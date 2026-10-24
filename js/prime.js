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

  const dialog = document.querySelector('#project-gallery');
  if (!dialog) return;
  const img = dialog.querySelector('#gallery-image');
  const heading = dialog.querySelector('#gallery-title');
  const counter = dialog.querySelector('#gallery-counter');
  const caption = dialog.querySelector('#gallery-caption');
  const thumbs = dialog.querySelector('#gallery-thumbs');
  const prev = dialog.querySelector('[data-gallery-prev]');
  const next = dialog.querySelector('[data-gallery-next]');
  const close = dialog.querySelector('[data-gallery-close]');
  let activeProject = null;
  let activeImage = 0;
  let lastTrigger = null;

  function renderImage() {
    if (!activeProject) return;
    const photos = activeProject.photos;
    activeImage = (activeImage + photos.length) % photos.length;
    const imgNumber = activeImage + 1;
    img.src = base + photos[activeImage];
    img.alt = activeProject.name + ', project photo ' + imgNumber;
    caption.textContent = activeProject.name;
    counter.textContent = imgNumber + ' / ' + photos.length;
    prev.hidden = photos.length < 2;
    next.hidden = photos.length < 2;
    thumbs.querySelectorAll('button').forEach((button, i) => {
      button.setAttribute('aria-current', String(i === activeImage));
    });
  }

  function openProject(projectId, trigger) {
    const project = projectList[projectId];
    if (!project || typeof dialog.showModal !== 'function') return;
    activeProject = project;
    activeImage = 0;
    lastTrigger = trigger;
    heading.textContent = project.name;
    thumbs.replaceChildren();
    project.photos.forEach((name, i) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', 'View photo ' + (i + 1));
      button.setAttribute('aria-current', String(i === 0));
      const thumb = document.createElement('img');
      thumb.src = base + name;
      thumb.alt = '';
      thumb.loading = 'lazy';
      button.appendChild(thumb);
      button.addEventListener('click', () => { activeImage = i; renderImage(); });
      thumbs.appendChild(button);
    });
    renderImage();
    dialog.showModal();
    close.focus();
  }

  document.querySelectorAll('[data-project]').forEach(button => {
    button.addEventListener('click', event => {
      if (typeof dialog.showModal === 'function') {
        event.preventDefault();
        openProject(button.dataset.project, button);
      }
    });
  });
  prev.addEventListener('click', () => { activeImage -= 1; renderImage(); });
  next.addEventListener('click', () => { activeImage += 1; renderImage(); });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => { if (lastTrigger) lastTrigger.focus(); });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight') { event.preventDefault(); activeImage++; renderImage(); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); activeImage--; renderImage(); }
  });
})();