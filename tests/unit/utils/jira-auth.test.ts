import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ERROR_MESSAGES } from '../../../src/config/constants.js';

// Mock axios so getAuthenticatedClient / getMultipartClient don't make real requests
vi.mock('axios', () => {
  const instance = {
    request: vi.fn(),
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  };
  return {
    default: { create: vi.fn(() => instance) },
  };
});

vi.mock('../../../src/utils/logger.js', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('jira-auth', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.JIRA_BASE_URL = 'https://test.atlassian.net';
    process.env.JIRA_EMAIL = 'test@example.com';
    process.env.JIRA_API_TOKEN = 'test-api-token';
  });

  describe('validateAuth', () => {
    it('should return config with email when JIRA_EMAIL is set', async () => {
      const { validateAuth } = await import('../../../src/utils/jira-auth.js');
      const auth = validateAuth();
      expect(auth).toEqual({
        baseUrl: 'https://test.atlassian.net',
        email: 'test@example.com',
        apiToken: 'test-api-token',
      });
    });

    it('should return config without email when JIRA_EMAIL is not set', async () => {
      delete process.env.JIRA_EMAIL;
      const { validateAuth } = await import('../../../src/utils/jira-auth.js');
      const auth = validateAuth();
      expect(auth).toEqual({
        baseUrl: 'https://test.atlassian.net',
        apiToken: 'test-api-token',
      });
      expect(auth).not.toHaveProperty('email');
    });

    it('should normalize trailing slash on base URL', async () => {
      process.env.JIRA_BASE_URL = 'https://test.atlassian.net/';
      const { validateAuth } = await import('../../../src/utils/jira-auth.js');
      const auth = validateAuth();
      expect(auth.baseUrl).toBe('https://test.atlassian.net');
    });

    it('should throw when JIRA_BASE_URL is missing', async () => {
      delete process.env.JIRA_BASE_URL;
      const { validateAuth } = await import('../../../src/utils/jira-auth.js');
      expect(() => validateAuth()).toThrow(ERROR_MESSAGES.AUTH_REQUIRED);
    });

    it('should throw when JIRA_API_TOKEN is missing', async () => {
      delete process.env.JIRA_API_TOKEN;
      const { validateAuth } = await import('../../../src/utils/jira-auth.js');
      expect(() => validateAuth()).toThrow(ERROR_MESSAGES.AUTH_REQUIRED);
    });

    it('should not throw when only JIRA_EMAIL is missing', async () => {
      delete process.env.JIRA_EMAIL;
      const { validateAuth } = await import('../../../src/utils/jira-auth.js');
      expect(() => validateAuth()).not.toThrow();
    });

    it('should treat empty JIRA_EMAIL as absent', async () => {
      process.env.JIRA_EMAIL = '';
      const { validateAuth } = await import('../../../src/utils/jira-auth.js');
      const auth = validateAuth();
      expect(auth).not.toHaveProperty('email');
    });
  });

  describe('getAuthenticatedClient', () => {
    it('should use Basic Auth when JIRA_EMAIL is set', async () => {
      const axios = (await import('axios')).default;
      const { getAuthenticatedClient } = await import('../../../src/utils/jira-auth.js');

      getAuthenticatedClient();

      const expected = `Basic ${Buffer.from('test@example.com:test-api-token').toString('base64')}`;
      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expected,
          }),
        })
      );
    });

    it('should use Bearer Auth when JIRA_EMAIL is not set', async () => {
      delete process.env.JIRA_EMAIL;
      const axios = (await import('axios')).default;
      const { getAuthenticatedClient } = await import('../../../src/utils/jira-auth.js');

      getAuthenticatedClient();

      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-api-token',
          }),
        })
      );
    });

    it('should set correct baseURL with API v3 path for Cloud', async () => {
      const axios = (await import('axios')).default;
      const { getAuthenticatedClient } = await import('../../../src/utils/jira-auth.js');

      getAuthenticatedClient();

      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://test.atlassian.net/rest/api/3',
        })
      );
    });

    it('should set correct baseURL with API v2 path for Data Center', async () => {
      delete process.env.JIRA_EMAIL;
      const axios = (await import('axios')).default;
      const { getAuthenticatedClient } = await import('../../../src/utils/jira-auth.js');

      getAuthenticatedClient();

      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://test.atlassian.net/rest/api/2',
        })
      );
    });

    it('should return the same instance on subsequent calls', async () => {
      const { getAuthenticatedClient } = await import('../../../src/utils/jira-auth.js');
      const first = getAuthenticatedClient();
      const second = getAuthenticatedClient();
      expect(first).toBe(second);
    });
  });

  describe('getMultipartClient', () => {
    it('should use Basic Auth when JIRA_EMAIL is set', async () => {
      const axios = (await import('axios')).default;
      const { getMultipartClient } = await import('../../../src/utils/jira-auth.js');

      getMultipartClient();

      const expected = `Basic ${Buffer.from('test@example.com:test-api-token').toString('base64')}`;
      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expected,
          }),
        })
      );
    });

    it('should use Bearer Auth when JIRA_EMAIL is not set', async () => {
      delete process.env.JIRA_EMAIL;
      const axios = (await import('axios')).default;
      const { getMultipartClient } = await import('../../../src/utils/jira-auth.js');

      getMultipartClient();

      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-api-token',
          }),
        })
      );
    });

    it('should include X-Atlassian-Token header', async () => {
      const axios = (await import('axios')).default;
      const { getMultipartClient } = await import('../../../src/utils/jira-auth.js');

      getMultipartClient();

      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Atlassian-Token': 'no-check',
          }),
        })
      );
    });
  });
});
