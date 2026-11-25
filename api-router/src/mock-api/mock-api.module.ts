import { Module } from '@nestjs/common'
import { CoursesController } from './courses.controller'
import { MockApiService } from './mock-api.service'
import { SessionsController } from './sessions.controller'

@Module({
  controllers: [SessionsController, CoursesController],
  providers: [MockApiService],
})
export class MockApiModule {}
