import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@Controller('health')
@ApiTags('health')
export class HealthController {
  @Get()
  getHealth() {
    return { status: 'ok', service: 'honeydew-backend' };
  }
}
