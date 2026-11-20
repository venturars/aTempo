import { INestApplication, ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

export function configureApp(app: INestApplication): void {
  app.enableCors()
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  )

  const documentConfig = new DocumentBuilder()
    .setTitle('aTempo api-postgresql')
    .setDescription(
      'Persistencia entre la SDK de lógica de negocio y PostgreSQL.',
    )
    .setVersion('1.0.0')
    .build()

  const document = SwaggerModule.createDocument(app, documentConfig)
  SwaggerModule.setup('docs', app, document)
}
