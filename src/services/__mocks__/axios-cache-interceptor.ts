import { vi } from 'vitest';

const mockSetupCache = vi.fn((axiosInstance, _config) => axiosInstance);
const mockBuildMemoryStorage = vi.fn();

export const setupCache = mockSetupCache;
export const buildMemoryStorage = mockBuildMemoryStorage;
