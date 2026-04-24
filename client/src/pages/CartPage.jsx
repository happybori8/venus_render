import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import { getStoredUser } from '../utils/authStorage';
import { getSaleUnitPrice, getListUnitPrice, hasLineDiscount } from '../utils/cartPricing';
import { formatCurrency } from '../utils/formatCurrency';
import { getProductName } from '../utils/productLocale';
import { t } from '../i18n/t';
import LandingNavbar from '../components/landing/LandingNavbar';
import { FiMinus, FiPlus, FiShoppingBag, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './HomePage.css';
import './CartPage.css';

const FREE_SHIP_THRESHOLD = 50000;

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItemsByIds = useCartStore((s) => s.removeItemsByIds);
  const logoutStore = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const user = getStoredUser();
  const [selectedIds, setSelectedIds] = useState(() => items.map((i) => i._id));

  const handleLogout = () => {
    logoutStore();
    navigate('/');
  };

  const isLoggedIn = Boolean(localStorage.getItem('token') && user);
  const isAdmin =
    !!user &&
    (user.role === 'admin' || String(user.email || '').toLowerCase() === 'admin@gmail.com');

  const listSubtotal = items.reduce(
    (acc, i) => acc + getListUnitPrice(i) * i.quantity,
    0
  );
  const saleSubtotal = items.reduce(
    (acc, i) => acc + getSaleUnitPrice(i) * i.quantity,
    0
  );
  const discountSubtotal = Math.max(0, listSubtotal - saleSubtotal);
  const shippingPrice = saleSubtotal >= FREE_SHIP_THRESHOLD ? 0 : 3000;
  const payTotal = saleSubtotal + shippingPrice;

  const allSelected =
    items.length > 0 && selectedIds.length === items.length;

  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds([]);
    else setSelectedIds(items.map((i) => i._id));
  };

  const toggleOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) {
      toast.error(t('cart_toast_select_delete'));
      return;
    }
    removeItemsByIds(selectedIds);
    toast.success(t('cart_toast_deleted_selected'));
  };

  const requireLoginThen = (fn) => {
    if (!localStorage.getItem('token')) {
      toast.error(t('cart_toast_login'));
      navigate('/login');
      return;
    }
    fn();
  };

  const goCheckout = (mode) => {
    requireLoginThen(() => {
      const ids =
        mode === 'all' ? items.map((i) => i._id) : [...selectedIds];
      if (ids.length === 0) {
        toast.error(t('cart_toast_select_order'));
        return;
      }
      navigate('/checkout', {
        state: mode === 'all' ? undefined : { cartItemIds: ids },
      });
    });
  };

  const nav = (
    <LandingNavbar
      user={user}
      isLoggedIn={isLoggedIn}
      isAdmin={isAdmin}
      onLogout={handleLogout}
    />
  );

  if (items.length === 0) {
    return (
      <div className="landing cart-page">
        {nav}
        <div className="container cart-page-inner">
          <div className="cart-empty">
            <FiShoppingBag size={56} strokeWidth={1} />
            <p className="cart-empty-text">{t('cart_empty_text')}</p>
            <Link to="/products" className="cart-empty-cta">
              {t('cart_continue')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="landing cart-page">
      {nav}
      <div className="container cart-page-inner">
        <div className="cart-layout cart-layout--reference">
          <section className="cart-panel" aria-labelledby="cart-heading">
            <h1 id="cart-heading" className="cart-panel-title">
              {t('cart_panel_title', { count: items.length })}
            </h1>
            <div className="cart-toolbar">
              <label className="cart-select-all">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                />
                <span>{t('cart_select_all')}</span>
              </label>
              <button
                type="button"
                className="cart-toolbar-delete"
                onClick={handleDeleteSelected}
              >
                {t('cart_delete_selected')}
              </button>
            </div>
            <div className="cart-toolbar-line" />

            <ul className="cart-item-list">
              {items.map((item) => {
                const saleUnit = getSaleUnitPrice(item);
                const listUnit = getListUnitPrice(item);
                const lineSale = saleUnit * item.quantity;
                const discounted = hasLineDiscount(item);
                return (
                  <li key={item._id} className="cart-item-row">
                    <label className="cart-item-check">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item._id)}
                        onChange={() => toggleOne(item._id)}
                      />
                    </label>
                    <Link
                      to={`/products/${item._id}`}
                      className="cart-item-thumb"
                    >
                      <img
                        src={
                          item.images?.[0] ||
                          'https://placehold.co/120x120?text=No+Image'
                        }
                        alt=""
                      />
                    </Link>
                    <div className="cart-item-main">
                      <div className="cart-item-head">
                        <button
                          type="button"
                          className="cart-item-x"
                          aria-label={t('cart_remove_item_aria')}
                          onClick={() => removeItem(item._id)}
                        >
                          <FiX size={18} />
                        </button>
                        <Link
                          to={`/products/${item._id}`}
                          className="cart-item-name"
                        >
                          {getProductName(item)}
                        </Link>
                        <div className="cart-item-price-line">
                          <span className="cart-item-price-sale">
                            {formatCurrency(lineSale)}
                          </span>
                          {discounted && (
                            <span className="cart-item-price-list">
                              {formatCurrency(listUnit * item.quantity)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="cart-item-actions">
                        <div className="cart-qty-group">
                          <button
                            type="button"
                            className="cart-qty-btn"
                            aria-label={t('cart_qty_down_aria')}
                            onClick={() =>
                              updateQuantity(item._id, item.quantity - 1)
                            }
                          >
                            <FiMinus />
                          </button>
                          <span className="cart-qty-val">{item.quantity}</span>
                          <button
                            type="button"
                            className="cart-qty-btn"
                            aria-label={t('cart_qty_up_aria')}
                            onClick={() =>
                              updateQuantity(item._id, item.quantity + 1)
                            }
                          >
                            <FiPlus />
                          </button>
                          <span className="cart-qty-change" aria-hidden>
                            {t('cart_qty_change')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <aside className="cart-summary-panel">
            <div className="cart-summary-box">
              <div className="cart-summary-rows">
                <div className="cart-summary-line">
                  <span>{t('cart_summary_list')}</span>
                  <span>{formatCurrency(listSubtotal)}</span>
                </div>
                <div className="cart-summary-line">
                  <span>{t('cart_summary_discount')}</span>
                  <span className="cart-summary-discount">
                    {discountSubtotal > 0
                      ? `-${formatCurrency(discountSubtotal)}`
                      : formatCurrency(0)}
                  </span>
                </div>
                <div className="cart-summary-line cart-summary-line--ship">
                  <span>{t('cart_summary_ship')}</span>
                  <span className="cart-summary-ship-cell">
                    <span>
                      {shippingPrice === 0
                        ? t('cart_summary_free')
                        : formatCurrency(shippingPrice)}
                    </span>
                    <span className="cart-ship-pill">
                      {t('cart_summary_ship_badge')}
                    </span>
                  </span>
                </div>
              </div>
              <div className="cart-summary-divider" />
              <div className="cart-summary-pay">
                <span>{t('cart_summary_pay')}</span>
                <span className="cart-summary-pay-num">
                  {formatCurrency(payTotal)}
                </span>
              </div>
              <button
                type="button"
                className="cart-btn cart-btn--outline"
                onClick={() => goCheckout('selected')}
              >
                {t('cart_btn_order_selected')}
              </button>
              <button
                type="button"
                className="cart-btn cart-btn--solid"
                onClick={() => goCheckout('all')}
              >
                {t('cart_btn_order_all')}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
