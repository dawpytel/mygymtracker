import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  BadRequestException,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  RegisterDto,
  RegisterResponseDto,
  LoginDto,
  LoginResponseDto,
  OAuthLoginDto,
  LogoutResponseDto,
} from '../types';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

/**
 * AuthController - handles authentication endpoints
 */
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/register
   * Register a new user with email and password
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Create a new user account with email and password',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User successfully registered',
    type: RegisterResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email already exists',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<RegisterResponseDto> {
    // Validate email format
    if (!this.isValidEmail(registerDto.email)) {
      throw new BadRequestException('Invalid email format');
    }

    // Validate password length
    if (registerDto.password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    return this.authService.register({
      email: registerDto.email,
      password: registerDto.password,
    });
  }

  /**
   * POST /auth/login
   * Authenticate user with email and password
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login user',
    description: 'Authenticate user and return JWT tokens',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User successfully authenticated',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login({
      email: loginDto.email,
      password: loginDto.password,
    });
  }

  /**
   * POST /auth/oauth/:provider
   * Login or register via OAuth provider (google or apple)
   */
  @Post('oauth/:provider')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'provider',
    enum: ['google', 'apple'],
    description: 'OAuth provider name',
  })
  @ApiOperation({
    summary: 'OAuth login/register',
    description: 'Authenticate or register user via OAuth provider',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User successfully authenticated via OAuth',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid provider or token',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid OAuth token',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async oauthLogin(
    @Param('provider') provider: string,
    @Body() oauthLoginDto: OAuthLoginDto,
  ): Promise<LoginResponseDto> {
    // Validate provider
    if (provider !== 'google' && provider !== 'apple') {
      throw new BadRequestException(
        'Invalid OAuth provider. Must be google or apple',
      );
    }

    return this.authService.oauthLogin(provider, oauthLoginDto.token);
  }

  /**
   * POST /auth/logout
   * Invalidate current JWT session
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout user',
    description: 'Invalidate current JWT token',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User successfully logged out',
    type: LogoutResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid JWT token',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  logout(@Req() req: AuthenticatedRequest): LogoutResponseDto {
    const userId = req.user.id;
    return this.authService.logout(userId);
  }

  /**
   * Helper method to validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
