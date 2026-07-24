const { pbkdf2Sync, randomBytes } = require('crypto');
const fs = require('fs');
const path = require('path');

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return salt + ':' + hash;
}

const users = [
  {
    id: '1',
    username: 'gustavo.leite@claro.com.br',
    passwordHash: hashPassword('beonlabs2026'),
    role: 'executivo',
    createdAt: new Date().toISOString(),
    active: true,
  },
  {
    id: '2',
    username: 'rodrigo.assad@claro.com.br',
    passwordHash: hashPassword('beonlabs2026'),
    role: 'executivo',
    createdAt: new Date().toISOString(),
    active: true,
  },
  {
    id: '3',
    username: 'marco_asterito',
    passwordHash: hashPassword('asterito2026'),
    role: 'admin',
    createdAt: new Date().toISOString(),
    active: true,
  },
  {
    id: '4',
    username: 'daniel_frauches',
    passwordHash: hashPassword('frauches2026'),
    role: 'admin',
    createdAt: new Date().toISOString(),
    active: true,
  },
  {
    id: '5',
    username: 'daniel_franca',
    passwordHash: hashPassword('franca2026'),
    role: 'admin',
    createdAt: new Date().toISOString(),
    active: true,
  },
];

const dir = path.join(__dirname, 'data');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'users.json'), JSON.stringify(users, null, 2));
console.log('users.json criado com sucesso!');