import { createApp } from './create-app'
import { checkMinioWithDefaultClient } from './minio/check-minio'

const port = Number(process.env.PORT) || 3003

const app = createApp({ checkMinio: checkMinioWithDefaultClient })

app.listen(port, () => {
  console.log(`api-minio listening on port ${port}`)
})