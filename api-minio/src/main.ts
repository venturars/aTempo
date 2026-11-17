import { createApp } from './create-app'

const port = Number(process.env.PORT) || 3003

const app = createApp()

app.listen(port, () => {
  console.log(`api-minio listening on port ${port}`)
})