import { User } from '../modules/user/user.types';

/**
 * SafeUser — the User shape safe to serialize over the wire.
 * The `password` field is always omitted.
 */
export type SafeUser = Omit<User, 'password'>;

/**
 * Strips the password hash from a User record before returning it to the client.
 * Call this in any service method or controller that serializes a User.
 */
export function toSafeUser(user: User): SafeUser {
  const { password, ...safe } = user;
  return safe;
}
