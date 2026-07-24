const { pbkdf2Sync, randomBytes } = require('crypto');

function hash(p) {
  const s = randomBytes(16).toString('hex');
  return s + ':' + pbkdf2Sync(p, s, 100000, 64, 'sha512').toString('hex');
}

console.log('beonlabs2026:', hash('beonlabs2026'));
console.log('asterito2026:', hash('asterito2026'));
console.log('frauches2026:', hash('frauches2026'));
console.log('franca2026:', hash('franca2026'));