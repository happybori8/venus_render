import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import { getStoredUser } from '../utils/authStorage'
import { IMG } from '../data/landingContent'
import LandingNavbar from '../components/landing/LandingNavbar'
import LandingHero from '../components/landing/LandingHero'
import LandingCategoryProductGrid from '../components/landing/LandingCategoryProductGrid'
import LandingFullBanner from '../components/landing/LandingFullBanner'
import LandingFooter from '../components/landing/LandingFooter'
import './HomePage.css'

export default function HomePage() {
  const navigate = useNavigate()
  const logoutStore = useAuthStore((s) => s.logout)
  const user = getStoredUser()

  const handleLogout = () => {
    logoutStore()
    navigate('/')
  }

  const isLoggedIn = Boolean(localStorage.getItem('token') && user)
  const isAdmin =
    !!user &&
    (user.role === 'admin' || String(user.email || '').toLowerCase() === 'admin@gmail.com')

  return (
    <div className="landing">
      <LandingNavbar user={user} isLoggedIn={isLoggedIn} isAdmin={isAdmin} onLogout={handleLogout} />

      <main>
        <LandingHero />
        <LandingCategoryProductGrid category="마스크팩" titleKey="section_new" emptyKey="landing_maskpack_empty" />
        <LandingFullBanner src={IMG.banner1} />
        <LandingCategoryProductGrid category="클렌저" titleKey="section_best" emptyKey="landing_cleanser_empty" />
        <LandingFullBanner src={IMG.banner2} tall />
        <LandingCategoryProductGrid category="크림" titleKey="section_cream" emptyKey="landing_cream_empty" />
      </main>

      <LandingFooter />
    </div>
  )
}
