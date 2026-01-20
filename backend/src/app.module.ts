import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { CategoryModule } from './category/category.module';
import { AccountModule } from './account/account.module';
import { ArticleModule } from './article/article.module';
import { AuthModule } from './auth/auth.module';
import { SettingsModule } from './settings/settings.module';
import { StatisticsModule } from './statistics/statistics.module';
import { User } from './user/entities/user.entity';
import { Category } from './category/entities/category.entity';
import { WechatAccount } from './account/entities/account.entity';
import { Article } from './article/entities/article.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [],
      useFactory: async () => ({
        type: 'mysql',
        host: '81.69.47.226',
        port: 3306,
        username: 'root',
        password: '!Aa123456',
        database: 'testdb',
        synchronize: true,
        entities: [User, Category, WechatAccount, Article],
        logging: false, // 关闭 SQL 日志
      }),
    }),
    UserModule,
    CategoryModule,
    AccountModule,
    ArticleModule,
    AuthModule,
    SettingsModule,
    StatisticsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

