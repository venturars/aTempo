import { ArgumentsHost, Catch, HttpException, Logger } from '@nestjs/common'
import { BaseExceptionFilter } from '@nestjs/core'
import type { Response } from 'express'
import { ContractException, internalError } from './contract-exception'

@Catch()
export class ContractExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(ContractExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost): void {
    if (
      exception instanceof HttpException &&
      !(exception instanceof ContractException)
    ) {
      super.catch(exception, host)
      return
    }
    if (!(exception instanceof ContractException)) {
      this.logger.error(exception)
    }
    const contractError =
      exception instanceof ContractException ? exception : internalError()
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(contractError.getStatus())
      .json(contractError.getResponse())
  }
}
