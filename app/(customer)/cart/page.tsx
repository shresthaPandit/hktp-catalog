import { redirect } from 'next/navigation'

// Cart is a drawer, not a page. Users who navigate directly to /cart are sent to /products.
// Per locked decision: drawer replaces cart page.
export default function CartPage() {
  redirect('/products')
}
