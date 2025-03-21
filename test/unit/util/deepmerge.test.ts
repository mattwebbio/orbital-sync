import { deepMerge } from '../../../src/util/deepmerge';

describe('Deep Merging', () => {
  describe('deepMerge', () => {
    it('should merge several objects recursively', () => {
      const objA = {
        thing1: {
          thingA: ['onetwothree', 'fourfivesix']
        },
        thing2: {
          thingC: {
            thingD: true
          }
        }
      };
      const objB = {
        thing1: {
          thingB: ['seveneightnine', 'teneleventwelve']
        },
        thing2: {
          thingC: {
            thingF: false
          }
        }
      };
      const result = {
        thing1: {
          thingA: ['onetwothree', 'fourfivesix'],
          thingB: ['seveneightnine', 'teneleventwelve']
        },
        thing2: {
          thingC: {
            thingD: true,
            thingF: false
          }
        }
      };
      expect(deepMerge({}, objA, objB)).toStrictEqual(result);
    });
  });
});
