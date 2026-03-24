#!/usr/bin/env node
// Migration: cross-references + trailer sections + assembly_category_id on products
const fs = require('fs')
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://uibyfzthfjhxdxyferqj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpYnlmenRoZmpoeGR4eWZlcnFqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQ1ODQzOCwiZXhwIjoyMDg5MDM0NDM4fQ.bfVy_5Jm0lZHPwNdIjj5PvCrHTis-nGNKIIIDYPyCEQ'
)

const SQL_FILE = 'C:/desktop/HK/client_data/hktrailer_products_only/hktrailer_products_only.sql'
const IMAGE_BASE = 'https://hkmis.ca/web/product-images/'

function parseCrossRefs(sql) {
  const map = {} // external_id -> Set of cross_ref strings
  const regex = /\((\d+),\s*(\d+),\s*'([^']*)',/g
  let inSection = false
  const lines = sql.split('\n')
  for (const line of lines) {
    if (line.includes('Dumping data for table `tbl_product_cross_ref`')) inSection = true
    if (inSection && line.includes('Dumping data for table `tbl_product_') && !line.includes('cross_ref')) inSection = false
    if (!inSection) continue
    const insertMatch = line.match(/^\((\d+),\s*(\d+),\s*'([^']*)'/)
    if (!insertMatch) continue
    const fkProductId = insertMatch[2]
    const crossRef = insertMatch[3].trim()
    // skip empty, test, or obviously fake entries
    if (!crossRef || crossRef.length < 4) continue
    if (/^(item|test|dfd|ffd|dfd)/i.test(crossRef)) continue
    if (!map[fkProductId]) map[fkProductId] = new Set()
    map[fkProductId].add(crossRef)
  }
  return map
}

function parseAssemblyCategories(sql) {
  // Returns map of client product id -> fk_assembly_category_id
  const map = {}
  const lines = sql.split('\n')
  let inProduct = false
  for (const line of lines) {
    if (line.includes('INSERT INTO `tbl_product`')) inProduct = true
    if (!inProduct) continue
    // parse rows: (id, name, description, website_description, fk_category_id, fk_cycle_count_category_id, fk_assembly_category_id, sku, ...)
    const m = line.match(/^\((\d+),\s*'[^']*',\s*(?:'[^']*'|NULL),\s*(?:'[^']*'|NULL),\s*(?:\d+|NULL),\s*(?:\d+|NULL),\s*(\d+|NULL),/)
    if (m) {
      const productId = m[1]
      const assemblyId = m[2] === 'NULL' ? null : parseInt(m[2])
      if (assemblyId) map[productId] = assemblyId
    }
  }
  return map
}

async function run() {
  const sql = fs.readFileSync(SQL_FILE, 'utf8')

  // ── STEP 1: Create trailer_sections table ──────────────────────────────────
  console.log('\n[1/4] Creating trailer_sections table...')
  const sections = [
    { id: 1, title: 'Rear Frame',                      image_url: `${IMAGE_BASE}rear-frame.png`,              exploded_image_url: `${IMAGE_BASE}BACKFRAME.png`,                        img_width: 70,  translate_x: 13,  translate_y: -124 },
    { id: 3, title: 'Axle End',                         image_url: `${IMAGE_BASE}axle-end.png`,               exploded_image_url: `${IMAGE_BASE}Axel..png`,                             img_width: 70,  translate_x: 24,  translate_y: 97   },
    { id: 4, title: 'Base Assembly and Landing Gear',   image_url: `${IMAGE_BASE}base-assembly-landing-gear.png`, exploded_image_url: `${IMAGE_BASE}base-assembly-landing-gear.png`,   img_width: 450, translate_x: 59,  translate_y: -21  },
    { id: 5, title: 'Side Wall',                        image_url: `${IMAGE_BASE}side-wall.png`,              exploded_image_url: `${IMAGE_BASE}sidewall.png`,                          img_width: 370, translate_x: 130, translate_y: -103 },
    { id: 6, title: 'Roof Assembly',                    image_url: `${IMAGE_BASE}roof-assembly.png`,          exploded_image_url: `${IMAGE_BASE}GeminiGeneratedImagewsinjqwsinjqwsin.png`, img_width: 420, translate_x: 120, translate_y: -180 },
    { id: 7, title: 'Front Wall',                       image_url: `${IMAGE_BASE}front-wall.png`,             exploded_image_url: `${IMAGE_BASE}GeminiGeneratedImagesfnwedsfnwedsfnw.png`, img_width: 100, translate_x: 503, translate_y: 170  },
  ]

  // Upsert via REST API since we can't run DDL directly
  // First try inserting — if table doesn't exist we need to create it via SQL
  const { error: sectionError } = await supabase.from('trailer_sections').upsert(sections)
  if (sectionError) {
    console.log('  trailer_sections table missing, will create via RPC or skip:', sectionError.message)
    console.log('  NOTE: Run this SQL in Supabase dashboard:\n')
    console.log(`CREATE TABLE IF NOT EXISTS trailer_sections (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  image_url TEXT,
  exploded_image_url TEXT,
  img_width INTEGER,
  translate_x INTEGER,
  translate_y INTEGER
);`)
    console.log('\n  Then re-run this script.')
  } else {
    console.log(`  ✓ Upserted ${sections.length} trailer sections`)
  }

  // ── STEP 2: Parse cross-references from SQL ────────────────────────────────
  console.log('\n[2/4] Parsing cross-references from SQL file...')
  const crossRefMap = parseCrossRefs(sql)
  const crossRefProductIds = Object.keys(crossRefMap)
  console.log(`  Found cross-refs for ${crossRefProductIds.length} products`)
  // sample
  const sample = crossRefProductIds.slice(0, 3)
  sample.forEach(id => console.log(`  Product ${id}: ${[...crossRefMap[id]].join(', ')}`))

  // ── STEP 3: Update alternate_skus in batches ───────────────────────────────
  console.log('\n[3/4] Updating alternate_skus on products...')
  let updated = 0, skipped = 0
  const ids = Object.keys(crossRefMap)
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50)
    for (const extId of batch) {
      const skus = [...crossRefMap[extId]]
      const { error } = await supabase
        .from('products')
        .update({ alternate_skus: skus })
        .eq('external_id', extId)
      if (error) { skipped++; continue }
      updated++
    }
    process.stdout.write(`\r  Progress: ${Math.min(i + 50, ids.length)}/${ids.length}`)
  }
  console.log(`\n  ✓ Updated ${updated} products with cross-refs, skipped ${skipped}`)

  // ── STEP 4: Update assembly_category_id ───────────────────────────────────
  console.log('\n[4/4] Updating assembly_category_id on products...')
  const assemblyMap = parseAssemblyCategories(sql)
  const assemblyIds = Object.keys(assemblyMap)
  console.log(`  Found assembly categories for ${assemblyIds.length} products`)
  let aUpdated = 0, aSkipped = 0
  for (let i = 0; i < assemblyIds.length; i += 50) {
    const batch = assemblyIds.slice(i, i + 50)
    for (const extId of batch) {
      const { error } = await supabase
        .from('products')
        .update({ assembly_category_id: assemblyMap[extId] })
        .eq('external_id', extId)
      if (error) { aSkipped++; continue }
      aUpdated++
    }
    process.stdout.write(`\r  Progress: ${Math.min(i + 50, assemblyIds.length)}/${assemblyIds.length}`)
  }
  console.log(`\n  ✓ Updated ${aUpdated} products with assembly_category_id, skipped ${aSkipped}`)

  console.log('\n✅ Migration complete!')
}

run().catch(console.error)
