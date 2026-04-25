const Cart = require('../models/Cart');
const Product = require('../models/Product');

function normalizeIncomingItems(rawItems) {
  if (!Array.isArray(rawItems)) return [];

  const byId = new Map();
  for (const item of rawItems) {
    const id =
      item?.product?._id ||
      item?.product?.id ||
      item?.product ||
      item?._id ||
      item?.id;
    if (!id) continue;
    const key = String(id);
    const quantity = Math.max(1, Number(item?.quantity) || 1);
    byId.set(key, (byId.get(key) || 0) + quantity);
  }

  return Array.from(byId.entries()).map(([productId, quantity]) => ({
    productId,
    quantity,
  }));
}

async function buildCartItems(rawItems) {
  const normalized = normalizeIncomingItems(rawItems);
  if (normalized.length === 0) return [];

  const ids = normalized.map((x) => x.productId);
  const products = await Product.find({ _id: { $in: ids } }).select('name price images');
  const productMap = new Map(products.map((p) => [String(p._id), p]));

  return normalized
    .map(({ productId, quantity }) => {
      const product = productMap.get(productId);
      if (!product) return null;
      return {
        product: product._id,
        quantity,
        name: product.name,
        price: Number(product.price) || 0,
        image: Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : '',
      };
    })
    .filter(Boolean);
}

// @desc    내 장바구니 조회
// @route   GET /api/cart
exports.getMyCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    res.json({ success: true, items: cart?.items || [] });
  } catch (error) {
    next(error);
  }
};

// @desc    내 장바구니 전체 교체
// @route   PUT /api/cart
exports.replaceMyCart = async (req, res, next) => {
  try {
    const items = await buildCartItems(req.body?.items);
    const cart = await Cart.findOneAndUpdate(
      { user: req.user._id },
      { $set: { items } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true, items: cart.items });
  } catch (error) {
    next(error);
  }
};

// @desc    게스트 장바구니와 병합
// @route   POST /api/cart/merge
exports.mergeMyCart = async (req, res, next) => {
  try {
    const incoming = await buildCartItems(req.body?.items);
    const existing = await Cart.findOne({ user: req.user._id });
    const mergedMap = new Map();

    for (const item of existing?.items || []) {
      const id = String(item.product);
      mergedMap.set(id, {
        product: item.product,
        quantity: Math.max(1, Number(item.quantity) || 1),
        name: item.name,
        price: Number(item.price) || 0,
        image: item.image || '',
      });
    }

    for (const item of incoming) {
      const id = String(item.product);
      const prev = mergedMap.get(id);
      if (!prev) {
        mergedMap.set(id, item);
      } else {
        mergedMap.set(id, { ...prev, quantity: prev.quantity + item.quantity });
      }
    }

    const items = Array.from(mergedMap.values());
    const cart = await Cart.findOneAndUpdate(
      { user: req.user._id },
      { $set: { items } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true, items: cart.items });
  } catch (error) {
    next(error);
  }
};

// @desc    내 장바구니 비우기
// @route   DELETE /api/cart
exports.clearMyCart = async (req, res, next) => {
  try {
    await Cart.findOneAndUpdate(
      { user: req.user._id },
      { $set: { items: [] } },
      { upsert: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true, items: [] });
  } catch (error) {
    next(error);
  }
};
