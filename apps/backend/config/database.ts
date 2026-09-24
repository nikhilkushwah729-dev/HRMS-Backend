import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { defineConfig } from '@adonisjs/lucid'

const dbHost = env.get('DB_HOST')
const requiresTls = env.get('DB_SSL') || /(?:^|\.)tidbcloud\.com$/i.test(dbHost)

const dbConfig = defineConfig({
  connection: env.get('DB_CONNECTION'),
  connections: {
    mysql: {
      client: 'mysql2',
      connection: {
        host: dbHost,
        port: env.get('DB_PORT'),
        user: env.get('DB_USER'),
        password: env.get('DB_PASSWORD'),
        database: env.get('DB_DATABASE'),
        ssl: requiresTls
          ? {
              minVersion: 'TLSv1.2',
              ca: env.get('DB_SSL_CA')?.replace(/\\n/g, '\n'),
              rejectUnauthorized: true,
            }
          : undefined,
      },
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
    },
    sqlite: {
      client: 'better-sqlite3',
      connection: {
        filename: app.tmpPath('db.sqlite3'),
        timeout: 5000,
      },
      pool: {
        afterCreate: (conn: any, done: any) => {
          try {
            conn.pragma('journal_mode = WAL')
            conn.pragma('synchronous = NORMAL')
          } catch (e) {}
          done(null, conn)
        },
      },
      useNullAsDefault: true,
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
      schemaGeneration: {
        enabled: true,
        rulesPaths: ['./database/schema_rules.js'],
      },
    },
  },
})

export default dbConfig
