/**
 * Simple edge-friendly base64 URL decoding to extract JWT payload without full verification.
 * The backend API routes will handle the actual signature verification.
 */
function decodeJwtPayload(token: string) {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    
    // Replace base64 URL characters with standard base64 characters
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    // Decode base64
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to parse JWT', error);
    return null;
  }
}

export type Role = 'ADMIN' | 'USER';

/**
 * Route protection configuration.
 * Maps path prefixes to the required roles to access them.
 */
export const routeRoles: Record<string, Role[]> = {
  '/admin': ['ADMIN'],
  // Add more protected routes here...
};

/**
 * Determines if the given user role is authorized to access the requested pathname based on the configuration.
 */
export function isAuthorized(pathname: string, token?: string): boolean {
  // Find if this path requires specific roles
  let requiredRoles: Role[] | null = null;
  for (const [route, roles] of Object.entries(routeRoles)) {
    if (pathname.startsWith(route)) {
      requiredRoles = roles;
      break;
    }
  }

  // If no roles required, it's authorized
  if (!requiredRoles) {
    return true;
  }

  // If roles are required but no token is present
  if (!token) {
    return false;
  }

  // Extract role from token
  const payload = decodeJwtPayload(token);
  const userRole = payload?.role as Role | undefined;

  // Check if user has the required role
  if (userRole && requiredRoles.includes(userRole)) {
    return true;
  }

  return false;
}
