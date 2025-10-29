/**
 * Command Models for Auth Service
 * These are internal service layer models, separate from DTOs
 */

/**
 * Command to create a new user
 */
export interface CreateUserCommand {
  email: string;
  password: string;
}

/**
 * Command to authenticate a user
 */
export interface AuthenticateUserCommand {
  email: string;
  password: string;
}

/**
 * Command for OAuth login/registration
 */
export interface OAuthLoginCommand {
  provider: 'google' | 'apple';
  token: string;
}

/**
 * Command to logout a user
 */
export interface LogoutCommand {
  userId: string;
  token: string;
}

/**
 * Command to get user profile
 */
export interface GetUserProfileCommand {
  userId: string;
}
