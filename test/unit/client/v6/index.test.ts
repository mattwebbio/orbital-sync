import { jest } from '@jest/globals';
import { Blob } from 'node-fetch';
import { ClientV6 } from '../../../../src/client/v6';
import { Host } from '../../../../src/client/host';
import { ErrorNotification } from '../../../../src/notify';
import { Log } from '../../../../src/log';

// Mock modules
jest.mock('node-fetch', () => {
  const originalModule = jest.requireActual('node-fetch');
  return {
    __esModule: true,
    ...originalModule,
    default: jest.fn(),
    Blob: originalModule.Blob,
    FormData: jest.fn().mockImplementation(() => ({
      append: jest.fn(),
      getHeaders: jest.fn()
    }))
  };
});

// Mock file-type
jest.mock('file-type', () => ({
  fileTypeFromBuffer: jest.fn().mockResolvedValue({ ext: 'zip', mime: 'application/zip' })
}));

// Mock fs
jest.mock('fs', () => ({
  mkdtempSync: jest.fn().mockReturnValue('/tmp/mock-dir'),
  writeFileSync: jest.fn(),
  createReadStream: jest.fn().mockReturnValue({}),
  unlinkSync: jest.fn(),
  rmdirSync: jest.fn()
}));

// Mock fetch-cookie
jest.mock('fetch-cookie', () => {
  return jest.fn().mockImplementation(() => jest.fn());
});

// Import after mocks
const nodeFetch = require('node-fetch').default;

