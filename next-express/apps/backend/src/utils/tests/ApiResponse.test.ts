import { ApiResponse } from '../ApiResponse';

describe('ApiResponse (Unit)', () => {
  describe('success', () => {
    it('should create a success response without message', () => {
      const data = { id: 1, name: 'Test' };
      const response = ApiResponse.success(data);
      
      expect(response).toEqual(expect.objectContaining({
        success: true,
        message: 'Success',
        data,
      }));
    });

    it('should create a success response with message', () => {
      const data = { id: 1 };
      const response = ApiResponse.success(data, 'Operation successful');
      
      expect(response).toEqual(expect.objectContaining({
        success: true,
        message: 'Operation successful',
        data,
      }));
    });
  });

  describe('error', () => {
    it('should create an error response without errors detail', () => {
      const response = ApiResponse.error('Something went wrong');
      
      expect(response).toEqual(expect.objectContaining({
        success: false,
        message: 'Something went wrong',
        data: null,
      }));
    });

    it('should create an error response with errors detail', () => {
      const errors = [{ field: 'name', message: 'Required' }];
      const response = ApiResponse.error('Validation failed', errors);
      
      expect(response).toEqual(expect.objectContaining({
        success: false,
        message: 'Validation failed',
        data: errors,
      }));
    });
  });
});
