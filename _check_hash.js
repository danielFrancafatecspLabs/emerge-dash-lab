const { pbkdf2Sync } = require('crypto');

const salt = '8fb46fb90b6b7760b5d917bfa1edb006';
const stored = '407da17f8dd72480420cf64665de6102f04b760c980b9147b931c6b58d51231806765701c9da29fbdf65d7d90592950d68a7e8621b797fca83d51f22b7d7de48';

const h1 = pbkdf2Sync('asterito2026', salt, 100000, 64, 'sha512').toString('hex');
const h2 = pbkdf2Sync('beonlabs2026', salt, 100000, 64, 'sha512').toString('hex');

console.log('asterito2026:', h1);
console.log('beonlabs2026:', h2);
console.log('stored:      ', stored);
console.log('Match asterito2026:', h1 === stored);
console.log('Match beonlabs2026:', h2 === stored);