describe('Client', () => {
  describe('V6', () => {
    const host = new Host({
      baseUrl: 'http://10.0.0.2',
      password: 'mypassword',
      path: '/admin'
    });
    const log = new Log(false);
    const options = {
      whitelist: true,
      regexWhitelist: true,
      blacklist: true,
      regexList: true,
      adList: true,
      client: true,
      group: true,
      auditLog: false,
      staticDhcpLeases: false,
      localDnsRecords: true,
      localCnameRecords: true,
      flushTables: true
    };

    // Test data
    let mockClient;

    beforeEach(() => {
      // Clear all mocks
      jest.clearAllMocks();
    });

    describe('create', () => {
      test('should throw error if status code is not ok', async () => {
        // Setup
        nodeFetch.mockResolvedValueOnce({
          status: 500,
          json: jest.fn().mockResolvedValueOnce({})
        });

        // Execute & Verify
        try {
          await ClientV6.create({ host, log, options });
          fail('Should have thrown an error');
        } catch (error) {
          expect(error).toBeInstanceOf(ErrorNotification);
          expect(error.message).toContain('There was an error logging in');
          expect(error.verbose.status).toBe(500);
        }
      });

      test('should throw error if no session id is returned', async () => {
        // Setup
        nodeFetch.mockResolvedValueOnce({
          status: 200,
          json: jest.fn().mockResolvedValueOnce({ session: { status: 'error' } })
        });

        // Execute & Verify
        try {
          await ClientV6.create({ host, log, options });
          fail('Should have thrown an error');
        } catch (error) {
          expect(error).toBeInstanceOf(ErrorNotification);
          expect(error.message).toContain('There was an error logging in');
        }
      });

      test('should return client when login successful', async () => {
        // Setup
        nodeFetch.mockResolvedValueOnce({
          status: 200,
          json: jest.fn().mockResolvedValueOnce({ session: { sid: 'test-session-id' } })
        });

        // Execute
        const client = await ClientV6.create({ host, log, options });
        
        // Verify
        expect(client).toBeInstanceOf(ClientV6);
        expect(nodeFetch).toHaveBeenCalledWith(
          'http://10.0.0.2/admin/api/auth',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json'
            }),
            body: JSON.stringify({ password: 'mypassword' })
          })
        );
      });
    });

    describe('downloadBackup', () => {
      let client: ClientV6;

      beforeEach(async () => {
        // Setup mock for client creation
        nodeFetch.mockResolvedValueOnce({
          status: 200,
          json: jest.fn().mockResolvedValueOnce({ session: { sid: 'test-session-id' } })
        });

        client = await ClientV6.create({ host, log, options });
        
        // Reset the mock for the tests
        jest.clearAllMocks();
      });

      test('should throw error if response is non-200', async () => {
        // Setup
        nodeFetch.mockResolvedValueOnce({
          status: 500,
          text: jest.fn().mockResolvedValueOnce('Server error')
        });

        // Execute & Verify
        try {
          await client.downloadBackup();
          fail('Should have thrown an error');
        } catch (error) {
          expect(error).toBeInstanceOf(ErrorNotification);
          expect(error.message).toBe('Failed to download backup from "http://10.0.0.2/admin".');
          expect(error.verbose.status).toBe(500);
        }

        // Verify correct URL and headers
        expect(nodeFetch).toHaveBeenCalledWith(
          'http://10.0.0.2/admin/api/teleporter',
          expect.objectContaining({
            method: 'GET',
            headers: expect.objectContaining({
              'sid': 'test-session-id',
              'accept': 'application/json'
            })
          })
        );
      });

      test('should return response data on successful download', async () => {
        // Setup
        const mockArrayBuffer = new ArrayBuffer(8);
        nodeFetch.mockResolvedValueOnce({
          status: 200,
          arrayBuffer: jest.fn().mockResolvedValueOnce(mockArrayBuffer)
        });

        // Execute
        const backup = await client.downloadBackup();

        // Verify
        expect(backup).toBeInstanceOf(Blob);
        expect(nodeFetch).toHaveBeenCalledWith(
          'http://10.0.0.2/admin/api/teleporter',
          expect.objectContaining({
            method: 'GET',
            headers: expect.objectContaining({
              'sid': 'test-session-id',
              'accept': 'application/json'
            })
          })
        );
      });
    });

    describe('uploadBackup', () => {
      const backup = new Blob([Buffer.from('test-backup-data')]);
      let client: ClientV6;

      beforeEach(async () => {
        // Setup mock for client creation
        nodeFetch.mockResolvedValueOnce({
          status: 200,
          json: jest.fn().mockResolvedValueOnce({ session: { sid: 'test-session-id' } })
        });

        client = await ClientV6.create({ host, log, options });
        
        // Reset the mock for the tests
        jest.clearAllMocks();
      });

      test('should throw error if response is non-200', async () => {
        // Setup
        nodeFetch.mockResolvedValueOnce({
          status: 500,
          text: jest.fn().mockResolvedValueOnce('Server error')
        });

        // Execute & Verify
        try {
          await client.uploadBackup(backup);
          fail('Should have thrown an error');
        } catch (error) {
          expect(error).toBeInstanceOf(ErrorNotification);
          expect(error.message).toBe('Failed to upload backup to "http://10.0.0.2/admin".');
          expect(error.verbose.status).toBe(500);
        }

        // Verify correct URL and headers
        expect(nodeFetch).toHaveBeenCalledWith(
          'http://10.0.0.2/admin/api/teleporter',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'sid': 'test-session-id',
              'accept': 'application/json'
            })
          })
        );
      });

      test('should throw error if response does not end with "OK" or "Done importing"', async () => {
        // Setup
        nodeFetch.mockResolvedValueOnce({
          status: 200,
          text: jest.fn().mockResolvedValueOnce('Error occurred')
        });

        // Execute & Verify
        try {
          await client.uploadBackup(backup);
          fail('Should have thrown an error');
        } catch (error) {
          expect(error).toBeInstanceOf(ErrorNotification);
          expect(error.message).toBe('Failed to upload backup to "http://10.0.0.2/admin".');
          expect(error.verbose.responseBody).toBe('Error occurred');
        }
      });

      test('should upload backup successfully when response contains OK', async () => {
        // Setup
        nodeFetch.mockResolvedValueOnce({
          status: 200,
          text: jest.fn().mockResolvedValueOnce('Import completed OK')
        });

        // Execute
        const result = await client.uploadBackup(backup);

        // Verify
        expect(result).toBe(true);
        expect(nodeFetch).toHaveBeenCalledWith(
          'http://10.0.0.2/admin/api/teleporter',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'sid': 'test-session-id',
              'accept': 'application/json'
            })
          })
        );
      });

      test('should upload backup successfully when response contains Done importing', async () => {
        // Setup
        nodeFetch.mockResolvedValueOnce({
          status: 200,
          text: jest.fn().mockResolvedValueOnce('Done importing')
        });

        // Execute
        const result = await client.uploadBackup(backup);

        // Verify
        expect(result).toBe(true);
        expect(nodeFetch).toHaveBeenCalledWith(
          'http://10.0.0.2/admin/api/teleporter',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'sid': 'test-session-id',
              'accept': 'application/json'
            })
          })
        );
      });
    });

    describe('updateGravity', () => {
      let client: ClientV6;
      let mockFetchCookie;

      beforeEach(async () => {
        // Setup mock for client creation
        nodeFetch.mockResolvedValueOnce({
          status: 200,
          json: jest.fn().mockResolvedValueOnce({ session: { sid: 'test-session-id' } })
        });

        // Create a mock for fetch-cookie that we can control
        mockFetchCookie = jest.fn();
        const fetchCookie = require('fetch-cookie');
        fetchCookie.mockReturnValue(mockFetchCookie);

        client = await ClientV6.create({ host, log, options });
        
        // Reset mocks
        jest.clearAllMocks();
      });

      test('should update gravity successfully', async () => {
        // Setup
        mockFetchCookie.mockResolvedValueOnce({
          status: 200,
          json: jest.fn().mockResolvedValueOnce({ success: true })
        });

        // Execute
        const result = await client.updateGravity();

        // Verify
        expect(result).toBe(true);
        expect(mockFetchCookie).toHaveBeenCalledWith(
          'http://10.0.0.2/admin/api/gravity',
          expect.objectContaining({
            method: 'PUT',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
              'accept': 'application/json',
              'sid': 'test-session-id'
            })
          })
        );
      });

      test('should throw error if gravity update fails', async () => {
        // Setup
        mockFetchCookie.mockResolvedValueOnce({
          status: 200,
          json: jest.fn().mockResolvedValueOnce({ success: false })
        });

        // Execute & Verify
        try {
          await client.updateGravity();
          fail('Should have thrown an error');
        } catch (error) {
          expect(error).toBeInstanceOf(ErrorNotification);
          expect(error.message).toBe('Failed updating gravity on "http://10.0.0.2/admin".');
        }
      });

      test('should throw error if response status is not 200', async () => {
        // Setup
        mockFetchCookie.mockResolvedValueOnce({
          status: 500,
          json: jest.fn().mockResolvedValueOnce({ error: 'Server error' })
        });

        // Execute & Verify
        try {
          await client.updateGravity();
          fail('Should have thrown an error');
        } catch (error) {
          expect(error).toBeInstanceOf(ErrorNotification);
          expect(error.message).toBe('Failed updating gravity on "http://10.0.0.2/admin".');
          expect(error.verbose.status).toBe(500);
        }
      });
    });
  });
});