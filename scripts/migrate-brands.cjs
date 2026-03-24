#!/usr/bin/env node
// Migration: extract brand names from product name/description and update products.brand
const fs = require('fs')
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://uibyfzthfjhxdxyferqj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpYnlmenRoZmpoeGR4eWZlcnFqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQ1ODQzOCwiZXhwIjoyMDg5MDM0NDM4fQ.bfVy_5Jm0lZHPwNdIjj5PvCrHTis-nGNKIIIDYPyCEQ'
)

const SQL_FILE = 'C:/desktop/HK/client_data/hktrailer_products_only/hktrailer_products_only.sql'

function parseBrands(sql) {
  // Extract active brands from tbl_brand (show_on_website=1, status=1)
  // Row: (id, 'title', 'description', 'image_url', show_on_website, 'ip', status, ...)
  const brands = []
  const lines = sql.split('\n')
  let inSection = false
  let pastHeader = false
  for (const line of lines) {
    if (line.includes('Dumping data for table `tbl_brand`')) { inSection = true; continue }
    if (!inSection) continue
    if (!pastHeader && !line.startsWith('(')) continue  // skip INSERT/comment header lines
    if (line.startsWith('(')) { pastHeader = true }
    else if (pastHeader && (line.startsWith('--') || line.startsWith('CREATE') || line.trim() === ';')) { inSection = false; continue }
    if (!inSection) continue
    // Match: (id, 'title', ..., show_on_website, 'ip', status, ...
    const m = line.match(/^\((\d+),\s*'([^']+)',\s*(?:'[^']*'|NULL),\s*(?:'[^']*'|NULL),\s*(\d+),\s*'[^']*',\s*(\d+),/)
    if (!m) continue
    const showOnWebsite = parseInt(m[3])
    const status = parseInt(m[4])
    const title = m[2].trim()
    // Skip inactive, hidden, or DO NOT USE brands
    if (status !== 1) continue
    if (showOnWebsite === 2) continue
    if (title.includes('(DO NO USE)') || title.includes('(DO NOT USE)')) continue
    brands.push(title)
  }
  return brands
}

function findBrandInText(text, brands, brandRegexes) {
  if (!text) return null
  const upper = text.toUpperCase()
  for (let i = 0; i < brands.length; i++) {
    if (brandRegexes[i].test(upper)) return brands[i]
  }
  return null
}

async function run() {
  const sql = fs.readFileSync(SQL_FILE, 'utf8')

  // ── Parse brands ──────────────────────────────────────────────────────────
  console.log('\n[1/3] Parsing brands from tbl_brand...')
  const rawBrands = parseBrands(sql)
  console.log(`  Found ${rawBrands.length} active brands`)

  // Sort by length descending so longer matches take priority (e.g. "HD PLUS" before "HD")
  const brands = rawBrands.sort((a, b) => b.length - a.length)

  // Build regexes — whole-word, case-insensitive match on the UPPER-CASED brand name
  const brandRegexes = brands.map(b => {
    const escaped = b.toUpperCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')
    return new RegExp(`(?<![A-Z0-9])${escaped}(?![A-Z0-9])`)
  })

  console.log('  Sample brands:', brands.slice(0, 8).join(', '))

  // ── Fetch all products from Supabase ──────────────────────────────────────
  console.log('\n[2/3] Fetching products from Supabase...')
  let allProducts = []
  let from = 0
  const PAGE = 1000
  while (true) {
    const { data, error } = await supabase
      .from('products')
      .select('id, external_id, name, description, brand')
      .range(from, from + PAGE - 1)
    if (error) { console.error('Fetch error:', error.message); break }
    if (!data || data.length === 0) break
    allProducts = allProducts.concat(data)
    if (data.length < PAGE) break
    from += PAGE
  }
  console.log(`  Fetched ${allProducts.length} products`)

  // ── Match brands and update ───────────────────────────────────────────────
  console.log('\n[3/3] Matching brands and updating products...')
  let matched = 0, skipped = 0, alreadySet = 0
  const toUpdate = []

  for (const p of allProducts) {
    if (p.brand) { alreadySet++; continue }
    const combined = `${p.name || ''} ${p.description || ''}`
    const brand = findBrandInText(combined, brands, brandRegexes)
    if (brand) toUpdate.push({ id: p.id, brand })
  }

  console.log(`  Already have brand: ${alreadySet}`)
  console.log(`  Products to update: ${toUpdate.length}`)

  // Batch update in groups of 50
  for (let i = 0; i < toUpdate.length; i += 50) {
    const batch = toUpdate.slice(i, i + 50)
    for (const { id, brand } of batch) {
      const { error } = await supabase.from('products').update({ brand }).eq('id', id)
      if (error) { skipped++; continue }
      matched++
    }
    process.stdout.write(`\r  Progress: ${Math.min(i + 50, toUpdate.length)}/${toUpdate.length}`)
  }

  console.log(`\n  ✓ Updated ${matched} products with brands, skipped ${skipped}`)
  console.log(`  Products with no brand match: ${allProducts.length - alreadySet - matched - skipped}`)
  console.log('\n✅ Brand migration complete!')
}

run().catch(console.error)
