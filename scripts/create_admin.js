const { randomBytes, pbkdf2Sync } = require('crypto');
const fs = require('fs');
function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}
const user = {
  id: 'local-1',
  username: 'local_admin',
  passwordHash: hashPassword('password'),
  role: 'admin',
  createdAt: new Date().toISOString(),
  active: true,
};
const path = './data/users.json';
fs.mkdirSync('./data', { recursive: true });
fs.writeFileSync(path, JSON.stringify([user], null, 2));
console.log('WROTE', path);
