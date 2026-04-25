/** 랜딩 등에서 SKU 자연순(m-2 < m-10) 후 최신순으로 정렬 */
export function sortProductsForLanding(products) {
  return [...(products || [])].sort((a, b) => {
    const skuCmp = String(a.sku || '').localeCompare(String(b.sku || ''), undefined, {
      numeric: true,
      sensitivity: 'base',
    })
    if (skuCmp !== 0) return skuCmp
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  })
}
