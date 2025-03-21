import { get } from '../api';

// Mock global fetch
global.fetch = jest.fn();

describe('API Service', () => {
  beforeEach(() => {
    // Clear all mock instances before each test
    jest.clearAllMocks();
  });

  describe('get function', () => {
    it('should make a GET request with the correct URL', async () => {
      // Mock successful response
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ data: 'test data' }),
      };
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      // Call the function
      const result = await get('https://api.example.com/endpoint');

      // Check if fetch was called correctly
      expect(fetch).toHaveBeenCalledWith('https://api.example.com/endpoint');
      expect(result).toEqual({ data: 'test data' });
    });

    it('should append query parameters to the URL', async () => {
      // Mock successful response
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ data: 'test data with params' }),
      };
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      // Call the function with query parameters
      const result = await get('https://api.example.com/endpoint', {
        page: 1,
        limit: 10,
        filter: 'active',
      });

      // Check if fetch was called with the correct URL including query parameters
      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/endpoint?page=1&limit=10&filter=active'
      );
      expect(result).toEqual({ data: 'test data with params' });
    });

    it('should filter out undefined values from query parameters', async () => {
      // Mock successful response
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ data: 'filtered params' }),
      };
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      // Call the function with query parameters including undefined values
      const result = await get('https://api.example.com/endpoint', {
        page: 1,
        limit: undefined,
        filter: 'active',
      });

      // Check if fetch was called with the correct URL (undefined params should be filtered out)
      expect(fetch).toHaveBeenCalledWith('https://api.example.com/endpoint?page=1&filter=active');
      expect(result).toEqual({ data: 'filtered params' });
    });

    it('should throw an error when the API request fails', async () => {
      // Mock failed response
      const mockResponse = {
        ok: false,
        status: 404,
      };
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      // Call the function and expect it to throw
      await expect(get('https://api.example.com/endpoint')).rejects.toThrow(
        'API request failed with status 404'
      );
    });

    it('should handle network errors', async () => {
      // Mock network error
      const networkError = new Error('Network error');
      (fetch as jest.Mock).mockRejectedValue(networkError);

      // Call the function and expect it to throw the same error
      await expect(get('https://api.example.com/endpoint')).rejects.toThrow('Network error');
    });
  });
});
