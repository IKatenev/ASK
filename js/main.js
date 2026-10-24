(() => {
  'use strict';
  document.documentElement.classList.add('js');
  const nav = document.querySelector('.header__nav');
  const burger = document.querySelector('.burger');
  const overlay = document.querySelector('.overlay');
  const mobile = matchMedia('(max-width: 900px)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const background = document.querySelectorAll('main, footer, .hero, .hero-strip, .header__top .logo, .skip-link');
  function setMenu(open, restoreFocus = false) {
    open = mobile.matches && open;
    nav.inert = mobile.matches && !open;
    if (mobile.matches) nav.setAttribute('aria-hidden', String(!open));
    else nav.removeAttribute('aria-hidden');
    nav.classList.toggle('header__nav--open', open);
    overlay.classList.toggle('overlay--show', open);
    burger.classList.toggle('burger--active', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    background.forEach(el => { el.inert = open; });
    document.body.style.overflow = open ? 'hidden' : '';
    if (restoreFocus) burger.focus({ preventScroll: true });
  }
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  overlay.addEventListener('click', () => setMenu(false, true));
  mobile.addEventListener('change', () => setMenu(false));
  document.addEventListener('keydown', event => {
    if (burger.getAttribute('aria-expanded') !== 'true') return;
    if (event.key === 'Escape') setMenu(false, true);
    if (event.key === 'Tab') {
      const items = [burger, ...nav.querySelectorAll('a[href]')];
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || !items.includes(document.activeElement))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    }
  });
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      const target = document.getElementById(link.hash.slice(1));
      if (!target) return;
      event.preventDefault();
      setMenu(false);
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      target.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start' });
      history.replaceState(null, '', link.hash);
    });
  });
  setMenu(false);

  // Keep native details/summary semantics and a no-JavaScript fallback.
  document.querySelectorAll('.faq details').forEach(details => {
    const summary = details.querySelector('summary');
    const panel = details.querySelector('.accordion-panel');
    let animation;
    let expanded = details.open;
    summary.addEventListener('click', event => {
      event.preventDefault();
      if (!animation) expanded = details.open;
      expanded = !expanded;
      const start = details.getBoundingClientRect().height;
      if (animation) animation.cancel();
      if (reducedMotion.matches) { animation = null; details.open = expanded; details.style.overflow = ''; return; }
      details.open = true;
      const end = expanded ? details.getBoundingClientRect().height : summary.getBoundingClientRect().height + 1;
      details.style.overflow = 'hidden';
      animation = details.animate([{ height: start + 'px' }, { height: end + 'px' }], { duration: 200, easing: 'cubic-bezier(.2,.65,.3,1)' });
      animation.onfinish = () => { details.open = expanded; details.style.overflow = ''; animation = null; };
    });
  });

  const dialog = document.querySelector('.video-dialog');
  const video = dialog.querySelector('video');
  let videoTrigger;
  document.querySelectorAll('[data-video]').forEach(link => link.addEventListener('click', event => {
    if (!dialog.showModal) return; // The original MP4 link remains a fallback.
    event.preventDefault();
    videoTrigger = link;
    if (!video.getAttribute('src')) video.src = link.href;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    dialog.querySelector('.video-close').focus();
  }));
  dialog.querySelector('.video-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const box = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => { document.body.style.overflow = ''; video.pause(); videoTrigger?.focus({ preventScroll: true }); });

  const form = document.querySelector('.form__inner');
  const phone = document.getElementById('phone');
  const status = form.querySelector('.form__status');
  // Load the editing mask only when it is useful, never on initial page load.
  phone.addEventListener('focus', () => {
    const script = document.createElement('script');
    script.src = 'js/vendor/imask.min.js';
    script.onload = () => { if (window.IMask) window.IMask(phone, { mask: '+{7}(000)000-00-00', lazy: true }); };
    document.head.append(script);
  }, { once: true });
  const validatePhone = () => phone.setCustomValidity(/^[78]\d{10}$/.test(phone.value.replace(/\D/g, '')) ? '' : 'Введите полный номер телефона с кодом +7.');
  phone.addEventListener('input', validatePhone);
  const requestText = () => `Здравствуйте! Хочу обсудить установку АСК «Луч».\n\nИмя: ${form.elements.user_name.value.trim()}\nEmail: ${form.elements.user_email.value.trim()}\nТелефон: ${phone.value.trim()}`;
  const showStatus = message => { status.hidden = false; status.textContent = message; };
  form.addEventListener('submit', event => {
    event.preventDefault(); validatePhone();
    if (!form.reportValidity()) return;
    showStatus('Откроется почтовое приложение. Проверьте письмо и отправьте его. Если приложение не настроено, скопируйте заявку и напишите нам удобным способом.');
    location.href = 'mailto:info@luch-kino.ru?subject=' + encodeURIComponent('Установка АСК Луч') + '&body=' + encodeURIComponent(requestText());
  });
  form.querySelector('.copy-request').addEventListener('click', async () => {
    validatePhone(); if (!form.reportValidity()) return;
    try {
      await navigator.clipboard.writeText(requestText());
      showStatus('Заявка скопирована. Вставьте её в письмо на info@luch-kino.ru или в сообщение Telegram.');
    } catch {
      const draft = document.createElement('textarea');
      draft.className = 'request-draft'; draft.readOnly = true; draft.value = requestText();
      draft.setAttribute('aria-label', 'Текст заявки для ручного копирования');
      status.replaceChildren(document.createTextNode('Выделите и скопируйте текст заявки: '), draft);
      status.hidden = false; draft.focus(); draft.select();
    }
  });
  form.hidden = false;
})();
