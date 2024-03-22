import { camelToTitleCase } from '../../../src/util/string-case';

describe('String Case', () => {
  describe('camelToTitleCase', () => {
    it('should convert camel case to title case', () => {
      expect(camelToTitleCase('camelCase')).toBe('Camel Case');
    });
  });
});
