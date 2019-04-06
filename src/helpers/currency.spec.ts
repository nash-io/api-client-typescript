import { normalizeAmountForMarketPrecision } from '../helpers';

test('normalizes the amount according to the given trade size', async () => {
  expect(normalizeAmountForMarketPrecision('10', 2)).toBe('10.00');
  expect(normalizeAmountForMarketPrecision('10.001', 2)).toBe('10.00');
  expect(normalizeAmountForMarketPrecision('10.001', 6)).toBe('10.001000');
  // normalizeAmountForMarketPrecision('10.1', 0);
});
