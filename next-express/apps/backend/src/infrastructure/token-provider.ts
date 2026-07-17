/**
 * token-provider.ts
 *
 * ITokenProvider — the single swap point for the token signing strategy.
 *
 * ─── Swap-cost analysis ──────────────────────────────────────────────────────
 *
 * ✅ Pure token-strategy swap (JWT → PASETO / opaque / HMAC session tokens):
 *    Implement a new class satisfying ITokenProvider, change ONE line in
 *    user.module.ts (the `new JwtTokenProvider()` call). UserService,
 *    authMiddleware, and the rest of the module graph never change.
 *
 * ⚠️  External auth-provider swap (Auth0, Clerk, Cognito, etc.):
 *    Larger blast radius — those providers own the token lifecycle, so:
 *      - authMiddleware's verification logic moves to the provider SDK / JWKS.
 *      - register / login methods on UserService are removed (the provider
 *        handles registration and credential storage).
 *    The ITokenProvider abstraction still minimises the blast radius: only
 *    those two files change; nothing else in the module graph is affected.
 *
 * ─── Usage ───────────────────────────────────────────────────────────────────
 *
 *   // Wiring (user.module.ts / container.ts):
 *   const tokenProvider: ITokenProvider = new JwtTokenProvider();
 *
 *   // Sign:
 *   const token = tokenProvider.sign({ sub: user.id, role: user.role });
 *
 *   // Verify (throws on invalid/expired):
 *   const payload = tokenProvider.verify(token);
 */

import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import { AppError } from '../utils/AppError';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface TokenPayload {
  /** User id (Prisma UUID). */
  sub:   string;
  /** User role, e.g. 'USER' | 'ADMIN'. */
  role:  string;
  iat?:  number;
  exp?:  number;
}

/**
 * Swap-point interface for token signing and verification.
 * Swap the concrete class in user.module.ts/container.ts — nothing else changes.
 */
export interface ITokenProvider {
  /**
   * Signs a payload and returns a token string.
   * @throws never — errors in sign() are programming mistakes, not runtime ones.
   */
  sign(payload: TokenPayload): string;

  /**
   * Verifies a token string and returns its payload.
   * @throws AppError(401) when the token is invalid or expired.
   */
  verify(token: string): TokenPayload;
}

// ─── JWT implementation ───────────────────────────────────────────────────────

const JWT_SECRET  = process.env.JWT_SECRET  ?? 'change-me-in-production';
const JWT_EXPIRES = process.env.JWT_EXPIRES ?? '7d';

export class JwtTokenProvider implements ITokenProvider {
  private readonly secret:  string;
  private readonly expires: string;

  constructor(secret = JWT_SECRET, expires = JWT_EXPIRES) {
    this.secret  = secret;
    this.expires = expires;
  }

  sign(payload: TokenPayload): string {
    const { iat, exp, ...claims } = payload; // strip timing fields — jwt adds them
    const opts: SignOptions = { expiresIn: this.expires as any };
    return jwt.sign(claims, this.secret, opts);
  }

  verify(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, this.secret) as JwtPayload & TokenPayload;
      if (typeof decoded.sub !== 'string' || typeof decoded.role !== 'string') {
        throw new AppError('Invalid token payload', 401);
      }
      return { sub: decoded.sub, role: decoded.role, iat: decoded.iat, exp: decoded.exp };
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError('Invalid or expired token', 401);
    }
  }
}
