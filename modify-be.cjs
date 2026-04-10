const fs = require('fs');

const ctrlContent = `import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { TelegramService } from './telegram.service';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';

@Controller('telegram')
@UseGuards(JwtAuthGuard)
export class TelegramController {
  constructor(
    private readonly telegramService: TelegramService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  @Post('share')
  async shareUrl(@Body() body: { formName: string; detailUrl: string }, @Req() req: any) {
    const user = await this.userRepository.findOne({
      where: { id: req.user.id },
      relations: ['unit'],
    });

    if (!user || !user.unit || !user.unit.telegramGroupChatId) {
      return { success: false, message: 'Chưa cấu hình Telegram Bot cho đơn vị' };
    }

    const message = \`[NHẬT KÝ 90 NGÀY]\\nNhân viên: \${user.fullName}\\n\\nĐã nộp \${body.formName}.\\nQuản lý vui lòng xem và đánh giá tại:\\n\${body.detailUrl}\`;

    await this.telegramService.sendMessage(user.unit.telegramGroupChatId, message);
    return { success: true };
  }
}
`;

fs.writeFileSync('c:/quản lý bán hàng/be_sm/src/telegram/telegram.controller.ts', ctrlContent);

const moduleContent = `import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelegramService } from './telegram.service';
import { TelegramController } from './telegram.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([User])],
  controllers: [TelegramController],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}
`;

fs.writeFileSync('c:/quản lý bán hàng/be_sm/src/telegram/telegram.module.ts', moduleContent);
console.log('Done modifying backend');
