import { Client } from '../client';

test('calling multiple API calls does not block the WASM program', async () => {
  const client = new Client();
  const result = await Promise.all([
    client.listMarkets(),
    client.getMarket('eth_neo'),
    client.listCandles('eth_neo')
  ]);

  expect(result).toHaveLength(3);
});

test('can login multiple clients without blocking the WASM program', async () => {
  const client1 = new Client();
  const client2 = new Client();

  const email = 'test@nash.io';
  const password =
    'af0782580bb2ec65b72cb184cf729dd16dfd5669ae247c64aa8d6d01b6ed8a34';

  await Promise.all([
    client1.login(email, password),
    client2.login(email, password)
  ]);
});
