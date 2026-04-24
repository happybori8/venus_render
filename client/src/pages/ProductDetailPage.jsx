import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { getProductAPI, createReviewAPI } from '../api/products';
import { resolveProductGalleryImages, getStoryImageCandidates } from '../lib/skuCloudinaryImages';
import StoryImage from '../components/product/StoryImage';
import LandingNavbar from '../components/landing/LandingNavbar';
import { getStoredUser } from '../utils/authStorage';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import { FiStar, FiShoppingCart, FiMinus, FiPlus, FiChevronDown } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { getCategoryLabel } from '../constants/productCategories';
import { getProductName, getProductDescription } from '../utils/productLocale';
import './HomePage.css';
import './ProductDetailPage.css';

const ACCORDIONS = [
  {
    id: 'ship',
    title: '배송 · 교환',
    body:
      '주문 후 1~3일 내 출고됩니다. 5만 원 이상 구매 시 무료 배송입니다. 단순 변심에 의한 교환·반품은 수령 후 7일 이내 가능하며, 배송비는 고객 부담일 수 있습니다.',
  },
  {
    id: 'ingredient',
    title: '제품 주요 정보',
    body:
      '제품별 성분·용량·제조국은 포장 및 라벨을 참고해 주세요. 민감 피부는 패치 테스트 후 사용을 권장합니다.',
  },
  {
    id: 'use',
    title: '사용 방법',
    body: '세안 후 단계에 맞게 적당량을 덜어 피부에 골고루 펴 발라 흡수시켜 주세요. 눈에 들어가지 않도록 주의합니다.',
  },
];

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(getStoredUser);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [selectedImg, setSelectedImg] = useState(0);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [openAccordion, setOpenAccordion] = useState('ship');

  const addItem = useCartStore((s) => s.addItem);
  const logoutStore = useAuthStore((s) => s.logout);
  const { isAuthenticated } = useAuthStore();
  useEffect(() => {
    setUser(getStoredUser());
  }, [location.pathname]);

  const handleNavLogout = () => {
    logoutStore();
    setUser(null);
    navigate('/');
  };

  const isLoggedIn = Boolean(localStorage.getItem('token') && user);
  const isAdmin =
    !!user && (user.role === 'admin' || String(user.email || '').toLowerCase() === 'admin@gmail.com');

  const gallery = useMemo(
    () => (product ? resolveProductGalleryImages(product) : []),
    [product]
  );

  const storyCandidates = useMemo(
    () => (product ? getStoryImageCandidates(product) : []),
    [product]
  );

  useEffect(() => {
    setSelectedImg(0);
    setQty(1);
    const fetch = async () => {
      try {
        const { data } = await getProductAPI(id);
        setProduct(data.product);
      } catch {
        navigate('/products');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id, navigate]);

  const handleAddToCart = () => {
    addItem(product, qty);
    toast.success(`${qty}개를 장바구니에 담았습니다`);
  };
  const handleBuyNow = () => {
    addItem(product, qty);
    navigate('/checkout', {
      state: { cartItemIds: [product._id] },
    });
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('로그인이 필요합니다');
      navigate('/login');
      return;
    }
    setReviewLoading(true);
    try {
      await createReviewAPI(id, { rating: reviewRating, comment: reviewComment });
      toast.success('리뷰가 등록되었습니다');
      setReviewComment('');
      const { data } = await getProductAPI(id);
      setProduct(data.product);
    } catch (err) {
      toast.error(err.response?.data?.message || '리뷰 등록에 실패했습니다');
    } finally {
      setReviewLoading(false);
    }
  };

  const layout = (body) => (
    <div className="landing landing-with-product-detail">
      <LandingNavbar user={user} isLoggedIn={isLoggedIn} isAdmin={isAdmin} onLogout={handleNavLogout} />
      <main className="pd-landing-main">{body}</main>
    </div>
  );

  if (loading) {
    return layout(
      <div className="loading-spinner pd-detail-loading">
        <div className="spinner" />
      </div>
    );
  }
  if (!product) {
    return layout(null);
  }

  const displayPrice = product.discountPrice > 0 ? product.discountPrice : product.price;
  const displayName = getProductName(product);
  const displayDescription = getProductDescription(product);
  const categoryLabel = getCategoryLabel(product.category);
  const stock = product.stock;
  const isSoldOut = stock != null && stock <= 0;
  const maxSelectableQty = stock == null ? 99 : Math.max(1, stock);
  const mainSrc = gallery[selectedImg] ?? gallery[0] ?? 'https://placehold.co/800x800?text=No+Image';

  return layout(
    <div className="product-detail-page pd-page">
      <div className="container pd-hero-inner">
        <nav className="pd-breadcrumb" aria-label="breadcrumb">
          <Link to="/">홈</Link>
          <span className="pd-bc-sep">/</span>
          <Link to="/products">상품</Link>
          <span className="pd-bc-sep">/</span>
          <span className="pd-bc-current">{categoryLabel}</span>
        </nav>

        <div className="detail-grid pd-hero-grid">
          <div className="detail-images">
            <div className="main-image pd-main-image">
              <img src={mainSrc} alt={displayName} />
            </div>
            {gallery.length > 1 && (
              <div className="image-thumbnails pd-thumbs">
                {gallery.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`pd-thumb-btn ${i === selectedImg ? 'active' : ''}`}
                    onClick={() => setSelectedImg(i)}
                    aria-label={`이미지 ${i + 1}`}
                  >
                    <img src={img} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="detail-info pd-purchase">
            <span className="detail-category">{categoryLabel}</span>
            {product.sku ? <span className="detail-sku">SKU {product.sku}</span> : null}
            <h1 className="detail-name">{displayName}</h1>
            <div className="detail-rating">
              <FiStar className="star-icon" />
              <span>{product.rating?.toFixed(1) ?? '0.0'}</span>
              <a href="#product-reviews" className="pd-review-link">
                ({product.numReviews ?? 0} 리뷰)
              </a>
            </div>
            <div className="detail-price">
              {product.discountPrice > 0 && (
                <span className="original-price">{product.price.toLocaleString()}원</span>
              )}
              <span className="final-price">{displayPrice.toLocaleString()}원</span>
            </div>
            {displayDescription ? <p className="detail-description pd-lead">{displayDescription}</p> : null}

            <p className="pd-total-line">
              총 상품 금액 <strong>{(displayPrice * qty).toLocaleString()}원</strong>
              <span className="pd-total-qty"> ({qty}개)</span>
            </p>

            <div className="stock-info">
              {isSoldOut ? (
                <span className="out-stock">품절</span>
              ) : stock == null ? (
                <span className="in-stock">재고: 미등록</span>
              ) : (
                <span className="in-stock">재고: {stock}개</span>
              )}
            </div>
            {!isSoldOut && (
              <>
                <div className="qty-selector">
                  <button type="button" onClick={() => setQty(Math.max(1, qty - 1))}><FiMinus /></button>
                  <span>{qty}</span>
                  <button type="button" onClick={() => setQty(Math.min(maxSelectableQty, qty + 1))}><FiPlus /></button>
                </div>
                <div className="detail-actions pd-buy-row">
                  <button type="button" className="btn btn-outline pd-btn-cart" onClick={handleAddToCart}>
                    <FiShoppingCart /> 장바구니
                  </button>
                  <button type="button" className="btn btn-primary pd-btn-buy" onClick={handleBuyNow}>
                    구매하기
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <section className="pd-review-snapshot" aria-labelledby="pd-review-snap-title">
        <div className="container">
          <div className="pd-review-snap-head">
            <h2 id="pd-review-snap-title" className="pd-section-label">REVIEW</h2>
            <div className="pd-review-snap-rating">
              <FiStar className="pd-snap-star" />
              <span className="pd-snap-num">{product.rating?.toFixed(1) ?? '0.0'}</span>
              <span className="pd-snap-count">{product.numReviews ?? 0}개</span>
            </div>
            <a href="#product-reviews" className="pd-write-review-link">리뷰 작성</a>
          </div>
          <p className="pd-photo-hint">포토 리뷰는 아래 리뷰 목록에서 확인할 수 있습니다.</p>
        </div>
      </section>

      {storyCandidates.length > 0 && (
        <section className="pd-story" aria-label="상품 상세 이미지">
          <div className="pd-story-inner">
            {storyCandidates.map(({ url, key }) => (
              <StoryImage key={key} url={url} />
            ))}
          </div>
        </section>
      )}

      <div className="container pd-accordions-wrap">
        <div className="pd-accordions">
          {ACCORDIONS.map((acc) => {
            const open = openAccordion === acc.id;
            return (
              <div key={acc.id} className={`pd-acc-item ${open ? 'open' : ''}`}>
                <button
                  type="button"
                  className="pd-acc-trigger"
                  onClick={() => setOpenAccordion(open ? null : acc.id)}
                  aria-expanded={open}
                >
                  <span>{acc.title}</span>
                  <FiChevronDown className="pd-acc-icon" />
                </button>
                {open && (
                  <div className="pd-acc-panel">
                    {acc.id === 'ingredient' && displayDescription ? (
                      <p className="pd-acc-lead">{displayDescription}</p>
                    ) : null}
                    <p>{acc.body}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="container" id="product-reviews">
        <div className="reviews-section pd-reviews-block">
          <h2>상품 리뷰 ({product.numReviews ?? 0})</h2>
          <form className="review-form" onSubmit={handleReviewSubmit}>
            <div className="star-rating">
              {[1, 2, 3, 4, 5].map((s) => (
                <FiStar key={s} className={s <= reviewRating ? 'star active' : 'star'} onClick={() => setReviewRating(s)} />
              ))}
            </div>
            <textarea
              placeholder="상품에 대한 리뷰를 작성해주세요..."
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              required
              rows={3}
            />
            <button type="submit" className="btn btn-primary" disabled={reviewLoading}>
              {reviewLoading ? '등록 중...' : '리뷰 작성'}
            </button>
          </form>
          <div className="reviews-list">
            {product.reviews?.length === 0 ? (
              <p className="no-reviews">아직 리뷰가 없습니다. 첫 번째 리뷰를 작성해보세요!</p>
            ) : (
              product.reviews?.map((review, i) => (
                <div key={i} className="review-item">
                  <div className="review-header">
                    <strong>{review.name}</strong>
                    <div className="review-stars">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <FiStar key={s} className={s <= review.rating ? 'star active' : 'star'} />
                      ))}
                    </div>
                    <span className="review-date">{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p>{review.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
