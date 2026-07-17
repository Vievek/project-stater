import * as fc from 'fast-check';
import { JwtTokenProvider } from '../../token-provider';

/**
 * Property-based tests for JwtTokenProvider.
 *
 * Invariant: sign(payload) → verify(token) round-trips.
 * For any valid (sub: string, role: string) pair the decoded payload
 * must contain the same sub and role as were signed.
 */
describe('JwtTokenProvider — property tests', () => {

  const provider = new JwtTokenProvider(
    'test-secret-key-for-property-tests',
    '1h',
  );

  it('sign → verify round-trips for arbitrary sub + role', () => {
    fc.assert(
      fc.property(
        fc.uuid(),                               // arbitrary UUID-shaped sub
        fc.constantFrom('USER', 'ADMIN'),        // valid role values
        (sub, role) => {
          const token   = provider.sign({ sub, role });
          const decoded = provider.verify(token);

          expect(decoded.sub).toBe(sub);
          expect(decoded.role).toBe(role);
        },
      ),
    );
  });

  it('throws on a tampered token', () => {
    const token   = provider.sign({ sub: 'user-1', role: 'USER' });
    const tampered = token.slice(0, -4) + 'XXXX';

    expect(() => provider.verify(tampered)).toThrow(
      expect.objectContaining({ statusCode: 401 }),
    );
  });

  it('throws on a token signed with a different secret', () => {
    const otherProvider = new JwtTokenProvider('completely-different-secret', '1h');
    const token         = otherProvider.sign({ sub: 'user-1', role: 'USER' });

    expect(() => provider.verify(token)).toThrow(
      expect.objectContaining({ statusCode: 401 }),
    );
  });
});
