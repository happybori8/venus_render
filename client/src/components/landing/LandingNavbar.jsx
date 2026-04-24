import { useNavigate, useLocation } from 'react-router-dom'
import { FiShoppingCart } from 'react-icons/fi'
import { t } from '../../i18n/t'
import useCartStore from '../../store/cartStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import venusLogo from '../../assets/venus-logo.png'
import venusWordmark from '../../assets/venus-wordmark.png'

export default function LandingNavbar({ user, isLoggedIn, isAdmin, onLogout }) {
  const navigate = useNavigate()
  const location = useLocation()
  const cartKindCount = useCartStore((s) => s.items.length)

  const path = location.pathname
  const navShopActive = path === '/products' || path.startsWith('/products/')
  const navBrandActive = path === '/brand'
  const navSupportActive = path === '/support'

  return (
    <header className="landing-header border-b border-border/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="landing-header-inner">
        <nav className="landing-nav-left" aria-label={t('nav_primary_aria')}>
          <button
            type="button"
            className={`landing-nav-link rounded-md px-2 py-1 transition-colors hover:bg-muted/70${navShopActive ? ' is-active bg-muted/90' : ''}`}
            onClick={() => navigate('/products')}
          >
            {t('nav_shop')}
          </button>
          <button
            type="button"
            className={`landing-nav-link rounded-md px-2 py-1 transition-colors hover:bg-muted/70${navBrandActive ? ' is-active bg-muted/90' : ''}`}
            onClick={() => navigate('/brand')}
          >
            {t('nav_brand')}
          </button>
          <button
            type="button"
            className={`landing-nav-link rounded-md px-2 py-1 transition-colors hover:bg-muted/70${navSupportActive ? ' is-active bg-muted/90' : ''}`}
            onClick={() => navigate('/support')}
          >
            {t('nav_support')}
          </button>
        </nav>

        <button
          type="button"
          className="landing-logo"
          onClick={() => navigate('/')}
          aria-label={t('logo_aria')}
        >
          <img src={venusLogo} alt="Venus" className="landing-logo-img" />
          <img src={venusWordmark} alt="Venus wordmark" className="landing-brand-wordmark" />
        </button>

        <div className="landing-nav-right">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="landing-cart-btn rounded-full px-3"
            onClick={() => navigate(isLoggedIn ? '/cart' : '/login')}
            aria-label={
              isLoggedIn && cartKindCount > 0
                ? t('cart_aria_with_count', { count: cartKindCount })
                : t('cart')
            }
          >
            <span className="landing-cart-btn-inner">
              <FiShoppingCart className="landing-cart-icon" aria-hidden />
              <span className="landing-cart-label">{t('cart')}</span>
              {isLoggedIn && cartKindCount > 0 ? (
                <Badge className="landing-cart-badge bg-primary px-1.5 text-[10px] text-primary-foreground" aria-hidden>
                  {cartKindCount > 99 ? '99+' : cartKindCount}
                </Badge>
              ) : null}
            </span>
          </Button>

          {isLoggedIn && user?.name && (
            <span className="landing-greeting">{t('greeting', { name: user.name })}</span>
          )}

          {isLoggedIn ? (
            <>
              <Button type="button" variant="outline" size="sm" className="landing-auth-btn landing-auth-logout rounded-full px-3" onClick={onLogout}>
                {t('logout')}
              </Button>
              <span className="landing-auth-sep" aria-hidden>
                |
              </span>
              <Button
                type="button"
                variant={isAdmin ? 'default' : 'ghost'}
                size="sm"
                className={`landing-auth-btn rounded-full px-3 ${isAdmin ? 'landing-auth-admin' : ''}`}
                onClick={() => navigate(isAdmin ? '/admin' : '/mypage')}
              >
                {isAdmin ? t('admin') : t('mypage')}
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="ghost" size="sm" className="landing-auth-btn rounded-full px-3" onClick={() => navigate('/login')}>
                {t('login')}
              </Button>
              <span className="landing-auth-sep" aria-hidden>
                |
              </span>
              <Button type="button" variant="default" size="sm" className="landing-auth-btn rounded-full px-3" onClick={() => navigate('/register')}>
                {t('register')}
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
