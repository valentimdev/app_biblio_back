// Script de inicialização que garante que crypto está disponível
// antes de carregar qualquer módulo do Azure SDK

// Garante que crypto está disponível globalmente
if (typeof globalThis.crypto === 'undefined') {
  const crypto = require('crypto');
  // Node.js 18+ tem crypto.randomUUID disponível
  if (!crypto.randomUUID) {
    // Polyfill para versões antigas
    crypto.randomUUID = function () {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
        /[xy]/g,
        function (c) {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        },
      );
    };
  }
  globalThis.crypto = crypto.webcrypto || crypto;
}

// Agora inicia a aplicação
require('./dist/src/main.js');
