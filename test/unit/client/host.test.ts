import { Host } from '../../../src/client/host';

describe('Client', () => {
  describe('Host', () => {
    test('should prepend / to path if not present', () => {
      const host = new Host({
        baseUrl: 'http://10.0.0.3',
        path: 'foobar',
        password: 'mock'
      });

      expect(host.path).toBe('/foobar');
      expect(host.fullUrl).toBe('http://10.0.0.3/foobar');
    });

    test('should remove trailing slash if present', () => {
      const host = new Host({
        baseUrl: 'http://10.0.0.3',
        path: '/foobar/',
        password: 'mock'
      });

      expect(host.path).toBe('/foobar');
      expect(host.fullUrl).toBe('http://10.0.0.3/foobar');
    });

    test('separates path and baseUrl if baseUrl has path', () => {
      const host = new Host({ baseUrl: 'http://10.0.0.3/foobar', password: 'mock' });

      expect(host.path).toBe('/foobar');
      expect(host.fullUrl).toBe('http://10.0.0.3/foobar');
    });

    test('should strip /admin from the end', async () => {
      const host = new Host({
        baseUrl: 'http://10.0.0.2',
        password: 'mypassword',
        path: '/admin'
      });

      expect(host.fullUrl).toBe('http://10.0.0.2');
      expect(host.baseUrl).toBe('http://10.0.0.2');
      expect(host.path).toBe('');
    });

    test('should strip /api from the end', async () => {
      const host = new Host({
        baseUrl: 'http://pi-iot.domain.net/bob/',
        password: 'mypassword',
        path: '/api'
      });

      expect(host.fullUrl).toBe('http://pi-iot.domain.net/bob');
      expect(host.baseUrl).toBe('http://pi-iot.domain.net');
      expect(host.path).toBe('/bob');
    });
  });
});
