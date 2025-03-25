/**
 * Tests for the API service module
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Import the mocked module - Vitest will automatically use the manual mock from __mocks__ folder
import { get } from '../api';
// Import the exported mock function
import { __mockGet as mockGet } from '../__mocks__/api';

// Tell Vitest to use the mock
vi.mock('../api');

describe('API Service', () => {
  const mockBaseUrl = 'https://api.example.com/endpoint';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('get function', () => {
    it('should make a GET request with the correct URL', async () => {
      // Arrange
      const expectedData = { someKey: 'test data' };
      mockGet.mockResolvedValueOnce({ data: expectedData });

      // Act
      const result = await get(mockBaseUrl);

      // Assert
      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith(mockBaseUrl, {
        params: {},
      });
      expect(result).toEqual(expectedData);
    });

    it('should append query parameters to the URL', async () => {
      // Arrange
      const expectedData = { someKey: 'test data with params' };
      mockGet.mockResolvedValueOnce({ data: expectedData });

      const params = {
        page: 1,
        limit: 10,
        filter: 'active',
      };

      // Act
      const result = await get(mockBaseUrl, params);

      // Assert
      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith(mockBaseUrl, {
        params: {
          page: '1',
          limit: '10',
          filter: 'active',
        },
      });
      expect(result).toEqual(expectedData);
    });

    it('should filter out undefined values from query parameters', async () => {
      // Arrange
      const expectedData = { data: 'filtered params' };
      mockGet.mockResolvedValueOnce({ data: expectedData });

      // Act
      const result = await get('https://api.example.com/endpoint', {
        page: 1,
        limit: undefined,
        filter: 'active',
      });

      // Assert
      expect(mockGet).toHaveBeenCalledWith('https://api.example.com/endpoint', {
        params: {
          page: '1',
          filter: 'active',
        },
      });
      expect(result).toEqual(expectedData);
    });

    describe('error handling', () => {
      it('should handle API request errors', async () => {
        // Arrange
        const errorMessage = 'Request failed with status code 404';
        mockGet.mockRejectedValueOnce(new Error(errorMessage));

        // Act & Assert
        await expect(get(mockBaseUrl)).rejects.toThrow(errorMessage);
        expect(mockGet).toHaveBeenCalledTimes(1);
      });

      it('should handle network errors', async () => {
        // Arrange
        const errorMessage = 'Network error';
        mockGet.mockRejectedValueOnce(new Error(errorMessage));

        // Act & Assert
        await expect(get(mockBaseUrl)).rejects.toThrow(errorMessage);
        expect(mockGet).toHaveBeenCalledTimes(1);
      });
    });
  });
});
