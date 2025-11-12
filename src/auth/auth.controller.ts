import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import * as dto from "./dto";
import { JwtGuard } from "./guard/jwt.guard";
import { ChangePasswordDto, ForgotPasswordDto, ResetPasswordDto } from './dto/password.dto';
import { GetUser } from './decorator/get-user.decorator';

@Controller('auth')
export class AuthController{
    constructor(private authService: AuthService){}
    
    @Post('signup')
    signup(@Body() dto: dto.AuthDto){
        return this.authService.signup(dto);
    } 
    
    @Post('signin')
    @HttpCode(HttpStatus.OK)
    signin(@Body() dto: dto.LoginDto){
        return this.authService.signin(dto);
    }

    @UseGuards(JwtGuard)
    @Post('change-password')
    changePassword(@GetUser('id') userId: string, @Body() body: ChangePasswordDto){
        return this.authService.changePassword(userId, body);
    }

    @Post('forgot')
    @HttpCode(HttpStatus.ACCEPTED)
    forgot(@Body() body: ForgotPasswordDto){
        return this.authService.requestPasswordReset(body.email);
    }

    @Post('reset')
    @HttpCode(HttpStatus.OK)
    reset(@Body() body: ResetPasswordDto){
        return this.authService.resetPassword(body.token, body.newPassword);
    }
}