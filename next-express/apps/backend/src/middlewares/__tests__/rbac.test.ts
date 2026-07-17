import { Request, Response, NextFunction } from 'express';
import { rbacMiddleware } from '../../rbac';
import { TokenPayload } from '../../../infrastructure/token-provider';

// ─── Helper ───────────────────────────────────────────────────────────────────

function makeContext(user?: TokenPayload) {
  const req  = { user } as Partial<Request>;
  const res  = {} as Response;
  const next: NextFunction = jest.fn();
  return { req: req as Request, res, next };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('rbacMiddleware (Unit)', () => {

  /**
   * Decision table:
   * ┌───────────────┬──────────────────┬──────────────────────────┐
   * │ req.user.role │ allowedRoles     │ expected outcome         │
   * ├───────────────┼──────────────────┼──────────────────────────┤
   * │ undefined     │ ['USER']         │ AppError 401             │
   * │ USER          │ ['ADMIN']        │ AppError 403             │
   * │ ADMIN         │ ['ADMIN']        │ next() (no error)        │
   * │ USER          │ ['USER','ADMIN'] │ next() (no error)        │
   * │ ADMIN         │ ['USER','ADMIN'] │ next() (no error)        │
   * └───────────────┴──────────────────┴──────────────────────────┘
   */
  test.each([
    { userRole: undefined, allowedRoles: ['USER'],         expectedCode: 401, expectNext: false },
    { userRole: 'USER',    allowedRoles: ['ADMIN'],        expectedCode: 403, expectNext: false },
    { userRole: 'ADMIN',   allowedRoles: ['ADMIN'],        expectedCode: null,expectNext: true  },
    { userRole: 'USER',    allowedRoles: ['USER','ADMIN'], expectedCode: null,expectNext: true  },
    { userRole: 'ADMIN',   allowedRoles: ['USER','ADMIN'], expectedCode: null,expectNext: true  },
  ])(
    'role=$userRole, allowed=$allowedRoles → expectNext=$expectNext (code=$expectedCode)',
    ({ userRole, allowedRoles, expectedCode, expectNext }) => {
      const user = userRole ? { sub: 'u1', role: userRole } as TokenPayload : undefined;
      const { req, res, next } = makeContext(user);

      const middleware = rbacMiddleware(...allowedRoles);
      middleware(req, res, next);

      if (expectNext) {
        expect((next as jest.Mock).mock.calls[0][0]).toBeUndefined();
      } else {
        expect(next).toHaveBeenCalledWith(
          expect.objectContaining({ statusCode: expectedCode }),
        );
      }
    },
  );
});
