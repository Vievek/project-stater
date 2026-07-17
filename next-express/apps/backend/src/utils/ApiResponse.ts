export class ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;

  constructor(success: boolean, message: string, data: T | null = null) {
    this.success = success;
    this.message = message;
    this.data = data;
  }

  static success<T>(data: T, message: string = 'Success') {
    return new ApiResponse(true, message, data);
  }

  static error(message: string, data: any = null) {
    return new ApiResponse(false, message, data);
  }
}

// Usage in controller:
// res.status(200).json(ApiResponse.success(user));
// res.status(404).json(ApiResponse.error('User not found'));
