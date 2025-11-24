// Script de inicialização que garante que crypto está disponível
// antes de carregar qualquer módulo do Azure SDK

// Importa o módulo crypto do Node.js
const nodeCrypto = require('crypto');

// Garante que crypto.randomUUID está disponível (Node.js 18+ já tem)
if (!nodeCrypto.randomUUID) {
  // Polyfill para versões antigas do Node.js
  nodeCrypto.randomUUID = function () {
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

// CRÍTICO: Torna crypto disponível globalmente ANTES de qualquer módulo ser carregado
// O Azure SDK espera que 'crypto' esteja disponível como variável global
global.crypto = nodeCrypto;
globalThis.crypto = nodeCrypto;

// Garante que randomUUID está acessível diretamente em crypto
if (!global.crypto.randomUUID) {
  global.crypto.randomUUID = nodeCrypto.randomUUID;
}
if (!globalThis.crypto.randomUUID) {
  globalThis.crypto.randomUUID = nodeCrypto.randomUUID;
}

// Agora inicia a aplicação - crypto já está disponível globalmente
require('./dist/src/main.js');
