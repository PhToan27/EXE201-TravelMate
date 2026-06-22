const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const {
  buildSignaturePayload,
  createSignature,
} = require('../src/services/payos.service');

test('PayOS signature payload sorts keys alphabetically', () => {
  const payload = buildSignaturePayload({
    returnUrl: 'https://example.com/return',
    amount: 10000,
    orderCode: 123,
    description: 'PREMIUM',
    cancelUrl: 'https://example.com/cancel',
  });

  assert.equal(
    payload,
    'amount=10000&cancelUrl=https://example.com/cancel&description=PREMIUM&orderCode=123&returnUrl=https://example.com/return'
  );
});

test('PayOS signature uses HMAC SHA256 checksum key', () => {
  const data = {
    amount: 10000,
    cancelUrl: 'https://example.com/cancel',
    description: 'PREMIUM',
    orderCode: 123,
    returnUrl: 'https://example.com/return',
  };
  const checksumKey = 'test-checksum-key';
  const expected = crypto
    .createHmac('sha256', checksumKey)
    .update(buildSignaturePayload(data))
    .digest('hex');

  assert.equal(createSignature(data, checksumKey), expected);
});
