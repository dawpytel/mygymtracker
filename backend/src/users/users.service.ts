import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserProfileDto } from '../types';
import { GetUserProfileCommand } from '../auth/commands/auth.commands';

/**
 * UsersService - handles user-related business logic
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Get user profile by ID
   * @param command - GetUserProfileCommand with userId
   * @returns UserProfileDto with user profile information
   * @throws NotFoundException if user is not found
   * @throws InternalServerErrorException for unexpected errors
   */
  async getProfile(command: GetUserProfileCommand): Promise<UserProfileDto> {
    const { userId } = command;

    try {
      // Find user by ID
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Return user profile (excluding sensitive data)
      return {
        id: user.id,
        email: user.email,
        last_login_at: user.last_login_at,
        created_at: user.created_at,
      };
    } catch (error) {
      // Re-throw known exceptions
      if (error instanceof NotFoundException) {
        throw error;
      }

      // Log unexpected errors
      this.logger.error(
        `Failed to get user profile: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to get user profile');
    }
  }
}

