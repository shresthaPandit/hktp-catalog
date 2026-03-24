#!/usr/bin/env node
// Debug: test search_products RPC directly (bypasses Next.js entirely)
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://uibyfzthfjhxdxyferqj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpYnlmenRoZmpoeGR4eWZlcnFqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQ1ODQzOCwiZXhwIjoyMDg5MDM0NDM4fQ.bfVy_5Jm0lZHPwNdIjj5PvCrHTis-nGNKIIIDYPyCEQ'
)

async function test(label, query) {
  process.stdout.write(`\n[${label}] query="${query}" ... `)
  const { data, error } = await supabase.rpc('search_products', {
    search_query: query,
    category_filter: null,
    brand_filter: null,
    in_stock_only: false,
    limit_count: 5,
    offset_count: 0,
  })
  if (error) {
    console.log(`ERROR: ${JSON.stringify(error)}`)
  } else {
    console.log(`OK — ${data.length} result(s)`)
    if (data.length > 0) {
      data.forEach(r => console.log(`  SKU=${r.sku}  name=${r.name?.slice(0, 50)}  rel=${r.relevance}`))
    }
  }
}

async function testDirect(label, sku) {
  process.stdout.write(`\n[${label}] direct products WHERE sku ILIKE '%${sku}%' ... `)
  const { data, error } = await supabase
    .from('products')
    .select('id, sku, name, alternate_skus')
    .ilike('sku', `%${sku}%`)
    .limit(5)
  if (error) {
    console.log(`ERROR: ${JSON.stringify(error)}`)
  } else {
    console.log(`OK — ${data.length} result(s)`)
    data.forEach(r => console.log(`  SKU=${r.sku}  alt=${JSON.stringify(r.alternate_skus)}`))
  }
}

async function run() {
  console.log('=== Search Debug ===')

  // 1. Direct table query — proves data exists
  await testDirect('direct-partial', 'HKP')

  // 2. RPC with empty query (browse mode)
  await test('rpc-empty', '')

  // 3. RPC with partial SKU fragment
  await test('rpc-partial-sku', 'HKP')

  // 4. Fetch a real SKU from DB first, then test exact + partial
  const { data: sample } = await supabase.from('products').select('sku, alternate_skus').limit(3)
  if (sample?.length) {
    const sku = sample[0].sku
    await test(`rpc-exact [${sku}]`, sku)
    const partial = sku.slice(0, Math.max(3, sku.length - 2))
    await test(`rpc-partial [${partial}]`, partial)
    if (sample[0].alternate_skus?.length) {
      await test(`rpc-alt-sku [${sample[0].alternate_skus[0]}]`, sample[0].alternate_skus[0])
    }
  }

  // 5. Test special char (hash)
  await test('rpc-hash', '#HKP')

  // 6. Test word search
  await test('rpc-word', 'trailer')

  console.log('\n=== Done ===')
}

run().catch(console.error)
