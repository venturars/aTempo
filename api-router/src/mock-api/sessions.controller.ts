import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { BearerGuard } from './bearer.guard'
import {
  AttendanceCorrectionDto,
  AttendanceRecordDto,
  CheckInCodeDto,
  SessionDto,
  SessionsQueryDto,
} from './dto'
import { MockApiService } from './mock-api.service'

@ApiTags('sessions (mock)')
@ApiBearerAuth()
@UseGuards(BearerGuard)
@Controller('sessions')
export class SessionsController {
  constructor(private readonly mockApi: MockApiService) {}

  @Get()
  @ApiOkResponse({ type: SessionDto, isArray: true })
  listSessions(@Query() query: SessionsQueryDto): SessionDto[] {
    return this.mockApi.listSessions(query.date)
  }

  @Get(':sessionId')
  @ApiOkResponse({ type: SessionDto })
  getSession(@Param('sessionId') sessionId: string): SessionDto {
    return this.mockApi.getSession(sessionId)
  }

  @Get(':sessionId/attendances')
  @ApiOkResponse({ type: AttendanceRecordDto, isArray: true })
  listAttendances(
    @Param('sessionId') sessionId: string,
  ): AttendanceRecordDto[] {
    return this.mockApi.listAttendances(sessionId)
  }

  @Post(':sessionId/open')
  @HttpCode(200)
  @ApiOkResponse({ type: SessionDto })
  openSession(@Param('sessionId') sessionId: string): SessionDto {
    return this.mockApi.openSession(sessionId)
  }

  @Post(':sessionId/close')
  @HttpCode(200)
  @ApiOkResponse({ type: SessionDto })
  closeSession(@Param('sessionId') sessionId: string): SessionDto {
    return this.mockApi.closeSession(sessionId)
  }

  @Get(':sessionId/check-in-code')
  @ApiOkResponse({ type: CheckInCodeDto })
  checkInCode(@Param('sessionId') sessionId: string): CheckInCodeDto {
    return this.mockApi.checkInCode(sessionId)
  }

  @Put(':sessionId/attendances/:studentId')
  @ApiOkResponse({ type: AttendanceRecordDto })
  correctAttendance(
    @Param('sessionId') sessionId: string,
    @Param('studentId') studentId: string,
    @Body() correction: AttendanceCorrectionDto,
  ): AttendanceRecordDto {
    return this.mockApi.correctAttendance(sessionId, studentId, correction)
  }
}
