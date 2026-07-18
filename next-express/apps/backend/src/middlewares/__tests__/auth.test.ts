import { Request, Response, NextFunction } from "express";
import { createAuthMiddleware } from "../../middlewares/auth";
import {
  ITokenProvider,
  TokenPayload,
} from "../../infrastructure/token-provider";
import { AppError } from "../../utils/AppError";

// ─── Helper ───────────────────────────────────────────────────────────────────

function makeContext(authHeader?: string) {
  const req = {
    headers: authHeader ? { authorization: authHeader } : {},
  } as Partial<Request>;

  const res = {} as Response;
  const next: NextFunction = jest.fn();

  return { req: req as Request, res, next };
}

// ─── Token provider mock ──────────────────────────────────────────────────────

const validPayload: TokenPayload = { sub: "user-abc", role: "USER" };

function mockTokenProvider(valid: boolean): ITokenProvider {
  return {
    sign: jest.fn().mockReturnValue("token"),
    verify: valid
      ? jest.fn().mockReturnValue(validPayload)
      : jest.fn().mockImplementation(() => {
          throw new AppError("Invalid token", 401);
        }),
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("authMiddleware (Unit)", () => {
  it("calls next() and attaches req.user on a valid Bearer token", () => {
    const { req, res, next } = makeContext("Bearer valid-token");
    const middleware = createAuthMiddleware(mockTokenProvider(true));

    middleware(req, res, next);

    expect(req.user).toEqual(validPayload);
    expect(next).toHaveBeenCalledWith(/* no args = success */);
    expect((next as jest.Mock).mock.calls[0][0]).toBeUndefined();
  });

  test.each([
    { label: "missing header", header: undefined, expectedStatus: 401 },
    {
      label: "malformed (no Bearer)",
      header: "Token abc",
      expectedStatus: 401,
    },
  ])("throws 401 for $label", ({ header, expectedStatus }) => {
    const { req, res, next } = makeContext(header);
    const middleware = createAuthMiddleware(mockTokenProvider(true));

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: expectedStatus }),
    );
  });

  it("propagates AppError(401) from tokenProvider.verify on invalid/expired token", () => {
    const { req, res, next } = makeContext("Bearer bad-token");
    const middleware = createAuthMiddleware(mockTokenProvider(false));

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401 }),
    );
  });
});
