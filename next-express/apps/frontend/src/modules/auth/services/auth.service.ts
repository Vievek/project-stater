import { authApi } from "./auth.api";
import { LoginCredentials, RegisterCredentials } from "../types/auth.types";

export const authService = {
  async login(credentials: LoginCredentials) {
    const response = await authApi.login(credentials);
    if (!response.success) {
      throw new Error(response.error?.message || "Login failed");
    }
    return response.data;
  },

  async register(credentials: RegisterCredentials) {
    const response = await authApi.register(credentials);
    if (!response.success) {
      throw new Error(response.error?.message || "Registration failed");
    }
    return response.data;
  }
};
