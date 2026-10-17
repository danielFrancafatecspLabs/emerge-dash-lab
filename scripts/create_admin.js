// Cria (ou atualiza) um usuário admin em data/users.json sem apagar os demais.
// Uso: node scripts/create_admin.js <usuario> "<nome>"   (a senha é lida da variável ADMIN_PASSWORD)
const { randomBytes, randomUUID, pbkdf2Sync } = require('crypto')
const fs = require('fs')
const path = require('path')

const [username, nome = ''] = process.argv.slice(2)
const password = process.env.ADMIN_PASSWORD || ''
if (!username || password.length < 12) {
  console.error('Uso: ADMIN_PASSWORD="<senha com 12+ caracteres>" node scripts/create_admin.js <usuario> "<nome>"')
  process.exit(1)
}

const salt = randomBytes(16).toString('hex')
const passwordHash = `${salt}:${pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')}`
const file = process.env.USERS_FILE_PATH || path.join(__dirname, '..', 'data', 'users.json')
const users = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : []
const existente = users.find(u => u.username === username)
if (existente) {
  Object.assign(existente, { passwordHash, role: 'admin', active: true, nome: nome || existente.nome })
} else {
  users.push({ id: randomUUID(), username, passwordHash, role: 'admin', nome, laboratorio: '', avatar: '', createdAt: new Date().toISOString(), active: true })
}
fs.mkdirSync(path.dirname(file), { recursive: true })
fs.writeFileSync(file, `${JSON.stringify(users, null, 2)}\n`)
console.log(`${existente ? 'Atualizado' : 'Criado'}: ${username} (admin) em ${file}`)
