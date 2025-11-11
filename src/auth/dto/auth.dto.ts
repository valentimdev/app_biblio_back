import { MinLength,IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class AuthDto{
    @IsString()
    @IsNotEmpty()
    matricula: string;
    
    @IsEmail()
    @IsNotEmpty()
    email:string;

    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password:string;


    @IsString()
    @IsOptional()
    @MaxLength(255)
    name: string;


}