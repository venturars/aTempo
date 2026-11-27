import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import type { Request } from 'express'
import { ContractException } from '../contract/contract-exception'

@Injectable()
export class BearerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const header = context.switchToHttp().getRequest<Request>()
      .headers.authorization
    if (typeof header === 'string' && /^Bearer \S+$/.test(header)) {
      return true
    }
    throw new ContractException(
      401,
      'Unauthorized',
      'UNAUTHENTICATED',
      'La sesión no es válida o ha caducado.',
    )
  }
}
