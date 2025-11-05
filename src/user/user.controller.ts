import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { GetUser } from 'src/auth/decorator/get-user.decorator';
import { JwtGuard } from 'src/auth/guard/jwt.guard';
import { EditUserDto } from './dto/edit-user.dto';
import { UserService } from './user.service';

@UseGuards(JwtGuard)
@Controller('users')
export class UserController {
  constructor(private userService:UserService){}
  @Get('me')
  getMe(@GetUser() user: any) {
    return user;
  }

  @Patch()
  editUser(
    @GetUser('id') userId:string,
    @Body() dto:EditUserDto
  ){
    return this.userService.editUser(userId, dto);
  }
} 
