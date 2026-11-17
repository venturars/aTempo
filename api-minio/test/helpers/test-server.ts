import type { Express } from 'express'
import type { Server } from 'node:http'
import request from 'supertest'

export function startTestServer(app: Express): Server {
  return app.listen()
}

export function requestOnServer(server: Server) {
  return request(server)
}

export function closeTestServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error)
        return
      }
      resolve()
    })
  })
}