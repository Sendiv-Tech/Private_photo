/* =========================================================
   PRIVATE VAULT — Shared interactions
   Each block guards itself, so this file is safe to include
   on every page regardless of which elements are present.
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- simple page nav helper ---------- */
  window.go = (href) => { window.location.href = href; };

  /* ---------- floating heart particles (landing) ---------- */
  const particleField = document.querySelector('.particles');
  if (particleField) {
    const COUNT = 16;
    for (let i = 0; i < COUNT; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const size = 8 + Math.random() * 14;
      p.style.left = `${Math.random() * 100}%`;
      p.style.setProperty('--drift', `${(Math.random() - 0.5) * 120}px`);
      p.style.animationDuration = `${14 + Math.random() * 12}s`;
      p.style.animationDelay = `${Math.random() * 16}s`;
      p.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${Math.random() > 0.5 ? 'var(--c-bloom-soft)' : 'var(--c-dusk-soft)'}">
        <path d="M12 21s-7.5-4.6-10.2-9.3C-0.4 7.8 1.6 4 5.4 4c2.1 0 3.6 1.1 4.6 2.7C11 5.1 12.5 4 14.6 4c3.8 0 5.8 3.8 3.6 7.7C19.5 16.4 12 21 12 21z"/>
      </svg>`;
      particleField.appendChild(p);
    }
  }

  /* ---------- password show/hide toggles ---------- */
  document.querySelectorAll('.toggle-vis').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      if (!input) return;
      const isPw = input.type === 'password';
      input.type = isPw ? 'text' : 'password';
      btn.textContent = isPw ? 'Hide' : 'Show';
    });
  });

  /* ---------- form validation (signup / login) ---------- */
  document.querySelectorAll('form[data-validate]').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;
      form.querySelectorAll('[required]').forEach(input => {
        const field = input.closest('.field');
        if (!field) return;
        if (!input.value.trim()) {
          field.classList.add('error');
          valid = false;
        } else {
          field.classList.remove('error');
        }
      });
      const pw = form.querySelector('#password');
      const cpw = form.querySelector('#confirmPassword');
      if (pw && cpw && cpw.value && pw.value !== cpw.value) {
        cpw.closest('.field').classList.add('error');
        const msg = cpw.closest('.field').querySelector('.field-error-msg');
        if (msg) msg.textContent = "Passwords don't match";
        valid = false;
      }
      if (valid) {
        const dest = form.dataset.validate;
        showToast('Looking good — redirecting…');
        setTimeout(() => window.go(dest), 700);
      } else {
        form.classList.add('shake-once');
        setTimeout(() => form.classList.remove('shake-once'), 400);
      }
    });
  });

  /* ---------- OTP boxes ---------- */
  const otpBoxes = document.querySelectorAll('.otp-box');
  if (otpBoxes.length) {
    otpBoxes[0].focus();
    otpBoxes.forEach((box, i) => {
      box.addEventListener('input', () => {
        box.value = box.value.replace(/[^0-9]/g, '').slice(-1);
        if (box.value) {
          box.classList.add('filled');
          if (otpBoxes[i + 1]) otpBoxes[i + 1].focus();
        } else {
          box.classList.remove('filled');
        }
        checkOtpComplete();
      });
      box.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !box.value && otpBoxes[i - 1]) {
          otpBoxes[i - 1].focus();
        }
      });
      box.addEventListener('paste', (e) => {
        e.preventDefault();
        const digits = (e.clipboardData.getData('text') || '').replace(/[^0-9]/g, '').split('');
        otpBoxes.forEach((b, idx) => {
          b.value = digits[idx] || '';
          b.classList.toggle('filled', !!digits[idx]);
        });
        checkOtpComplete();
      });
    });
    function checkOtpComplete() {
      const complete = [...otpBoxes].every(b => b.value.length === 1);
      const verifyBtn = document.getElementById('verifyBtn');
      if (verifyBtn) verifyBtn.disabled = !complete;
    }
    const verifyBtn = document.getElementById('verifyBtn');
    if (verifyBtn) {
      verifyBtn.addEventListener('click', () => {
        const complete = [...otpBoxes].every(b => b.value.length === 1);
        if (!complete) return;
        showToast('Email verified');
        setTimeout(() => window.go('dashboard.html'), 700);
      });
    }
    const resend = document.getElementById('resendOtp');
    if (resend) {
      resend.addEventListener('click', (e) => {
        e.preventDefault();
        showToast('A new code is on its way');
      });
    }
  }

  /* ---------- PIN keypad (lock screen) ---------- */
  const pinDotsWrap = document.querySelector('.pin-dots');
  if (pinDotsWrap) {
    const dots = [...pinDotsWrap.querySelectorAll('.pin-dot')];
    const CORRECT = '2468'; // demo PIN
    let entered = '';

    document.querySelectorAll('.key[data-digit]').forEach(key => {
      key.addEventListener('click', () => {
        if (entered.length >= dots.length) return;
        entered += key.dataset.digit;
        renderDots();
        if (entered.length === dots.length) {
          setTimeout(checkPin, 250);
        }
      });
    });
    const delKey = document.querySelector('.key[data-action="delete"]');
    if (delKey) delKey.addEventListener('click', () => {
      entered = entered.slice(0, -1);
      renderDots();
    });

    function renderDots() {
      dots.forEach((d, i) => d.classList.toggle('filled', i < entered.length));
    }
    function checkPin() {
      if (entered === CORRECT) {
        pinDotsWrap.classList.add('success');
        const mark = document.querySelector('.brand-mark');
        if (mark) mark.classList.add('unlocked');
        showToast('Vault unlocked');
        setTimeout(() => window.go('dashboard.html'), 650);
      } else {
        pinDotsWrap.classList.add('shake');
        setTimeout(() => {
          pinDotsWrap.classList.remove('shake');
          entered = '';
          renderDots();
        }, 450);
      }
    }
  }

  /* ---------- drag & drop upload ----------
     Real upload logic now lives in upload-supabase.js (upload.html only),
     since it talks to Supabase and doesn't belong in the shared script. */

  const modal = document.getElementById('viewerModal');
  if (modal) {
    const frame = modal.querySelector('.viewer-frame');
    const closeBtn = modal.querySelector('.modal-close');
    document.querySelectorAll('[data-open-viewer]').forEach(card => {
      card.addEventListener('click', () => {
        const bg = card.dataset.openViewer;
        if (bg && frame) frame.style.backgroundImage = bg.startsWith('linear-gradient') ? bg : `url(${bg})`;
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
      });
    });
    const shut = () => { modal.classList.remove('open'); document.body.style.overflow = ''; };
    if (closeBtn) closeBtn.addEventListener('click', shut);
    modal.addEventListener('click', (e) => { if (e.target === modal) shut(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') shut(); });

    modal.querySelectorAll('.icon-btn[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        const messages = {
          lock: 'Photo locked with extra protection',
          download: 'Download started',
          delete: 'Moved to trash',
          share: 'Share link copied'
        };
        showToast(messages[action] || 'Done');
        if (action === 'delete') shut();
      });
    });
  }

  /* ---------- toast helper ---------- */
  window.showToast = (msg) => {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      toast.innerHTML = `<span class="dot"></span><span class="toast-msg"></span>`;
      document.body.appendChild(toast);
    }
    toast.querySelector('.toast-msg').textContent = msg;
    toast.classList.add('show');
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  };

  /* ---------- inactivity -> lock screen (dashboard/upload only) ---------- */
  if (document.body.dataset.lockOnIdle) {
    let idleTimer;
    const resetIdle = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => window.go('lock.html'), 60000);
    };
    ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(evt =>
      window.addEventListener(evt, resetIdle, { passive: true })
    );
    resetIdle();
  }

});
