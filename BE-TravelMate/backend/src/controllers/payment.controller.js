const MembershipPaymentOrder = require('../models/MembershipPaymentOrder');
const User = require('../models/User');
const payosService = require('../services/payos.service');
const {
  getPremiumDurationDays,
  grantPremiumMembership,
  syncPremiumMembership,
} = require('../services/membership.service');

const PREMIUM_PACKAGE_PRICE = Number(process.env.PREMIUM_PACKAGE_PRICE || 10000);

const getFrontendUrl = () =>
  process.env.FRONTEND_URL ||
  process.env.WEB_APP_URL ||
  'http://localhost:5173';

const getReturnUrl = () =>
  process.env.PAYOS_RETURN_URL || `${getFrontendUrl()}/?payment=success`;

const getCancelUrl = () =>
  process.env.PAYOS_CANCEL_URL || `${getFrontendUrl()}/?payment=cancel`;

const isPaidPayosData = (data = {}) =>
  data.status === 'PAID' || data.code === '00' || data.desc === 'success';

const normalizePayosData = (payload = {}) => payload.data || payload;

const buildOrderCode = () => Number(Date.now());

const buildOrderResponse = (order, user) => ({
  orderId: order._id,
  orderCode: order.orderCode,
  amount: order.amount,
  status: order.status,
  packageType: order.packageType,
  checkoutUrl: order.checkoutUrl,
  qrCode: order.qrCode,
  deeplink: order.deeplink,
  paymentLinkId: order.paymentLinkId,
  durationDays: order.durationDays,
  premiumStartedAt: order.premiumStartedAt || user?.premiumStartedAt || null,
  premiumExpiresAt: order.premiumExpiresAt || user?.premiumExpiresAt || null,
  userPackage: user?.package,
});

// Claim the order once before granting access. Both the PayOS webhook and the
// client status check may arrive, so only the first request can add a month.
const markOrderPaid = async (order, paymentData = {}) => {
  const updates = {
    status: 'PAID',
    paidAt: order.paidAt || new Date(),
    ...paymentData,
  };
  const paidOrder = await MembershipPaymentOrder.findOneAndUpdate(
    { _id: order._id, status: { $ne: 'PAID' } },
    { $set: updates },
    { new: true }
  );

  if (!paidOrder) {
    const [existingOrder, existingUser] = await Promise.all([
      MembershipPaymentOrder.findByIdAndUpdate(order._id, { $set: paymentData }, { new: true }),
      User.findById(order.userId),
    ]);
    return { order: existingOrder || order, user: existingUser };
  }

  const user = await User.findById(paidOrder.userId);
  if (!user) throw new Error('User not found');

  const upgradedUser = await grantPremiumMembership(user, paidOrder.durationDays);
  paidOrder.premiumStartedAt = upgradedUser.premiumStartedAt;
  paidOrder.premiumExpiresAt = upgradedUser.premiumExpiresAt;
  await paidOrder.save();
  return { order: paidOrder, user: upgradedUser };
};

