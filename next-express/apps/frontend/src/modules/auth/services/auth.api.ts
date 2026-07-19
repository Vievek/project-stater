import { BaseApiClient, ApiResponse } from "@/lib/api/base-client";
import { AuthResponse, LoginCredentials, RegisterCredentials } from "../types/auth.types";

class AuthApiClient extends BaseApiClient<any> {
  constructor() {
    super("/api/auth");
  }

  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    return this.fetch<AuthResponse>("/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

  async register(credentials: RegisterCredentials): Promise<ApiResponse<AuthResponse>> {
    return this.fetch<AuthResponse>("/register", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }
}

export const authApi = new AuthApiClient();
