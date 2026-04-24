import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import { getStoredUser } from '../utils/authStorage'
import { t } from '../i18n/t'
import { IMG } from '../data/landingContent'
import LandingNavbar from '../components/landing/LandingNavbar'
import LandingFooter from '../components/landing/LandingFooter'
import './HomePage.css'
import './BrandPage.css'

export default function BrandPage() {
  const navigate = useNavigate()
  const logoutStore = useAuthStore((s) => s.logout)
  const user = getStoredUser()

  useEffect(() => {
    document.title = `Venus — ${t('brand_meta_title')}`
  }, [])

  const handleLogout = () => {
    logoutStore()
    navigate('/')
  }

  const isLoggedIn = Boolean(localStorage.getItem('token') && user)
  const isAdmin =
    !!user &&
    (user.role === 'admin' || String(user.email || '').toLowerCase() === 'admin@gmail.com')

  const values = [
    { title: t('brand_value_1_t'), desc: t('brand_value_1_d') },
    { title: t('brand_value_2_t'), desc: t('brand_value_2_d') },
    { title: t('brand_value_3_t'), desc: t('brand_value_3_d') },
  ]

  /** 스토리 좌측 이미지 — 1차 실패 시 동일 도메인에서 검증된 보조 URL로 교체 */
  const brandStorySources = [IMG.brandStory, IMG.banner2, IMG.hero]
  const [brandStorySrcIndex, setBrandStorySrcIndex] = useState(0)
  const brandStorySrc = brandStorySources[Math.min(brandStorySrcIndex, brandStorySources.length - 1)]

  return (
    <div className="landing brand-page">
      <LandingNavbar user={user} isLoggedIn={isLoggedIn} isAdmin={isAdmin} onLogout={handleLogout} />

      <main>
        <section className="brand-hero" aria-labelledby="brand-hero-title">
          <div className="brand-hero-grid">
            <div className="brand-hero-copy">
              <p className="brand-hero-kicker">{t('brand_hero_kicker')}</p>
              <h1 id="brand-hero-title" className="brand-hero-title">
                {t('brand_hero_title')}
              </h1>
              <p className="brand-hero-desc">{t('brand_hero_desc')}</p>
            </div>
            <div className="brand-hero-visual">
              <img src={IMG.brandHero} alt="" className="brand-hero-img" loading="lazy" />
            </div>
          </div>
        </section>

        <section className="brand-story" aria-labelledby="brand-story-title">
          <div className="brand-story-inner">
            <div className="brand-story-visual">
              <img
                src={brandStorySrc}
                alt=""
                className="brand-story-img"
                loading="lazy"
                decoding="async"
                onError={() =>
                  setBrandStorySrcIndex((i) =>
                    i < brandStorySources.length - 1 ? i + 1 : i
                  )
                }
              />
            </div>
            <div className="brand-story-copy">
              <h2 id="brand-story-title" className="brand-section-title">
                {t('brand_story_title')}
              </h2>
              <p className="brand-story-text">{t('brand_story_p1')}</p>
              <p className="brand-story-text">{t('brand_story_p2')}</p>
            </div>
          </div>
        </section>

        <section className="brand-values" aria-labelledby="brand-values-title">
          <div className="brand-values-inner">
            <h2 id="brand-values-title" className="brand-section-title brand-section-title--center">
              {t('brand_values_title')}
            </h2>
            <ul className="brand-values-grid">
              {values.map((item) => (
                <li key={item.title} className="brand-value-card">
                  <span className="brand-value-line" aria-hidden />
                  <h3 className="brand-value-title">{item.title}</h3>
                  <p className="brand-value-desc">{item.desc}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="brand-promise" aria-labelledby="brand-promise-title">
          <div className="brand-promise-inner">
            <h2 id="brand-promise-title" className="brand-promise-heading">
              {t('brand_promise_title')}
            </h2>
            <blockquote className="brand-promise-quote">{t('brand_promise_quote')}</blockquote>
            <p className="brand-promise-signed">{t('brand_promise_signed')}</p>
          </div>
        </section>

        <section className="brand-cta">
          <button
            type="button"
            className="brand-cta-btn"
            onClick={() => navigate('/products')}
            aria-label={t('brand_cta_aria')}
          >
            {t('brand_cta')}
          </button>
        </section>
      </main>

      <LandingFooter />
    </div>
  )
}
