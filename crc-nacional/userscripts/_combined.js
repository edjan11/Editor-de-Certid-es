// ==UserScript==
// @name         Atalho Ctrl+Q para Imprimir
// @namespace    http://seu-nome-aqui
// @version      1.0
// @description  Pressione Ctrl+Q para acionar o botão "Imprimir"
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  document.addEventListener('keydown', function (e) {
    // Verifica Ctrl+Q
    if (e.ctrlKey && e.key.toLowerCase() === 'q') {
      e.preventDefault();

      // Tenta localizar o botão
      const btn = document.querySelector('input[type="button"][value="Imprimir"].botao');
      if (btn) {
        btn.click(); // dispara o clique
        console.log('Atalho Ctrl+Q acionou o botão Imprimir.');
      } else {
        console.warn('Botão "Imprimir" não encontrado na página.');
      }
    }
  });
})();


// ==UserScript==
// @name         Botão BUSCA Transparente + Ctrl+B
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Botão BUSCA acima do SELO, estilo transparente, popup pequeno, atalho Ctrl+B
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const URL_BUSCA = 'https://sistema.registrocivil.org.br/buscas/buscaRegistros.cfm';

  function abrirPopupBusca() {
    const largura = 600;
    const altura = 520;
    const esquerda = Math.floor((window.screen.availWidth - largura) / 2);
    const topo = Math.floor((window.screen.availHeight - altura) / 2);

    window.open(
      URL_BUSCA,
      'busca-registrocivil-popup',
      `width=${largura},height=${altura},left=${esquerda},top=${topo},resizable=yes,scrollbars=yes`
    );
  }

  // Evita duplicar o botão
  if (!document.getElementById('btn-busca-registrocivil')) {
    // Localiza botão SELO para posicionar acima dele
    const btnSelo = document.getElementById('btn-selo-tjse') ||
      Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.trim().toUpperCase() === 'SELO');

    let bottom = 98;
    if (btnSelo) {
      const style = window.getComputedStyle(btnSelo);
      const seloBottom = parseInt(style.bottom || '48', 10);
      bottom = seloBottom + btnSelo.offsetHeight + 8;
    }

    // Cria botão BUSCA
    const btnBusca = document.createElement('button');
    btnBusca.id = 'btn-busca-registrocivil';
    btnBusca.textContent = 'BUSCA';
    btnBusca.type = 'button';
    btnBusca.title = 'Abrir Busca Registro Civil (Ctrl+B)';

    btnBusca.style.cssText = `
      position: fixed !important;
      bottom: ${bottom}px !important;
      right: 10px !important;
      z-index: 10000 !important;

      padding: 2px 8px !important;
      margin: 0 !important;
      border-radius: 4px !important;
      border-width: 1px !important;
      border-style: solid !important;

      font-size: 10px !important;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
      line-height: 14px !important;
      font-weight: 500 !important;
      letter-spacing: 0.03em !important;

      background-color: transparent !important;
      color: #00bcd4 !important;                  /* texto colorido */
      border-color: rgba(0, 188, 212, 0.75) !important; /* borda colorida */

      cursor: pointer !important;
      opacity: 0.55 !important;
      transition:
        opacity 0.15s ease-out,
        background-color 0.15s ease-out,
        transform 0.1s ease-out,
        box-shadow 0.15s ease-out !important;

      box-shadow: none !important;
      backdrop-filter: blur(2px);
    `;

    btnBusca.onmouseover = () => {
      btnBusca.style.opacity = '1';
      btnBusca.style.backgroundColor = 'rgba(0, 188, 212, 0.06)';
      btnBusca.style.boxShadow = '0 0 0 1px rgba(0, 188, 212, 0.15)';
    };

    btnBusca.onmouseout = () => {
      btnBusca.style.opacity = '0.55';
      btnBusca.style.backgroundColor = 'transparent';
      btnBusca.style.boxShadow = 'none';
    };

    btnBusca.onmousedown = () => {
      btnBusca.style.transform = 'translateY(1px)';
      btnBusca.style.opacity = '0.9';
    };

    btnBusca.onmouseup = () => {
      btnBusca.style.transform = 'translateY(0)';
      btnBusca.style.opacity = '1';
    };

    btnBusca.onclick = abrirPopupBusca;
    document.body.appendChild(btnBusca);
  }

  // Atalho Ctrl+B: abre popup
  document.addEventListener('keydown', e => {
    if (
      e.ctrlKey && (e.key === 'b' || e.key === 'B') &&
      !e.altKey && !e.metaKey
    ) {
      const tag = (e.target.tagName || '').toLowerCase();
      const ed = e.target.isContentEditable;
      if (tag === 'input' || tag === 'textarea' || ed) return;
      e.preventDefault();
      abrirPopupBusca();
    }
  });
})();
