import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * UserOAuthProviderEntity - represents an OAuth provider connection for a user
 * Corresponds to user_oauth_providers table in database
 *
 * Uses composite primary key (user_id, provider_name) to ensure
 * each user can have only one connection per OAuth provider
 */
@Entity('user_oauth_providers')
export class UserOAuthProviderEntity {
  @PrimaryColumn({ type: 'uuid', name: 'user_id' })
  userId: string;

  @PrimaryColumn({ type: 'varchar', length: 50, name: 'provider_name' })
  providerName: string;

  @Column({ type: 'varchar', length: 255, name: 'provider_user_id' })
  providerUserId: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at', nullable: true })
  updatedAt: Date | null;
}
