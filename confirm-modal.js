// ============================================================
// Ranking Pro — Overlay dialogs (alert · confirm · glass)
// Visual canônico: overlay-system.css
// ============================================================

(function () {
  'use strict';

  function splitOverlayTitle(title) {
    const str = String(title || '').trim();
    const parts = str.split(/\s+/);
    if (parts[0] && /[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/u.test(parts[0])) {
      const text = parts.slice(1).join(' ').trim();
      return { icon: parts[0], text: text || str };
    }
    return { icon: '🏆', text: str };
  }

  function inferTone(title, tone) {
    if (tone) return tone;
    const t = String(title || '');
    if (/✅|Sucesso/i.test(t)) return 'success';
    if (/❌|Erro/i.test(t)) return 'error';
    if (/⚠️|Atenção|Limite/i.test(t)) return 'warning';
    return null;
  }

  function openOverlayDialog(options) {
    return new Promise((resolve) => {
      const {
        title = 'Confirmar',
        message = '',
        confirmText = 'Confirmar',
        cancelText = 'Cancelar',
        danger = false,
        confirmOnly = false,
        debug = null,
        tone: toneOpt = null
      } = options || {};

      const tone = inferTone(title, toneOpt);
      const split = splitOverlayTitle(title);

      const overlay = document.createElement('div');
      overlay.className = 'rp-overlay rp-overlay--dialog loading-overlay loading-overlay--dialog';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-labelledby', 'rpOverlayTitle');

      const panel = document.createElement('div');
      panel.className = 'rp-overlay-panel loading-box loading-box--dialog confirm-box';
      if (tone === 'success') panel.classList.add('is-success');
      if (tone === 'error') panel.classList.add('is-error');
      if (tone === 'warning') panel.classList.add('is-warning');

      const icon = document.createElement('div');
      icon.className = 'rp-overlay-icon loading-logo';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = split.icon;

      const titleEl = document.createElement('h3');
      titleEl.className = 'rp-overlay-title loading-text';
      titleEl.id = 'rpOverlayTitle';
      titleEl.textContent = split.text || title;

      panel.appendChild(icon);
      panel.appendChild(titleEl);

      if (message) {
        const msg = document.createElement('p');
        msg.className = 'rp-overlay-message loading-subtext confirm-message';
        if (String(message).includes('<pre')) msg.innerHTML = message;
        else msg.textContent = message;
        panel.appendChild(msg);
      } else {
        const spacer = document.createElement('div');
        spacer.className = 'rp-overlay-spacer loading-dialog-spacer';
        spacer.setAttribute('aria-hidden', 'true');
        panel.appendChild(spacer);
      }

      if (debug) {
        const pre = document.createElement('pre');
        pre.className = 'rp-overlay-debug loading-dialog-debug confirm-debug';
        pre.textContent = debug;
        panel.appendChild(pre);
      }

      const actions = document.createElement('div');
      actions.className = 'rp-overlay-actions loading-dialog-actions confirm-actions';

      let focusTarget = null;

      if (confirmOnly) {
        const okBtn = document.createElement('button');
        okBtn.type = 'button';
        okBtn.className = 'btn btn-primary btn-ok';
        okBtn.textContent = confirmText || 'OK';
        okBtn.dataset.action = 'confirm';
        actions.appendChild(okBtn);
        focusTarget = okBtn;
      } else {
        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'btn btn-outline btn-cancel';
        cancelBtn.textContent = cancelText;
        cancelBtn.dataset.action = 'cancel';
        const confirmBtn = document.createElement('button');
        confirmBtn.type = 'button';
        confirmBtn.className = danger ? 'btn btn-danger btn-confirm danger' : 'btn btn-primary btn-confirm';
        confirmBtn.textContent = confirmText;
        confirmBtn.dataset.action = 'confirm';
        actions.appendChild(cancelBtn);
        actions.appendChild(confirmBtn);
        focusTarget = confirmBtn;
      }

      panel.appendChild(actions);
      overlay.appendChild(panel);
      document.body.appendChild(overlay);

      if (focusTarget) setTimeout(() => focusTarget.focus(), 50);

      function close(result) {
        overlay.classList.add('closing');
        panel.classList.add('closing');
        setTimeout(() => {
          if (overlay.parentNode) overlay.remove();
          resolve(result);
        }, 250);
      }

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay && !confirmOnly) close(false);
      });

      actions.querySelector('[data-action="cancel"]')
        ?.addEventListener('click', () => close(false));
      actions.querySelector('[data-action="confirm"]')
        ?.addEventListener('click', () => close(true));

      const keyHandler = (e) => {
        if (e.key === 'Escape' && !confirmOnly) {
          close(false);
          document.removeEventListener('keydown', keyHandler);
        }
        if (e.key === 'Enter') {
          close(true);
          document.removeEventListener('keydown', keyHandler);
        }
      };
      document.addEventListener('keydown', keyHandler);
    });
  }

  function showConfirm(options) {
    return openOverlayDialog(options);
  }

  function showAlert(title, message, options) {
    const opts = options && typeof options === 'object' ? options : {};
    return openOverlayDialog({
      title,
      message,
      confirmOnly: true,
      confirmText: opts.confirmText || 'OK',
      debug: opts.debug || null,
      tone: opts.tone || null
    });
  }

  function showGlassConfirm(options) {
    return openOverlayDialog(options);
  }

  function showGlassAlert(title, message, options) {
    return showAlert(title, message, options);
  }

  window.showConfirm = showConfirm;
  window.showAlert = showAlert;
  window.showGlassConfirm = showGlassConfirm;
  window.showGlassAlert = showGlassAlert;
})();