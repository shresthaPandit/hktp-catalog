| column_name          | data_type                   | is_nullable |
| -------------------- | --------------------------- | ----------- |
| id                   | integer                     | NO          |
| external_id          | text                        | NO          |
| sku                  | text                        | NO          |
| name                 | text                        | NO          |
| description          | text                        | YES         |
| category             | text                        | YES         |
| subcategory          | text                        | YES         |
| brand                | text                        | YES         |
| price                | numeric                     | YES         |
| image_urls           | ARRAY                       | YES         |
| primary_image_url    | text                        | YES         |
| specifications       | jsonb                       | YES         |
| related_parts        | ARRAY                       | YES         |
| alternate_skus       | ARRAY                       | YES         |
| in_stock             | boolean                     | YES         |
| search_vector        | tsvector                    | YES         |
| last_sync_at         | timestamp without time zone | YES         |
| created_at           | timestamp without time zone | YES         |
| updated_at           | timestamp without time zone | YES         |
| status               | smallint                    | YES         |
| show_on_website      | boolean                     | YES         |
| assembly_category_id | integer                     | YES         |