import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    const user = await this.userService.create(createUserDto);
    // 不返回密码哈希
    const { passwordHash, ...result } = user;
    return {
      code: 200,
      message: '注册成功',
      data: result,
    };
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const user = await this.userService.validateUser(loginDto);
    // 不返回密码哈希
    const { passwordHash, ...result } = user;
    return {
      code: 200,
      message: '登录成功',
      data: result,
    };
  }

  @Get('profile')
  async getProfile(@Request() req) {
    // TODO: 实现JWT认证后获取当前用户
    return {
      code: 200,
      message: '获取成功',
      data: null,
    };
  }
}

