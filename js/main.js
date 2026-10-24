(() => {
  const nav = document.querySelector('.header__nav');
  const burger = document.querySelector('.burger');
  const overlay = document.querySelector('.overlay');
  const mobile = window.matchMedia('(max-width: 900px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const updateFollow = () => burger.classList.toggle('burger--follow', window.scrollY > 0 && burger.getAttribute('aria-expanded') !== 'true');
  function setMenu(open, restoreFocus = false) {
    open = mobile.matches && open;
    nav.hidden = mobile.matches && !open;
    nav.classList.toggle('header__nav--open', open);
    overlay.classList.toggle('overlay--show', open);
    burger.classList.toggle('burger--active', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    document.body.style.overflow = open ? 'hidden' : '';
    updateFollow();
    if (restoreFocus) burger.focus();
  }
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  overlay.addEventListener('click', () => setMenu(false, true));
  mobile.addEventListener('change', () => setMenu(false));
  window.addEventListener('scroll', updateFollow, { passive: true });
  document.addEventListener('keydown', (event) => {
    if (burger.getAttribute('aria-expanded') !== 'true') return;
    if (event.key === 'Escape') setMenu(false, true);
    if (event.key === 'Tab') {
      const items = [burger, ...nav.querySelectorAll('a[href]')];
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || !items.includes(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const target = document.getElementById(link.hash.slice(1));
      if (!target) return;
      event.preventDefault();
      const wasOpen = burger.getAttribute('aria-expanded') === 'true';
      setMenu(false);
      target.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start' });
      if (wasOpen) { target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); }
    });
  });
  setMenu(false);
  if (window.Fancybox) window.Fancybox.bind('[data-fancybox]', {});
  const phone = document.getElementById('phone');
  if (phone && window.IMask) window.IMask(phone, { mask: '+{7}(000)000-00-00', lazy: true });
  const validatePhone = () => {
    const digits = phone.value.replace(/\D/g, '');
    phone.setCustomValidity(/^[78]\d{10}$/.test(digits) ? '' : 'Введите полный номер телефона с кодом +7.');
  };
  phone.addEventListener('input', validatePhone);
  const form = document.querySelector('.form__inner');
  form.addEventListener('submit', async (event) => {
    validatePhone();
    event.preventDefault();
    if (!form.reportValidity()) return;
    const button = form.querySelector('button[type="submit"]');
    const status = form.querySelector('.form__status');
    button.disabled = true;
    form.setAttribute('aria-busy', 'true');
    status.hidden = true;
    try {
      const response = await fetch(form.action, { method: 'POST', body: new FormData(form), signal: AbortSignal.timeout(25000) });
      if (response.redirected && response.ok && new URL(response.url).pathname.endsWith('/thank-you.html')) {
        window.location.assign(response.url);
        return;
      }
      status.textContent = response.ok ? 'Не удалось подтвердить отправку заявки. Позвоните нам.' : await response.text();
    } catch {
      status.textContent = 'Не удалось подтвердить отправку. Проверьте соединение. Перед повторной попыткой подождите минуту или позвоните нам.';
    } finally {
      button.disabled = false;
      form.removeAttribute('aria-busy');
      status.hidden = false;
    }
  });
})();
