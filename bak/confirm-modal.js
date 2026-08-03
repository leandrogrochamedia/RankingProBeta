// ============================================================
// PROOFLY - MODAL DE CONFIRMAÇÃO GLOBAL (com suporte a OK only)
// ============================================================

(function() {
  // CSS INJECT
  const style = document.createElement('style');
  style.textContent = `
    .confirm-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: confirmFadeIn 0.2s ease;
    }
    .confirm-overlay.closing {
      animation: confirmFadeOut 0.2s ease forwards;
    }
    .confirm-box {
      background: #ffffff;
      padding: 32px 28px 24px;
      border-radius: 20px;
      width: 360px;
      max-width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
      animation: confirmZoomIn 0.25s ease;
      text-align: center;
    }
    .confirm-box.closing {
      animation: confirmZoomOut 0.2s ease forwards;
    }
    .confirm-box h3 {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 8px 0;
    }
    .confirm-box .confirm-message {
      font-size: 15px;
      color: #475569;
      margin: 0 0 24px 0;
      line-height: 1.5;
    }
    .confirm-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
    }
    .confirm-actions button {
      padding: 10px 28px;
      border-radius: 999px;
      font-weight: 600;
      font-size: 14px;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
      min-width: 100px;
    }
    .confirm-actions .btn-cancel {
      background: #f1f5f9;
      color: #1e293b;
    }
    .confirm-actions .btn-cancel:hover {
      background: #e2e8f0;
    }
    .confirm-actions .btn-confirm {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff;
    }
    .confirm-actions .btn-confirm:hover {
      transform: scale(1.02);
      box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
    }
    .confirm-actions .btn-confirm.danger {
      background: linear-gradient(135deg, #ef4444, #dc2626);
    }
    .confirm-actions .btn-confirm.danger:hover {
      box-shadow: 0 4px 16px rgba(239, 68, 68, 0.3);
    }
    .confirm-actions .btn-ok {
      background: linear-gradient(135deg, #10b981, #059669);
      color: #fff;
      min-width: 120px;
    }
    .confirm-actions .btn-ok:hover {
      transform: scale(1.02);
      box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
    }

    @keyframes confirmFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes confirmFadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
    @keyframes confirmZoomIn {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    @keyframes confirmZoomOut {
      from { transform: scale(1); opacity: 1; }
      to { transform: scale(0.95); opacity: 0; }
    }
  `;
  document.head.appendChild(style);

  // ============================================================
  // FUNÇÃO PRINCIPAL
  // ============================================================
  function showConfirm(options) {
    return new Promise((resolve) => {
      const {
        title = 'Tem certeza?',
        message = 'Essa ação não pode ser desfeita.',
        confirmText = 'Confirmar',
        cancelText = 'Cancelar',
        danger = false,
        confirmOnly = false   // NOVO: se true, mostra apenas botão OK
      } = options;

      const overlay = document.createElement('div');
      overlay.className = 'confirm-overlay';

      const box = document.createElement('div');
      box.className = 'confirm-box';

      let actionsHtml = '';
      if (confirmOnly) {
        actionsHtml = `
          <div class="confirm-actions">
            <button class="btn-ok" data-action="confirm">OK</button>
          </div>
        `;
      } else {
        actionsHtml = `
          <div class="confirm-actions">
            <button class="btn-cancel" data-action="cancel">${cancelText}</button>
            <button class="btn-confirm ${danger ? 'danger' : ''}" data-action="confirm">${confirmText}</button>
          </div>
        `;
      }

      const messageHtml = String(message).includes('<pre')
        ? `<div class="confirm-message">${message}</div>`
        : `<p class="confirm-message">${message}</p>`;

      box.innerHTML = `
        <h3>${title}</h3>
        ${messageHtml}
        ${actionsHtml}
      `;

      overlay.appendChild(box);
      document.body.appendChild(overlay);

      const confirmBtn = box.querySelector('[data-action="confirm"]');
      setTimeout(() => confirmBtn && confirmBtn.focus(), 50);

      function close(result) {
        overlay.classList.add('closing');
        box.classList.add('closing');
        setTimeout(() => {
          if (overlay.parentNode) overlay.remove();
          resolve(result);
        }, 250);
      }

      // Eventos
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay && !confirmOnly) close(false);
      });

      const cancelBtn = box.querySelector('.btn-cancel');
      if (cancelBtn) cancelBtn.addEventListener('click', () => close(false));

      const okBtn = box.querySelector('.btn-ok');
      if (okBtn) okBtn.addEventListener('click', () => close(true));

      const confirmBtnAction = box.querySelector('.btn-confirm');
      if (confirmBtnAction) confirmBtnAction.addEventListener('click', () => close(true));

      // Tecla ESC = cancelar (apenas se não for confirmOnly)
      const keyHandler = (e) => {
        if (e.key === 'Escape' && !confirmOnly) {
          close(false);
          document.removeEventListener('keydown', keyHandler);
        }
        if (e.key === 'Enter' && e.target.closest('.confirm-box')) {
          close(true);
          document.removeEventListener('keydown', keyHandler);
        }
      };
      document.addEventListener('keydown', keyHandler);
    });
  }

  // ============================================================
  // FUNÇÃO AUXILIAR: ALERT (apenas OK)
  // ============================================================
  function showAlert(title, message) {
    return showConfirm({ title, message, confirmOnly: true });
  }

  // ============================================================
  // EXPOR GLOBAL
  // ============================================================
  window.showConfirm = showConfirm;
  window.showAlert = showAlert;
})();