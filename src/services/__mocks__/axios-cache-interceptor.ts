const mockSetupCache = jest.fn((axiosInstance, _config) => axiosInstance);
const mockBuildMemoryStorage = jest.fn();

export const setupCache = mockSetupCache;
export const buildMemoryStorage = mockBuildMemoryStorage;
