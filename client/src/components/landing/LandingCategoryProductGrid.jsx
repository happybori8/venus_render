import { useEffect, useState } from 'react'
import { t } from '../../i18n/t'
import { getProductsAPI } from '../../api/products'
import LandingProductCard from './LandingProductCard'
import { sortProductsForLanding } from '../../lib/productDisplayOrder'

const LANDING_CATEGORY_LIMIT = 100

/**
 * 메인 랜딩 — 카테고리에 등록된 상품 전부 표시 (SKU 접두사 제한 없음)
 */
export default function LandingCategoryProductGrid({ category, titleKey, emptyKey }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await getProductsAPI({
          category,
          limit: LANDING_CATEGORY_LIMIT,
          page: 1,
          sort: 'newest',
        })
        if (!cancelled) setProducts(sortProductsForLanding(data.products || []))
      } catch {
        if (!cancelled) setProducts([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [category])

  const mapped = products.map((p) => ({
    ...p,
    id: p._id,
    detailId: p._id,
    img: p.images?.[0] || 'https://placehold.co/600?text=No+Image',
    priceKo: `${Number(p.price ?? 0).toLocaleString('ko-KR')}원`,
  }))

  return (
    <section className="landing-section landing-products">
      <div className="landing-section-inner">
        <h2 className="landing-section-title">{t(titleKey)}</h2>
        {loading ? (
          <p className="landing-maskpack-loading">{t('landing_loading')}</p>
        ) : mapped.length === 0 ? (
          <p className="landing-maskpack-empty">{t(emptyKey)}</p>
        ) : (
          <div className="landing-product-grid">
            {mapped.map((p) => (
              <LandingProductCard key={p.id} product={p} detailId={p.detailId} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
