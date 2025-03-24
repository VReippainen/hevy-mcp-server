// Mock axios and axios-cache-interceptor before importing the module
import axios from 'axios';

jest.mock('axios');
jest.mock('axios-cache-interceptor');

// Create mock axios instance
const mockAxiosGet = jest.fn();
const mockAxiosInstance = { get: mockAxiosGet };
(axios.create as jest.Mock).mockReturnValue(mockAxiosInstance);

// Now import the module that uses axios
import { get } from '../api';

describe('API Service', () => {
  const mockBaseUrl = 'https://api.example.com/endpoint';

  beforeEach(() => {
    jest.clearAllMocks();
    mockAxiosGet.mockReset();
  });

  describe('get function', () => {
    it('should make a GET request with the correct URL', async () => {
      const expectedData = { someKey: 'test data' };
      mockAxiosGet.mockResolvedValueOnce({ data: expectedData });

      const result = await get(mockBaseUrl);

      expect(mockAxiosGet).toHaveBeenCalledTimes(1);
      expect(mockAxiosGet).toHaveBeenCalledWith(mockBaseUrl, {
        params: {},
      });
      expect(result).toEqual(expectedData);
    });

    it('should append query parameters to the URL', async () => {
      const expectedData = { someKey: 'test data with params' };
      mockAxiosGet.mockResolvedValueOnce({ data: expectedData });

      const params = {
        page: 1,
        limit: 10,
        filter: 'active',
      };

      const result = await get(mockBaseUrl, params);

      expect(mockAxiosGet).toHaveBeenCalledTimes(1);
      expect(mockAxiosGet).toHaveBeenCalledWith(mockBaseUrl, {
        params: {
          page: '1',
          limit: '10',
          filter: 'active',
        },
      });
      expect(result).toEqual(expectedData);
    });

    it('should filter out undefined values from query parameters', async () => {
      // Mock successful response
      mockAxiosGet.mockResolvedValue({ data: { data: 'filtered params' } });

      // Call the function with query parameters including undefined values
      const result = await get('https://api.example.com/endpoint', {
        page: 1,
        limit: undefined,
        filter: 'active',
      });

      // Check if axios was called with the correct parameters (undefined params should be filtered out)
      expect(mockAxiosGet).toHaveBeenCalledWith('https://api.example.com/endpoint', {
        params: {
          page: '1',
          filter: 'active',
        },
      });
      expect(result).toEqual({ data: 'filtered params' });
    });

    describe('error handling', () => {
      it('should handle API request errors', async () => {
        const errorMessage = 'Request failed with status code 404';
        mockAxiosGet.mockRejectedValueOnce(new Error(errorMessage));

        await expect(get(mockBaseUrl)).rejects.toThrow(errorMessage);
        expect(mockAxiosGet).toHaveBeenCalledTimes(1);
      });

      it('should handle network errors', async () => {
        const errorMessage = 'Network error';
        mockAxiosGet.mockRejectedValueOnce(new Error(errorMessage));

        await expect(get(mockBaseUrl)).rejects.toThrow(errorMessage);
        expect(mockAxiosGet).toHaveBeenCalledTimes(1);
      });
    });
  });
});
