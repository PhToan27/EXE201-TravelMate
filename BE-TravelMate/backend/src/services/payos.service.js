const crypto = require('crypto');

const PAYOS_API_BASE_URL = process.env.PAYOS_API_BASE_URL || 'https://api-merchant.payos.vn';

const getPayosConfig = () => {
  const clientId = process.env.PAYOS_CLIENT_ID;
  const apiKey = process.env.PAYOS_API_KEY;
  const checksumKey = process.env.PAYOS_CHECKSUM_KEY;

  if (!clientId || !apiKey || !checksumKey) {
    const error = new Error('PayOS chua duoc cau hinh. Vui long nhap PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY trong .env.');
    error.code = 'PAYOS_CONFIG_MISSING';
    throw error;
  }

  return { clientId, apiKey, checksumKey };
};

const sortObjectByKey = (data = {}) =>
  Object.keys(data)
    .filter((key) => data[key] !== undefined && data[key] !== null)
    .sort()
    .reduce((result, key) => {
      result[key] = data[key];
      return result;
    }, {});

const stringifyValue = (value) => {
  if (Array.isArray(value) || (value && typeof value === 'object')) {
    return JSON.stringify(value);
  }
  return String(value);
};

const buildSignaturePayload = (data = {}) =>
  Object.entries(sortObjectByKey(data))
    .map(([key, value]) => `${key}=${stringifyValue(value)}`)
    .join('&');

const createSignature = (data, checksumKey = getPayosConfig().checksumKey) =>
  crypto
    .createHmac('sha256', checksumKey)
    .update(buildSignaturePayload(data))
    .digest('hex');

const verifySignature = (data, signature) => {
  if (!signature) return false;
  const { checksumKey } = getPayosConfig();
  const expected = createSignature(data, checksumKey);
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== signatureBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
};

const requestPayos = async (path, options = {}) => {
  const { clientId, apiKey } = getPayosConfig();
  const response = await fetch(`${PAYOS_API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': clientId,
      'x-api-key': apiKey,
      ...(options.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || (payload.code && payload.code !== '00')) {
    const error = new Error(payload.desc || payload.message || `PayOS error ${response.status}`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
};

const createPaymentLink = async ({
  orderCode,
  amount,
  description,
  returnUrl,
  cancelUrl,
  buyerName,
  buyerEmail,
}) => {
  const { checksumKey } = getPayosConfig();
  const signatureData = {
    amount,
    cancelUrl,
    description,
    orderCode,
    returnUrl,
  };
  const body = {
    ...signatureData,
    buyerName,
    buyerEmail,
    items: [
      {
        name: 'TravelMate Premium',
        quantity: 1,
        price: amount,
      },
    ],
    signature: createSignature(signatureData, checksumKey),
  };

  return requestPayos('/v2/payment-requests', {
    method: 'POST',
    body: JSON.stringify(body),
  });
};

const getPaymentLinkInformation = (orderCode) =>
  requestPayos(`/v2/payment-requests/${orderCode}`);

const cancelPaymentLink = (orderCode, cancellationReason = 'User cancelled payment') =>
  requestPayos(`/v2/payment-requests/${orderCode}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ cancellationReason }),
  });

module.exports = {
  buildSignaturePayload,
  createPaymentLink,
  createSignature,
  getPaymentLinkInformation,
  cancelPaymentLink,
  verifySignature,
};
