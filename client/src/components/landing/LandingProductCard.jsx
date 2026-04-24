import { Link } from 'react-router-dom'
import { getProductName } from '../../utils/productLocale'
import { Card, CardContent } from '@/components/ui/card'

export default function LandingProductCard({ product, detailId }) {
  const toId = detailId ?? product.detailId ?? product._id
  const displayName = getProductName(product)
  const imgSrc = product.img || product.images?.[0] || 'https://placehold.co/600?text=No+Image'
  const img = (
    <img
      src={imgSrc}
      alt=""
      className="landing-product-img h-full w-full object-cover transition-transform duration-500"
      loading="lazy"
    />
  )
  const priceLine = product.priceKo ?? product.priceDisplay
  return (
    <Card className="landing-product-card overflow-hidden rounded-2xl border border-[#d8dee6] bg-transparent py-0 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="landing-product-img-wrap mb-0 bg-[#e9eef4]">
        {toId ? (
          <Link
            to={`/products/${toId}`}
            className="landing-product-img-link block h-full w-full"
            aria-label={displayName}
          >
            {img}
          </Link>
        ) : (
          img
        )}
      </div>
      <CardContent className="space-y-1.5 border-t border-[#d8dee6] bg-[#f6f8fb] p-4 text-left">
        <h3 className="landing-product-name line-clamp-2 min-h-11 text-sm font-semibold text-foreground">{displayName}</h3>
        <p className="landing-product-price text-sm text-muted-foreground">{priceLine}</p>
      </CardContent>
    </Card>
  )
}
