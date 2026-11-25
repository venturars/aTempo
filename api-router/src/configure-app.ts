import { INestApplication, ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { fieldErrors, validationFailed } from './contract/contract-exception'
import { ContractExceptionFilter } from './contract/contract-exception.filter'

export function configureApp(app: INestApplication): void {
  app.enableCors()
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: (errors) => validationFailed(fieldErrors(errors)),
    }),
  )
  app.useGlobalFilters(new ContractExceptionFilter(app.getHttpAdapter()))

  const documentConfig = new DocumentBuilder()
    .setTitle('aTempo api-router')
    .setDescription(
      'REST entre los frontends y la SDK de lógica de negocio (futura carpeta sdk/).',
    )
    .setVersion('1.0.0')
    .build()

  const document = SwaggerModule.createDocument(app, documentConfig)
  SwaggerModule.setup('docs', app, document)
}
