import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { createOrderAPI } from '../api/orders';
import useCartStore from '../store/cartStore';
import { clearPortOnePendingPayload, peekPortOnePendingPayload } from '../utils/portoneConfig';
import './HomePage.css';

/** React StrictMode(dev)에서 effect 이중 실행 시 동일 paymentId 콜백이 두 번 처리되지 않도록 */
const portoneCallbackStarted = new Set();

/**
 * 포트원 모바일·iOS Safari 등 리다이렉트 결제 후 복귀 URL.
 * 쿼리: paymentId, code(실패), message, txId 등
 */
export default function PaymentCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const clearCart = useCartStore((s) => s.clearCart);
  const removeItemsByIds = useCartStore((s) => s.removeItemsByIds);
  const hint = '결제 결과를 확인하는 중…';

  useEffect(() => {
    const paymentId = searchParams.get('paymentId');
    const code = searchParams.get('code');
    const message = searchParams.get('message');
    const txId =
      searchParams.get('txId') || searchParams.get('tx_id') || undefined;

    if (!paymentId) {
      navigate('/order-fail', {
        replace: true,
        state: { message: '결제 정보를 확인할 수 없습니다.' },
      });
      return;
    }

    if (code) {
      clearPortOnePendingPayload(paymentId);
      navigate('/order-fail', {
        replace: true,
        state: { message: message || '결제가 취소되었습니다' },
      });
      return;
    }

    if (portoneCallbackStarted.has(paymentId)) {
      return;
    }

    const rawPeek = peekPortOnePendingPayload(paymentId);
    if (!rawPeek) {
      navigate('/order-fail', {
        replace: true,
        state: {
          message:
            '결제는 완료되었을 수 있습니다. 주문내역에서 확인해 주세요. 세션이 만료된 경우 장바구니에서 다시 시도해 주세요.',
        },
      });
      return;
    }

    portoneCallbackStarted.add(paymentId);
    clearPortOnePendingPayload(paymentId);
    const raw = rawPeek;

    let pending;
    try {
      pending = JSON.parse(raw);
    } catch {
      navigate('/order-fail', {
        replace: true,
        state: { message: '주문 정보를 불러오지 못했습니다.' },
      });
      return;
    }

    (async () => {
      try {
        const { data } = await createOrderAPI({
          orderItems: pending.orderItems,
          shippingAddress: pending.shippingAddress,
          paymentMethod: pending.paymentMethod,
          paymentResult: {
            paymentId,
            txId: txId || undefined,
          },
        });

        const orderedIds = pending.orderedProductIds || [];
        if (orderedIds.length === pending.rawItemsLength) {
          clearCart();
        } else {
          removeItemsByIds(orderedIds);
        }

        navigate('/order-success', {
          replace: true,
          state: { orderId: data.order._id },
        });
      } catch (err) {
        const status = err.response?.status;
        if (status === 409) {
          navigate('/orders', { replace: true });
          return;
        }
        const msg =
          err.response?.data?.message ||
          err.message ||
          '결제 처리 중 오류가 발생했습니다';
        navigate('/order-fail', { replace: true, state: { message: msg } });
      }
    })();
  }, [searchParams, navigate, clearCart, removeItemsByIds]);

  return (
    <div className="landing checkout-landing" style={{ minHeight: '50vh', padding: '3rem 1rem' }}>
      <p style={{ textAlign: 'center', color: '#444' }}>{hint}</p>
    </div>
  );
}
