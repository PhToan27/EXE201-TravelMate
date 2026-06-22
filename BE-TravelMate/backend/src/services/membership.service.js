const DEFAULT_PREMIUM_DURATION_DAYS = 30;

const getPremiumDurationDays = () => {
  const configuredDays = Number(process.env.PREMIUM_PACKAGE_DURATION_DAYS);
  return Number.isInteger(configuredDays) && configuredDays > 0
    ? configuredDays
    : DEFAULT_PREMIUM_DURATION_DAYS;
};

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const isFutureDate = (value, now = new Date()) => {
  const date = value ? new Date(value) : null;
  return Boolean(date && !Number.isNaN(date.getTime()) && date > now);
};

const syncPremiumMembership = async (user, now = new Date()) => {
  if (!user || user.package !== 'premium') return user;

  // Give accounts created before expiry tracking one 30-day period from
  // their first membership check, instead of granting indefinite access.
  if (!user.premiumExpiresAt) {
    user.premiumStartedAt = user.premiumStartedAt || now;
    user.premiumExpiresAt = addDays(now, getPremiumDurationDays());
    await user.save();
    return user;
  }

  if (!isFutureDate(user.premiumExpiresAt, now)) {
    user.package = 'free';
    user.premiumStartedAt = null;
    user.premiumExpiresAt = null;
    await user.save();
  }

  return user;
};

const grantPremiumMembership = async (user, durationDays = getPremiumDurationDays(), now = new Date()) => {
  const validDuration = Number.isInteger(Number(durationDays)) && Number(durationDays) > 0
    ? Number(durationDays)
    : getPremiumDurationDays();
  const currentExpiry = isFutureDate(user.premiumExpiresAt, now)
    ? new Date(user.premiumExpiresAt)
    : null;
  const startsAt = currentExpiry || now;

  user.package = 'premium';
  user.premiumStartedAt = currentExpiry ? (user.premiumStartedAt || now) : now;
  user.premiumExpiresAt = addDays(startsAt, validDuration);
  await user.save();
  return user;
};

const revokePremiumMembership = async (user) => {
  user.package = 'free';
  user.premiumStartedAt = null;
  user.premiumExpiresAt = null;
  await user.save();
  return user;
};

module.exports = {
  DEFAULT_PREMIUM_DURATION_DAYS,
  getPremiumDurationDays,
  grantPremiumMembership,
  revokePremiumMembership,
  syncPremiumMembership,
};
