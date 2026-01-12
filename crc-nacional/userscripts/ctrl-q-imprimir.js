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
