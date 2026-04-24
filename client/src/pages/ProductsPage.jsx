import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { getProductsAPI } from '../api/products';
import { t } from '../i18n/t';
import useAuthStore from '../store/authStore';
import { getStoredUser } from '../utils/authStorage';
import LandingNavbar from '../components/landing/LandingNavbar';
import LandingProductCard from '../components/landing/LandingProductCard';
import { FiSearch } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import './HomePage.css';
import './ProductsPage.css';
import { PRODUCT_CATEGORIES, getCategoryLabel } from '../constants/productCategories';

const PLACEHOLDER_IMG = 'https://placehold.co/600?text=No+Image';

function formatListingProduct(p) {
  const price = p.discountPrice > 0 ? p.discountPrice : p.price;
  const n = Number(price ?? 0);
  return {
    ...p,
    id: p._id,
    detailId: p._id,
    img: p.images?.[0] || PLACEHOLDER_IMG,
    priceKo: `${n.toLocaleString('ko-KR')}원`,
  };
}

export default function ProductsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const logoutStore = useAuthStore((s) => s.logout);

  const sortOptions = useMemo(
    () => [
      { value: 'newest', label: t('products_sort_newest') },
      { value: 'price-asc', label: t('products_sort_price_asc') },
      { value: 'price-desc', label: t('products_sort_price_desc') },
      { value: 'rating', label: t('products_sort_rating') },
    ],
    []
  );
  const [user, setUser] = useState(getStoredUser);
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = Number(searchParams.get('page')) || 1;
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    setUser(getStoredUser());
  }, [location.pathname]);

  const handleLogout = () => {
    logoutStore();
    setUser(null);
    navigate('/');
  };

  const isLoggedIn = Boolean(localStorage.getItem('token') && user);
  const isAdmin =
    !!user &&
    (user.role === 'admin' || String(user.email || '').toLowerCase() === 'admin@gmail.com');

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = { page, limit: 12, sort };
        if (category) params.category = category;
        if (search) params.search = search;
        const { data } = await getProductsAPI(params);
        setProducts(data.products);
        setTotal(data.total);
        setPages(data.pages);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [category, search, sort, page]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    updateParam('search', searchInput.trim());
  };

  const handlePageChange = (p) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', p);
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="landing products-page">
      <LandingNavbar user={user} isLoggedIn={isLoggedIn} isAdmin={isAdmin} onLogout={handleLogout} />
      <div className="container">
        <h1 className="products-page-heading text-balance">{t('products_page_title')}</h1>
        <div className="products-layout">
          <aside className="products-sidebar rounded-2xl border-border/70 shadow-sm">
            <div className="products-filter">
              <div className="products-filter-head">
                <h2 className="products-filter-title">{t('products_category_title')}</h2>
                {category ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="products-filter-reset"
                    onClick={() => updateParam('category', '')}
                  >
                    {t('products_filter_reset')}
                  </Button>
                ) : null}
              </div>
              <div
                className="products-filter-chips"
                role="group"
                aria-label={t('products_filter_group_aria')}
              >
                {PRODUCT_CATEGORIES.map((cat) => (
                  <Button
                    key={cat}
                    type="button"
                    variant={category === cat ? 'default' : 'outline'}
                    className={`filter-chip justify-start rounded-full ${category === cat ? 'is-active' : ''}`}
                    onClick={() =>
                      updateParam('category', category === cat ? '' : cat)
                    }
                  >
                    {getCategoryLabel(cat)}
                  </Button>
                ))}
              </div>
            </div>
          </aside>
          <div className="products-main">
            <div className="products-toolbar">
              <form className="search-form rounded-full border-border/70 bg-background/90 shadow-sm" onSubmit={handleSearch}>
                <Input
                  type="text"
                  placeholder={t('products_search_placeholder')}
                  value={searchInput}
                  className="border-0 bg-transparent shadow-none focus-visible:ring-0"
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                <Button type="submit" size="sm" className="rounded-full px-4"><FiSearch /></Button>
              </form>
              <select className="sort-select rounded-full border-border/70 bg-background/90 shadow-sm" value={sort} onChange={(e) => updateParam('sort', e.target.value)}>
                {sortOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <Badge variant="secondary" className="result-count rounded-full px-3 py-1 text-xs">
                {t('products_result_total', { total })}
              </Badge>
            </div>
            {loading ? (
              <div className="loading-spinner"><div className="spinner" /></div>
            ) : products.length === 0 ? (
              <Card className="empty-state rounded-2xl border border-dashed border-border/80 bg-card/80">
                <CardContent className="py-10 text-center text-muted-foreground">
                  <p>{t('products_empty')}</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="landing-product-grid products-page-product-grid">
                  {products.map((p) => {
                    const card = formatListingProduct(p);
                    return (
                      <LandingProductCard
                        key={p._id}
                        product={card}
                        detailId={card.detailId}
                      />
                    );
                  })}
                </div>
                {pages > 1 && (
                  <div className="pagination mt-10">
                    {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                      <Button
                        key={p}
                        variant={p === page ? 'default' : 'outline'}
                        size="sm"
                        className={`page-btn rounded-full ${p === page ? 'active' : ''}`}
                        onClick={() => handlePageChange(p)}
                      >{p}</Button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

