import { app } from 'electron'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

let database: DatabaseSync | null = null

// Opens the local database when the app starts. The login screen does not read it.
export function openDatabase(): void {
  if (database !== null) {
    return
  }

  const databasePath = join(app.getPath('userData'), 'atempo.sqlite')
  database = new DatabaseSync(databasePath)
  database.exec('PRAGMA user_version = 1')
}

export function closeDatabase(): void {
  if (database === null) {
    return
  }

  database.close()
  database = null
}
