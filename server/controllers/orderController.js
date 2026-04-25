const Order = require('../models/Order');
const Cart = require('../models/Cart');

async function getPortOneAccessToken() {
  const secret = process.env.PORTONE_API_SECRET;
  if (!secret) return null;
  const res = await fetch('https://api.portone.io/login/api-secret', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiSecret: secret }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.accessToken || null;
}

async function verifyPayment(paymentId, expectedAmount) {
  const token = await getPortOneAccessToken();
  if (!token) return { verified: false, reason: 'PORTONE_API_SECRET 미설정 (검증 생략)' };

  const res = await fetch(`https://api.portone.io/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return { verified: false, reason: '포트원 결제 조회 실패' };

  const payment = await res.json();
  if (payment.status !== 'PAID') {
    return { verified: false, reason: `결제 상태 불일치: ${payment.status}` };
  }
  if (payment.amount?.total !== expectedAmount) {
    return { verified: false, reason: `결제 금액 불일치: ${payment.amount?.total} !== ${expectedAmount}` };
  }
  return { verified: true };
}

// @desc    주문 생성
// @route   POST /api/orders
exports.createOrder = async (req, res, next) => {
  try {
    const { orderItems, shippingAddress, paymentMethod, paymentResult } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ success: false, message: '주문 상품이 없습니다' });
    }

    if (!paymentResult?.paymentId) {
      return res.status(400).json({ success: false, message: '결제 정보가 없습니다' });
    }

    const existing = await Order.findOne({ 'paymentResult.paymentId': paymentResult.paymentId });
    if (existing) {
      return res.status(409).json({ success: false, message: '이미 처리된 주문입니다' });
    }

    const itemsPrice = orderItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const shippingPrice = itemsPrice >= 50000 ? 0 : 3000;
    const totalPrice = itemsPrice + shippingPrice;

    const { verified, reason } = await verifyPayment(paymentResult.paymentId, totalPrice);

    if (!verified && process.env.PORTONE_API_SECRET) {
      return res.status(400).json({ success: false, message: `결제 검증 실패: ${reason}` });
    }

    const order = await Order.create({
      user: req.user._id,
      orderItems,
      shippingAddress,
      paymentMethod,
      paymentResult,
      itemsPrice,
      shippingPrice,
      totalPrice,
      isPaid: true,
      paidAt: new Date(),
      status: '결제완료',
    });

    // 결제 완료된 주문은 서버 장바구니에서도 제거되어 다른 기기와 즉시 동기화됨
    await Cart.findOneAndUpdate(
      { user: req.user._id },
      { $set: { items: [] } },
      { upsert: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

// @desc    내 주문 목록 조회
// @route   GET /api/orders/my
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({
      user: req.user._id,
      isPaid: true,
    })
      .populate('orderItems.product', 'name images')
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    next(error);
  }
};

// @desc    주문 단건 조회
// @route   GET /api/orders/:id
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (!order) {
      return res.status(404).json({ success: false, message: '주문을 찾을 수 없습니다' });
    }

    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '접근 권한이 없습니다' });
    }

    res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

// @desc    전체 주문 목록 (관리자)
// @route   GET /api/orders
exports.getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ isPaid: true })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    next(error);
  }
};

// @desc    주문 상태 변경 (관리자)
// @route   PUT /api/orders/:id/status
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const patch = { status };
    if (status === '배송완료') {
      patch.isDelivered = true;
      patch.deliveredAt = Date.now();
    }
    if (status === '결제완료') {
      patch.isPaid = true;
      patch.paidAt = new Date();
    }
    const order = await Order.findByIdAndUpdate(req.params.id, patch, { new: true });
    if (!order) {
      return res.status(404).json({ success: false, message: '주문을 찾을 수 없습니다' });
    }
    res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
};
