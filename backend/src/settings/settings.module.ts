import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
