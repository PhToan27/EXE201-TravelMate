const test = require('node:test');
const assert = require('node:assert/strict');
const {
  grantPremiumMembership,
  syncPremiumMembership,
} = require('../src/services/membership.service');

const makeUser = (values = {}) => ({
  package: 'free',
  premiumStartedAt: null,
  premiumExpiresAt: null,
  saves: 0,
  async save() {
    this.saves += 1;
    return this;
  },
  ...values,
});

test('Premium payment grants exactly 30 days', async () => {
  const user = makeUser();
  const now = new Date('2026-06-22T00:00:00.000Z');

  await grantPremiumMembership(user, 30, now);

  assert.equal(user.package, 'premium');
  assert.equal(user.premiumStartedAt.toISOString(), now.toISOString());
  assert.equal(user.premiumExpiresAt.toISOString(), '2026-07-22T00:00:00.000Z');
});

test('Renewal extends from the current expiry date', async () => {
  const user = makeUser({
    package: 'premium',
    premiumStartedAt: new Date('2026-06-01T00:00:00.000Z'),
    premiumExpiresAt: new Date('2026-07-01T00:00:00.000Z'),
  });

  await grantPremiumMembership(user, 30, new Date('2026-06-22T00:00:00.000Z'));

  assert.equal(user.premiumExpiresAt.toISOString(), '2026-07-31T00:00:00.000Z');
});

test('Expired Premium membership reverts to free', async () => {
  const user = makeUser({
    package: 'premium',
    premiumStartedAt: new Date('2026-05-01T00:00:00.000Z'),
    premiumExpiresAt: new Date('2026-06-01T00:00:00.000Z'),
  });

  await syncPremiumMembership(user, new Date('2026-06-22T00:00:00.000Z'));

  assert.equal(user.package, 'free');
  assert.equal(user.premiumStartedAt, null);
  assert.equal(user.premiumExpiresAt, null);
});
