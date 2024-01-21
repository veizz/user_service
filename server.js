import Fastify from 'fastify'
import FastifyVite from '@fastify/vite'
import BetterSqlite3 from 'better-sqlite3'
import fastifyBetterSqlite3 from '@punkish/fastify-better-sqlite3'
import fastifySession from '@fastify/session'
import fastifyCookie from '@fastify/cookie'

const server = Fastify({
  logger: {
    transport: {
      target: '@fastify/one-line-logger'
    }
  }
})

server.register(fastifyCookie)
server.register(fastifySession, {
  secret: '8c61b89b7b80621dd09597f0d9b994f3',
  cookie: {
    secure: false,
  }
})
const sqlite3Opts = {
  "class": BetterSqlite3,
  "pathToDb": "./db/db.sqlite3",
}
await server.register(fastifyBetterSqlite3, sqlite3Opts)

await server.register(FastifyVite, {
  root: import.meta.url,
  renderer: '@fastify/react',
})

await server.vite.ready()

server.decorate('db', {
  todoList: [
    'Do laundry',
    'Respond to emails',
    'Write report',
  ]
})


server.get('/api/db/test', (req, reply) => {
  const rows = server.betterSqlite3.prepare('SELECT id, username FROM tbl_user').all()
  reply.send({ ok: true, data: rows })
})

server.get('/api/user/login', (req, reply) => {
  const { username, password } = req.query
  const row = server.betterSqlite3
    .prepare(
      "SELECT id, username FROM tbl_user WHERE username = ? AND password = ?"
    )
    .get(username, password)
  const ok = row !== undefined
  if (ok) {
    console.log('uid', row.id);
    req.session.set('uid', row.id)
  }
  reply.send({ ok, data: row });
})

server.get('/api/user/logout', (req, reply) => {
  req.session.set('uid', undefined)
  reply.send({ ok: true })
})

server.get('/api/user/status', (req, reply) => {
  const uid = req.session.get('uid')
  const ok = uid !== undefined
  reply.send({ ok, data: { uid } })
});

server.get('/api/todo/items', (req, reply) => {
  reply.send({ ok: true, data: server.db.todoList });
})

server.put('/api/todo/items', (req, reply) => {
  server.db.todoList.push(req.body)
  reply.send({ ok: true })
})

server.delete('/api/todo/items', (req, reply) => {
  server.db.todoList.splice(req.body, 1)
  reply.send({ ok: true })
})

await server.listen({ port: 3000 })
