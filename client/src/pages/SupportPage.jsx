import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import { getStoredUser } from '../utils/authStorage'
import { t } from '../i18n/t'
import LandingNavbar from '../components/landing/LandingNavbar'
import LandingFooter from '../components/landing/LandingFooter'
import './HomePage.css'
import './SupportPage.css'

export default function SupportPage() {
  const navigate = useNavigate()
  const logoutStore = useAuthStore((s) => s.logout)
  const user = getStoredUser()

  useEffect(() => {
    document.title = `Venus — ${t('support_meta_title')}`
  }, [])

  const handleLogout = () => {
    logoutStore()
    navigate('/')
  }

  const isLoggedIn = Boolean(localStorage.getItem('token') && user)
  const isAdmin =
    !!user &&
    (user.role === 'admin' || String(user.email || '').toLowerCase() === 'admin@gmail.com')

  const faqs = [
    { q: t('support_faq_q1'), a: t('support_faq_a1') },
    { q: t('support_faq_q2'), a: t('support_faq_a2') },
    { q: t('support_faq_q3'), a: t('support_faq_a3') },
  ]

  return (
    <div className="landing support-page">
      <LandingNavbar user={user} isLoggedIn={isLoggedIn} isAdmin={isAdmin} onLogout={handleLogout} />

      <main className="support-main">
        <header className="support-header">
          <h1 className="support-title">{t('support_page_title')}</h1>
          <p className="support-intro">{t('support_intro')}</p>
        </header>

        <div className="support-grid">
          <section className="support-card" aria-labelledby="support-contact-heading">
            <h2 id="support-contact-heading" className="support-card-title">
              {t('support_contact_title')}
            </h2>
            <dl className="support-dl">
              <div className="support-dl-row">
                <dt>{t('support_phone_label')}</dt>
                <dd>
                  <a href={`tel:${t('support_phone_tel')}`} className="support-link">
                    {t('support_phone_value')}
                  </a>
                </dd>
              </div>
              <div className="support-dl-row">
                <dt>{t('support_email_label')}</dt>
                <dd>
                  <a href={`mailto:${t('support_email_value')}`} className="support-link">
                    {t('support_email_value')}
                  </a>
                </dd>
              </div>
            </dl>
          </section>

          <section className="support-card" aria-labelledby="support-hours-heading">
            <h2 id="support-hours-heading" className="support-card-title">
              {t('support_hours_title')}
            </h2>
            <p className="support-hours-value">{t('support_hours_value')}</p>
          </section>
        </div>

        <section className="support-notice" aria-labelledby="support-notice-heading">
          <h2 id="support-notice-heading" className="support-notice-title">
            {t('support_notice_title')}
          </h2>
          <ul className="support-notice-list">
            <li>{t('support_notice_1')}</li>
            <li>{t('support_notice_2')}</li>
          </ul>
        </section>

        <section className="support-faq" aria-labelledby="support-faq-heading">
          <h2 id="support-faq-heading" className="support-faq-title">
            {t('support_faq_title')}
          </h2>
          <ul className="support-faq-list">
            {faqs.map((item) => (
              <li key={item.q} className="support-faq-item">
                <p className="support-faq-q">{item.q}</p>
                <p className="support-faq-a">{item.a}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <LandingFooter />
    </div>
  )
}
