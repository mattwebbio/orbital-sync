import { parseSchema } from '../../../src/config/parse';
import { asConst } from 'json-schema-to-ts';

describe('Config', () => {
  describe('parseSchema', () => {
    const initialEnv = Object.assign({}, process.env);

    afterEach(() => {
      process.env = Object.assign({}, initialEnv);
    });

    describe('array', () => {
      test('should parse array of objects', () => {
        process.env['1_VAR_ONE'] = 'mock_value_1';
        process.env['1_VAR_TWO'] = 'mock_value_2';
        process.env['2_VAR_ONE'] = 'mock_value_3';

        // @ts-expect-error type instantiation is excessively deep and possibly infinite
        const parsed = parseSchema(
          asConst({
            type: 'array',
            items: {
              type: 'object',
              properties: {
                varOne: {
                  type: 'string'
                },
                varTwo: {
                  type: 'string'
                }
              },
              required: ['varOne']
            }
          })
        );

        expect(parsed).toEqual([
          { varOne: 'mock_value_1', varTwo: 'mock_value_2' },
          { varOne: 'mock_value_3' }
        ]);
      });

      test('should exclude array items with missing required properties', () => {
        process.env['1_VAR_ONE'] = 'mock_value_1';
        process.env['1_VAR_TWO'] = 'mock_value_2';
        process.env['2_VAR_TWO'] = 'mock_value_3';
        process.env['3_VAR_ONE'] = 'mock_value_4';

        const parsed = parseSchema(
          asConst({
            type: 'array',
            items: {
              type: 'object',
              properties: {
                varOne: {
                  type: 'string'
                },
                varTwo: {
                  type: 'string'
                }
              },
              required: ['varOne']
            }
          })
        );

        expect(parsed).toEqual([{ varOne: 'mock_value_1', varTwo: 'mock_value_2' }]);
      });

      test('should not error if no items contain required properties if no minLength', () => {
        process.env['1_VAR_TWO'] = 'mock_value_1';
        process.env['2_VAR_TWO'] = 'mock_value_2';

        const parsed = parseSchema(
          asConst({
            type: 'array',
            items: {
              type: 'object',
              properties: {
                varOne: {
                  type: 'string'
                },
                varTwo: {
                  type: 'string'
                }
              },
              required: ['varOne']
            }
          })
        );

        expect(parsed).toEqual([]);
      });

      test('should throw an error if items is not defined', () => {
        expect(() =>
          parseSchema(
            asConst({
              type: 'array'
            })
          )
        ).toThrow('Undefined array items for root');
      });

      test('should template custom env vars', () => {
        process.env['VAR_1'] = 'mock_value_1';
        process.env['2_VAR'] = 'mock_value_2';
        process.env['VAR_2'] = 'mock_value_3';

        const parsed = parseSchema(
          asConst({
            type: 'array',
            items: {
              type: 'object',
              properties: {
                var: {
                  type: 'string',
                  envVar: 'VAR_{{i}}'
                }
              }
            }
          })
        );

        expect(parsed).toEqual([{ var: 'mock_value_1' }, { var: 'mock_value_2' }]);
      });

      test('should ignore objects with no properties', () => {
        const parsed = parseSchema(
          asConst({
            type: 'array',
            items: {
              type: 'object',
              properties: {
                var: {
                  type: 'string'
                }
              }
            }
          })
        );

        expect(parsed).toEqual([]);
      });

      test('should not error if below minItems but no required values', () => {
        const parsed = parseSchema(
          asConst({
            type: 'array',
            items: {
              type: 'object',
              properties: {
                varOne: {
                  type: 'string'
                }
              }
            },
            minItems: 1
          })
        );

        expect(parsed).toEqual([]);
      });

      test('should error if missing properties below minlength', () => {
        process.env['1_VAR_TWO'] = 'mock_value_1';
        process.env['2_VAR_TWO'] = 'mock_value_2';

        expect(() =>
          parseSchema(
            asConst({
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  varOne: {
                    type: 'string'
                  },
                  varTwo: {
                    type: 'string'
                  }
                },
                required: ['varOne']
              },
              minItems: 1
            })
          )
        ).toThrow('Missing required properties for "1": varOne');
      });

      test('should accept overrides', () => {
        process.env['1_VAR_ONE'] = 'mock_value_1';
        process.env['1_VAR_TWO'] = 'mock_value_2';
        process.env['2_VAR_ONE'] = 'mock_value_3';
        process.env['2_VAR_TWO'] = 'mock_value_4';

        const parsed = parseSchema(
          asConst({
            type: 'array',
            items: {
              type: 'object',
              properties: {
                varOne: {
                  type: 'string'
                },
                varTwo: {
                  type: 'string'
                }
              },
              required: ['varOne']
            }
          }),
          { overrides: [{ varTwo: 'override_value' }] as any }
        );

        expect(parsed).toEqual([
          { varOne: 'mock_value_1', varTwo: 'override_value' },
          { varOne: 'mock_value_3', varTwo: 'mock_value_4' }
        ]);
      });
    });

    describe('object', () => {
      test('should parse object', () => {
        process.env['VAR_ONE'] = 'mock_value_1';
        process.env['VAR_TWO'] = 'mock_value_2';

        const parsed = parseSchema(
          asConst({
            type: 'object',
            properties: {
              varOne: {
                type: 'string'
              },
              varTwo: {
                type: 'string'
              }
            },
            required: ['varOne']
          })
        );

        expect(parsed).toEqual({ varOne: 'mock_value_1', varTwo: 'mock_value_2' });
      });

      test('should throw error if required properties are missing', () => {
        process.env['VAR_TWO'] = 'mock_value_2';

        expect(() =>
          parseSchema(
            asConst({
              type: 'object',
              properties: {
                varOne: {
                  type: 'string'
                },
                varTwo: {
                  type: 'string'
                }
              },
              required: ['varOne']
            })
          )
        ).toThrow('Missing required properties for root: varOne');
      });

      test('should not throw an error if required properties have defaults', () => {
        process.env['VAR_TWO'] = 'mock_value_2';

        const parsed = parseSchema(
          asConst({
            type: 'object',
            properties: {
              varOne: {
                type: 'string',
                default: 'default_value'
              },
              varTwo: {
                type: 'string'
              }
            },
            required: ['varOne']
          })
        );

        expect(parsed).toEqual({ varOne: 'default_value', varTwo: 'mock_value_2' });
      });

      test('should allow objects to require objects', () => {
        process.env['VAR_ONE_VAR'] = 'mock_value_1';
        process.env['VAR_TWO'] = 'mock_value_2';

        const parsed = parseSchema(
          asConst({
            type: 'object',
            properties: {
              varOne: {
                type: 'object',
                properties: {
                  var: {
                    type: 'string'
                  }
                },
                required: ['var']
              },
              varTwo: {
                type: 'string'
              }
            },
            required: ['varOne']
          })
        );

        expect(parsed).toEqual({
          varOne: { var: 'mock_value_1' },
          varTwo: 'mock_value_2'
        });
      });

      test('should throw error if properties are not defined', () => {
        expect(() =>
          parseSchema(
            asConst({
              type: 'object'
            })
          )
        ).toThrow('Undefined object properties for root');
      });
    });

    describe('boolean', () => {
      test('should parse boolean', () => {
        process.env['VAR'] = 'true';

        const parsed = parseSchema(
          asConst({
            type: 'object',
            properties: {
              var: {
                type: 'boolean'
              }
            }
          })
        );

        expect(parsed).toEqual({ var: true });
      });

      test('should not throw error if required boolean is false', () => {
        process.env['VAR'] = 'false';

        const parsed = parseSchema(
          asConst({
            type: 'object',
            properties: {
              var: {
                type: 'boolean'
              }
            },
            required: ['var']
          })
        );

        expect(parsed).toEqual({ var: false });
      });

      test('should throw error if boolean is invalid', () => {
        process.env['VAR'] = 'invalid';

        expect(() =>
          parseSchema(
            asConst({
              type: 'object',
              properties: {
                var: {
                  type: 'boolean'
                }
              }
            })
          )
        ).toThrow("Invalid boolean for \"var\": expected 'true' or 'false'");
      });
    });

    describe('number', () => {
      test('should parse number', () => {
        process.env['VAR'] = '1';

        const parsed = parseSchema(
          asConst({
            type: 'object',
            properties: {
              var: {
                type: 'number'
              }
            }
          })
        );

        expect(parsed).toEqual({ var: 1 });
      });

      test('should not throw error if required number is 0', () => {
        process.env['VAR'] = '0';

        const parsed = parseSchema(
          asConst({
            type: 'object',
            properties: {
              var: {
                type: 'number'
              }
            },
            required: ['var']
          })
        );

        expect(parsed).toEqual({ var: 0 });
      });

      test('should throw error if number is invalid', () => {
        process.env['VAR'] = 'invalid';

        expect(() =>
          parseSchema(
            asConst({
              type: 'object',
              properties: {
                var: {
                  type: 'number'
                }
              }
            })
          )
        ).toThrow('Invalid number for "var": expected a number');
      });
    });

    test('throws if schema is not an object', () => {
      // @ts-expect-error testing invalid input
      expect(() => parseSchema(false)).toThrow('Invalid schema for root');
    });
  });
});
