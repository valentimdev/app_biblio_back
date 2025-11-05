import { MinLength,IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class AuthDto{
    @IsEmail()
    @IsNotEmpty()
    email:string;

    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password:string;

    // Campos opcionais para cadastro
    @IsString()
    @IsOptional()
    @MaxLength(255)
    name?: string;

    @IsString()
    @IsOptional()
    matricula?: string;
    
}