import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import {
  CreateUserCommand,
  AuthenticateUserCommand,
} from './commands/auth.commands';
import {
  RegisterResponseDto,
  LoginResponseDto,
  LogoutResponseDto,
} from '../types';
import { OAuth2Client } from 'google-auth-library';
import * as appleSignin from 'apple-signin-auth';
import { UserOAuthProviderEntity } from '../users/entities/user-oauth-provider.entity';

/**
 * AuthService - handles authentication business logic
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly SALT_ROUNDS = 10;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserOAuthProviderEntity)
    private readonly oauthRepo: Repository<UserOAuthProviderEntity>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Register a new user
   * @param command - CreateUserCommand with email and password
   * @returns RegisterResponseDto with user info (excluding sensitive data)
   * @throws ConflictException if email already exists
   * @throws InternalServerErrorException for unexpected errors
   */
  async register(command: CreateUserCommand): Promise<RegisterResponseDto> {
    const { email, password } = command;

    try {
      // Check if user already exists
      const existingUser = await this.userRepository.findOne({
        where: { email },
      });

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }

      // Hash password
      const password_hash = await bcrypt.hash(password, this.SALT_ROUNDS);

      // Create new user
      const user = this.userRepository.create({
        email,
        password_hash,
        account_created_at: new Date(),
      });

      // Save user to database
      const savedUser = await this.userRepository.save(user);

      // Return user info (excluding sensitive data)
      return {
        id: savedUser.id,
        email: savedUser.email,
        created_at: savedUser.created_at,
      };
    } catch (error) {
      // Re-throw known exceptions
      if (
        error instanceof ConflictException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      // Handle unique constraint violation from database
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code: string }).code === '23505'
      ) {
        // PostgreSQL unique violation
        throw new ConflictException('Email already exists');
      }

      // Log unexpected errors
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to register user: ${errorMessage}`, errorStack);
      throw new InternalServerErrorException('Failed to register user');
    }
  }

  /**
   * Authenticate user and issue JWT tokens
   * @param command - AuthenticateUserCommand with email and password
   * @returns LoginResponseDto with access and refresh tokens
   * @throws UnauthorizedException if credentials are invalid
   * @throws InternalServerErrorException for unexpected errors
   */
  async login(command: AuthenticateUserCommand): Promise<LoginResponseDto> {
    const { email, password } = command;

    try {
      // Find user by email
      const user = await this.userRepository.findOne({
        where: { email },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(
        password,
        user.password_hash,
      );

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Update last login timestamp
      user.last_login_at = new Date();
      await this.userRepository.save(user);

      // Generate JWT tokens
      const payload = { sub: user.id, email: user.email };
      const accessToken = this.jwtService.sign(payload);
      const refreshToken = this.jwtService.sign(payload, {
        expiresIn: '30d',
      });

      return {
        accessToken,
        refreshToken,
      };
    } catch (error) {
      // Re-throw known exceptions
      if (
        error instanceof ConflictException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      // Log unexpected errors
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to login user: ${errorMessage}`, errorStack);
      throw new InternalServerErrorException('Failed to login');
    }
  }

  async oauthLogin(provider: string, token: string): Promise<LoginResponseDto> {
    let email: string;
    let providerUserId: string;
    
    try {
      if (provider === 'google') {
        // Validate Google Client ID is configured
        const googleClientId = process.env.GOOGLE_CLIENT_ID;
        if (!googleClientId) {
          this.logger.error('GOOGLE_CLIENT_ID environment variable is not configured');
          throw new InternalServerErrorException(
            'Google OAuth is not configured on this server',
          );
        }

        const client = new OAuth2Client(googleClientId);
        const ticket = await client.verifyIdToken({ 
          idToken: token,
          audience: googleClientId,
        });
        const payload = ticket.getPayload();
        if (!payload || !payload.email || !payload.sub) {
          throw new UnauthorizedException('Invalid Google OAuth token');
        }
        email = payload.email;
        providerUserId = payload.sub;
      } else if (provider === 'apple') {
        // Validate Apple Client ID is configured
        const appleClientId = process.env.APPLE_CLIENT_ID;
        if (!appleClientId) {
          this.logger.error('APPLE_CLIENT_ID environment variable is not configured');
          throw new InternalServerErrorException(
            'Apple OAuth is not configured on this server',
          );
        }

        const applePayload = await appleSignin.verifyIdToken(token, {
          audience: appleClientId,
          ignoreExpiration: false,
        });
        email = applePayload.email;
        providerUserId = applePayload.sub;
      } else {
        throw new UnauthorizedException(`Unsupported OAuth provider: ${provider}`);
      }

      // Upsert user and OAuth provider
      // First check if OAuth connection already exists
      let oauth = await this.oauthRepo.findOne({
        where: { providerName: provider, providerUserId },
      });
      
      let user: User | null = null;
      
      if (oauth) {
        // OAuth connection exists, find associated user
        user = await this.userRepository.findOne({ where: { id: oauth.userId } });
        if (!user) {
          throw new UnauthorizedException('OAuth user not found');
        }
      } else {
        // OAuth connection doesn't exist yet
        // Check if user with this email already exists
        user = await this.userRepository.findOne({ where: { email } });
        
        if (!user) {
          // New user - create account
          try {
            user = this.userRepository.create({
              email,
              password_hash: '',
              account_created_at: new Date(),
            });
            user = await this.userRepository.save(user);
          } catch (saveError) {
            // Handle race condition - user might have been created between check and save
            if (
              saveError &&
              typeof saveError === 'object' &&
              'code' in saveError &&
              (saveError as { code: string }).code === '23505'
            ) {
              // Unique constraint violation - try to find user again
              user = await this.userRepository.findOne({ where: { email } });
              if (!user) {
                throw saveError; // Still can't find user, re-throw original error
              }
            } else {
              throw saveError;
            }
          }
        }
        
        // Create OAuth provider link (user exists now for sure)
        try {
          oauth = this.oauthRepo.create({
            userId: user.id,
            providerName: provider,
            providerUserId,
          });
          await this.oauthRepo.save(oauth);
        } catch (oauthError) {
          // Handle race condition - OAuth link might already exist
          if (
            oauthError &&
            typeof oauthError === 'object' &&
            'code' in oauthError &&
            (oauthError as { code: string }).code === '23505'
          ) {
            // Duplicate OAuth link - that's fine, just fetch it
            oauth = await this.oauthRepo.findOne({
              where: { providerName: provider, providerUserId },
            });
            if (!oauth) {
              throw oauthError; // Can't find OAuth record, re-throw
            }
          } else {
            throw oauthError;
          }
        }
      }

      // Update last login
      user.last_login_at = new Date();
      await this.userRepository.save(user);

      // Generate JWT tokens
      const jwtPayload = { sub: user.id, email: user.email };
      const accessToken = this.jwtService.sign(jwtPayload);
      const refreshToken = this.jwtService.sign(jwtPayload, { expiresIn: '30d' });

      return { accessToken, refreshToken };
    } catch (error) {
      // Re-throw known exceptions
      if (
        error instanceof ConflictException ||
        error instanceof UnauthorizedException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      // Log unexpected errors
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to process OAuth login for provider ${provider}: ${errorMessage}`,
        errorStack,
      );
      throw new InternalServerErrorException('Failed to process OAuth login');
    }
  }

  /**
   * Logout user (placeholder for token blacklisting)
   * @param userId - User ID
   * @returns LogoutResponseDto with success message
   */
  logout(userId: string): LogoutResponseDto {
    // TODO: Implement token blacklisting with Redis or in-memory store
    // For now, just return success message
    // The client should discard the token on their end

    this.logger.log(`User ${userId} logged out`);

    return {
      message: 'Successfully logged out',
    };
  }
}
