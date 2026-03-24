import re

content = open('client_data/hktrailer_products_only/hktrailer_products_only.sql', encoding='latin-1').read()

# Extract just the tbl_product section
start = content.find("INSERT INTO `tbl_product`")
end = content.find("CREATE TABLE `tbl_product_allotment`")
section = content[start:end]

total = len(re.findall(r'\n\(\d+,', section))

# status and show_on_website are the 29th and 27th fields (0-based)
# Easier: use the insert-via-api parser logic
# Quick approach: grep for ', show_on_website_val, ip_str, status_val,'
# Pattern near end of each row: , SHOW, 'IP', STATUS, CRT_BY, ...
# show=1 status=1
s1_sw1 = len(re.findall(r", 1, '[\d\.]+', 1,", section))
s1_sw2 = len(re.findall(r", 2, '[\d\.]+', 1,", section))
s0_sw1 = len(re.findall(r", 1, '[\d\.]+', 0,", section))
s0_sw2 = len(re.findall(r", 2, '[\d\.]+', 0,", section))
s2_any = len(re.findall(r", [12], '[\d\.]+', 2,", section))

print(f"Total rows in dump:                    {total}")
print(f"show_on_website=1, status=1 (ACTIVE):  ~{s1_sw1}  ← imported")
print(f"show_on_website=2, status=1 (HIDDEN):  ~{s1_sw2}  ← admin marked 'hide from website'")
print(f"show_on_website=1, status=0 (INACTIVE):~{s0_sw1}  ← deactivated products")
print(f"show_on_website=2, status=0:           ~{s0_sw2}")
print(f"status=2 (BLOCKED):                    ~{s2_any}")
print(f"\nImported to Supabase: 3459")
print(f"Filtered out:         {total - 3459}")
