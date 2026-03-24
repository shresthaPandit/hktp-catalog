#!/bin/bash
git add scripts/import/detect-charset.sh
git add scripts/import/load.conf
git commit -m "feat(01-02): create charset detection script and pgloader config

- detect-charset.sh: detects utf8mb4/latin1, samples actual schema columns,
  notes image filename-only pattern and hkmis.ca URL confirmation required
- load.conf: pgloader config with staging_ table naming, imports 6 tables
  (tbl_product, tbl_product_image, tbl_product_cross_ref, tbl_product_category,
  tbl_product_assigned_category, tbl_brand) per actual dump schema

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
