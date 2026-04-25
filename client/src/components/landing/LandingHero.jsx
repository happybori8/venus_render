import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { t } from '../../i18n/t'
import { IMG } from '../../data/landingContent'
import { getProductsAPI } from '../../api/products'
import { getProductName, getProductDescription } from '../../utils/productLocale'

/** 히어로 비주얼 — 크림 카테고리 중 가장 최근 등록된 상품 1건 (없으면 기본 이미지·문구) */
const HERO_CATEGORY = '크림'

/** 설명 한 덩어리로 정리 후 길이 제한 */
function truncateText(s, max) {
  const one = String(s || '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!one) return ''
  if (one.length <= max) return one
  return `${one.slice(0, max).trim()}…`
}

export default function LandingHero() {
  const [heroProduct, setHeroProduct] = useState(null)
  const [heroReady, setHeroReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await getProductsAPI({
          category: HERO_CATEGORY,
          limit: 1,
          page: 1,
          sort: 'newest',
        })
        const list = data.products || []
        const p = list[0] ?? null
        if (!cancelled) setHeroProduct(p)
      } catch {
        if (!cancelled) setHeroProduct(null)
      } finally {
        if (!cancelled) setHeroReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const imgSrc = heroProduct?.images?.[0] || IMG.hero
  const detailId = heroProduct?._id

  const kicker = t('hero_kicker')

  const title = heroProduct ? getProductName(heroProduct)?.trim() || heroProduct.sku || t('hero_title') : t('hero_title')

  const desc = heroProduct
    ? (() => {
        const snippet = truncateText(getProductDescription(heroProduct), 160)
        if (snippet) return snippet
        const price = Number(heroProduct.price ?? 0)
        return `${price.toLocaleString('ko-KR')}원`
      })()
    : t('hero_desc')

  const visual = heroReady ? (
    <img
      src={imgSrc}
      alt={heroProduct ? getProductName(heroProduct) : ''}
      className="landing-hero-img"
      loading="eager"
    />
  ) : (
    <div className="landing-hero-img-placeholder" aria-hidden />
  )

  return (
    <section className="landing-hero">
      <div className="landing-hero-text">
        <p className="landing-hero-kicker">{kicker}</p>
        <h1 className="landing-hero-title">{title}</h1>
        <p className="landing-hero-desc">{desc}</p>
      </div>
      <div className="landing-hero-visual">
        {detailId ? (
          <Link
            to={`/products/${detailId}`}
            className="landing-hero-img-link"
            aria-label={heroProduct ? getProductName(heroProduct) || heroProduct.sku || '상품 상세' : t('hero_title')}
          >
            {visual}
          </Link>
        ) : (
          visual
        )}
      </div>
    </section>
  )
}