const createPremiumPayment = async (req, res) => {
  let order;
  try {
    const user = await syncPremiumMembership(await User.findById(req.user._id));
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.package === 'premium') {
      return res.status(400).json({
        success: false,
        message: 'Tai khoan cua ban da la Premium.',
      });
    }

    order = await MembershipPaymentOrder.create({
      userId: user._id,
      orderCode: buildOrderCode(),
      amount: PREMIUM_PACKAGE_PRICE,
      durationDays: getPremiumDurationDays(),
      description: 'TM PREMIUM 30D',
    });

    const payosPayload = await payosService.createPaymentLink({
      orderCode: order.orderCode,
      amount: order.amount,
      description: order.description,
      returnUrl: getReturnUrl(),
      cancelUrl: getCancelUrl(),
      buyerName: user.name,
      buyerEmail: user.email,
    });

    const data = normalizePayosData(payosPayload);
    order.paymentLinkId = data.paymentLinkId;
    order.checkoutUrl = data.checkoutUrl;
    order.qrCode = data.qrCode;
    order.deeplink = data.deeplink;
    order.payosResponse = payosPayload;
    await order.save();

    return res.status(201).json({
      success: true,
      message: 'Da tao link thanh toan PayOS goi Premium.',
      data: buildOrderResponse(order, user),
    });
  } catch (error) {
    if (order) {
      order.status = 'FAILED';
      order.payosResponse = error.payload || { message: error.message };
      await order.save().catch(() => {});
    }

    const status = error.code === 'PAYOS_CONFIG_MISSING' ? 500 : (error.status || 500);
    return res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

const syncPremiumPaymentStatus = async (req, res) => {
  try {
    let order = await MembershipPaymentOrder.findOne({
      orderCode: Number(req.params.orderCode),
      userId: req.user._id,
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Payment order not found' });
    }

    const payosPayload = await payosService.getPaymentLinkInformation(order.orderCode);
    const data = normalizePayosData(payosPayload);

    let user;
    if (isPaidPayosData(data)) {
      const paidResult = await markOrderPaid(order, { payosResponse: payosPayload });
      order = paidResult.order;
      user = paidResult.user;
    } else {
      order.payosResponse = payosPayload;
      if (data.status === 'CANCELLED') {
        order.status = 'CANCELLED';
        order.cancelledAt = order.cancelledAt || new Date();
      } else if (data.status === 'EXPIRED') {
        order.status = 'EXPIRED';
      } else {
        order.status = 'PENDING';
      }
    }

    if (order.status !== 'PAID') await order.save();

    user = user || await syncPremiumMembership(await User.findById(req.user._id));

    return res.json({
      success: true,
      message: order.status === 'PAID' ? 'Thanh toan thanh cong. Tai khoan da len Premium.' : 'Da cap nhat trang thai thanh toan.',
      data: buildOrderResponse(order, user),
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message,
    });
  }
};

const cancelPremiumPayment = async (req, res) => {
  try {
    const order = await MembershipPaymentOrder.findOne({
      orderCode: Number(req.params.orderCode),
      userId: req.user._id,
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Payment order not found' });
    }

    const payload = await payosService.cancelPaymentLink(order.orderCode);
    order.status = 'CANCELLED';
    order.cancelledAt = new Date();
    order.payosResponse = payload;
    await order.save();

    return res.json({
      success: true,
      message: 'Da huy link thanh toan.',
      data: buildOrderResponse(order, req.user),
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message,
    });
  }
};

const handlePayosWebhook = async (req, res) => {
  try {
    const { data, signature } = req.body || {};
    if (!data || !signature) {
      return res.status(400).json({ success: false, message: 'Invalid PayOS webhook payload' });
    }

    if (!payosService.verifySignature(data, signature)) {
      return res.status(400).json({ success: false, message: 'Invalid PayOS webhook signature' });
    }

    const order = await MembershipPaymentOrder.findOne({ orderCode: Number(data.orderCode) });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Payment order not found' });
    }

    if (isPaidPayosData(data)) {
      await markOrderPaid(order, { webhookPayload: req.body });
    } else if (data.status === 'CANCELLED') {
      order.webhookPayload = req.body;
      order.status = 'CANCELLED';
      order.cancelledAt = order.cancelledAt || new Date();
      await order.save();
    }

    // PayOS treats a 2xx response as an acknowledged callback. Keep its
    // standard code/desc fields so the endpoint is also easy to verify in
    // the PayOS webhook tester.
    return res.json({ code: '00', desc: 'success', success: true });
  } catch (error) {
    return res.status(error.code === 'PAYOS_CONFIG_MISSING' ? 500 : 500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createPremiumPayment,
  syncPremiumPaymentStatus,
  cancelPremiumPayment,
  handlePayosWebhook,
};
