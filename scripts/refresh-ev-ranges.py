"""Regenerate src/data/ev-range-by-year.ts from the EPA bulk dataset.

Run from the repo root. The table covers 2011 onward — the era the catalog
documents. Earlier rows exist in the EPA data (a 1997 RAV4 EV, a 1998 S10
Electric) and are not cars anyone is shopping for.
"""
import csv
import re
from collections import defaultdict

CSV = ('C:/Users/lemue/AppData/Local/Temp/claude/'
       'H--CLAUDE-CODE-Electrifying-the-US/af7b1079-449b-4906-93e0-22ad07593934/'
       'scratchpad/vehicles.csv')
FIRST_YEAR = 2011

cat_src = open('src/data/ev-catalog.ts', encoding='utf-8').read()
ENTRY_RE = (r'\{ id: "([^"]+)", make: "([^"]+)", model: "([^"]+)"'
            r'(?:, rangeMi: (\d+))?(?:, aliases: \[([^\]]*)\])?')
entries = [{'id': m.group(1), 'make': m.group(2), 'model': m.group(3),
            'aliases': re.findall(r'"([^"]+)"', m.group(5) or '')}
           for m in re.finditer(ENTRY_RE, cat_src)]


def norm(s):
    return re.sub(r'[^a-z0-9]', '', (s or '').lower())


# Where the EPA writes a car differently from our catalog. Order matters: the
# most specific rule first, because an EQS 580 is also an "EQS <n> 4matic".
OVERRIDE = [
    ('mercedes-eqs-580', r'^eqs 580 4matic$', 'Mercedes-Benz'),
    ('mercedes-eqs-suv', r'eqs.*\(suv\)', 'Mercedes-Benz'),
    ('mercedes-eqs', r'^eqs \d+ (plus|4matic)$', 'Mercedes-Benz'),
    ('mercedes-eqe-suv', r'eqe.*\(suv\)', 'Mercedes-Benz'),
    ('mercedes-eqe', r'^eqe\b(?!.*\(suv\))(?!.*amg)', 'Mercedes-Benz'),
    ('mercedes-cla-ev', r'cla\d+.*eq tech', 'Mercedes-Benz'),
    ('bmw-i7', r'^i7\b', 'BMW'),
    ('dodge-charger-daytona-ev', r'charger.*daytona', 'Dodge'),
    ('kia-niro-ev', r'^niro electric', 'Kia'),
    ('honda-clarity-electric', r'^clarity ev', 'Honda'),
    ('toyota-chr-ev', r'^c-hr\b', 'Toyota'),
    ('gmc-sierra-ev', r'^sierra ev(?!.*denali)', 'GMC'),
]
by_id = {e['id']: e for e in entries}
override_ids = {cid for cid, _, _ in OVERRIDE}
alias_index = sorted(
    ((norm(n), e) for e in entries for n in [e['model']] + e['aliases']),
    key=lambda x: -len(x[0]),
)


def match(make, model):
    """Same shape as matchCatalogVehicle: longest name wins, make must agree."""
    for cid, pattern, omake in OVERRIDE:
        if make == omake and re.search(pattern, model.strip(), re.I):
            return by_id[cid]
    mk, md = norm(make), norm(model)
    hay = md if md.startswith(mk) else mk + md
    for alias, e in alias_index:
        if not alias or alias not in hay or e['id'] in override_ids:
            continue
        vmake = norm(e['make'])
        if mk and vmake and vmake not in hay:
            continue
        if len(alias) < 4 and not (mk and vmake and vmake in hay):
            continue
        return e
    return None


buckets, dropped = defaultdict(list), defaultdict(set)
for row in csv.DictReader(open(CSV, newline='', encoding='utf-8', errors='replace')):
    if (row.get('atvType') or '') != 'EV':
        continue
    miles = float(row.get('range') or 0)
    if miles <= 0:
        continue
    car = match(row['make'], row['model'])
    if not car:
        continue
    year = int(row['year'])
    if year < FIRST_YEAR:
        dropped[f"{row['make']} {row['model']}"].add(year)
        continue
    buckets[(car['id'], year)].append(round(miles))

table = defaultdict(dict)
for (cid, year), values in buckets.items():
    low, high = min(values), max(values)
    table[cid][year] = [low] if low == high else [low, high]

current = open('src/data/ev-range-by-year.ts', encoding='utf-8').read()
head = current.split('export const EV_RANGE_BY_YEAR')[0]
tail = current.split('};', 1)[1]

body = ['export const EV_RANGE_BY_YEAR: '
        'Readonly<Record<string, Readonly<Record<number, EpaRangeBand>>>> = {']
for cid in sorted(table):
    years = sorted(table[cid])
    pairs = ", ".join(f"{y}: [{', '.join(map(str, table[cid][y]))}]" for y in years)
    body.append(f'  "{cid}": {{ {pairs} }},')
body.append('};')

open('src/data/ev-range-by-year.ts', 'w', encoding='utf-8', newline='').write(
    head + "\n".join(body) + tail)

print(f"{len(table)} cars, {sum(len(v) for v in table.values())} model years, from {FIRST_YEAR}")
for name, years in sorted(dropped.items()):
    print(f"  dropped pre-{FIRST_YEAR}: {name} {sorted(years)}")
