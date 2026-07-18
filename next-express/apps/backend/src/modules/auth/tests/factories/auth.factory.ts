/**
 * Auth payload builders
 */

let _seq = 0;
const next = () => ++_seq;

/**
 * Builds a valid POST /api/auth/register body.
 * Password is a plaintext string (the service hashes it).
 */
export function buildRegisterPayload(
  overrides: Partial<{ name: string; email: string; password: string; role: string }> = {},
) {
  const seq = next();
  return {
    name:     `New User ${seq}`,
    email:    `newuser${seq}@example.com`,
    password: 'ValidPass123',
    ...overrides,
  };
}

/**
 * Builds a valid POST /api/auth/login body.
 */
export function buildLoginPayload(
  overrides: Partial<{ email: string; password: string }> = {},
) {
  const seq = next();
  return {
    email:    `user${seq}@example.com`,
    password: 'ValidPass123',
    ...overrides,
  };
}
