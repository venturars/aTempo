import { Global, Module } from '@nestjs/common'
import { createSdk } from 'atempo-sdk'
import { ATEMPO_SDK } from './atempo-sdk.token'

@Global()
@Module({
  providers: [
    {
      provide: ATEMPO_SDK,
      useFactory: () => createSdk(),
    },
  ],
  exports: [ATEMPO_SDK],
})
export class AtempoSdkModule {}
