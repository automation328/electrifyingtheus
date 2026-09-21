"""Regenerate src/data/ev-range-by-year.ts from the EPA bulk dataset.

Run from the repo root, with the EPA's vehicles.csv at CSV below
(fueleconomy.gov/feg/epadata/vehicles.csv).

The table covers 2011 onward — the era the catalog documents. Earlier rows
exist in the EPA data (a 1997 RAV4 EV, a 1998 S10 Electric) and are not cars
anyone is shopping for.

One row per EPA VARIANT, not one per model year: the EPA rates a 2026 LYRIQ
four times over (rear drive 326, PAWD 319, AWD 303, V-Series 285), and a
listing that names its trim and its drivetrain deserves the figure for the car
it is, not the spread across the nameplate.
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


# The EPA's drive column, as one letter. 4-wheel drive collapses into all-wheel:
# listings write both as "AWD" or "4WD" interchangeably, and a wrong split would
# throw away the only strong signal we have.
DRIVE = {
    'rear-wheel drive': 'r',
    'front-wheel drive': 'f',
    'all-wheel drive': 'a',
    '4-wheel drive': 'a',
    'part-time 4-wheel drive': 'a',
    '4-wheel or all-wheel drive': 'a',
}

# Words that say how the car drives rather than which car it is. Dropped from
# the label because the drive letter already carries them — except PAWD, which
# is a Cadillac trim (performance AWD) and rates differently from plain AWD.
DRIVE_WORDS = {'awd', 'rwd', 'fwd', '4wd', '2wd', '4matic', 'quattro', 'xdrive'}


def label_for(model, car):
    """What is left of the EPA's model text once the nameplate is removed.

    "Model 3 Long Range AWD" -> "long range"; "LYRIQ (11 kW Charger)" ->
    "11 kw charger". This is what a listing's trim is matched against.
    """
    words = re.findall(r'[a-z0-9]+', model.lower())
    drop = set()
    for name in [car['model']] + car['aliases']:
        drop |= set(re.findall(r'[a-z0-9]+', name.lower()))
    kept = [w for w in words if w not in drop and w not in DRIVE_WORDS]
    return ' '.join(kept).strip()


variants, dropped = defaultdict(list), defaultdict(set)
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
    variants[(car['id'], year)].append((
        round(miles),
        DRIVE.get((row.get('drive') or '').strip().lower(), ''),
        label_for(row['model'], car),
    ))

# Catalog entries that are a TRIM of another entry rather than a car of their
# own. The EPA files "Model 3 Performance AWD" under the child, but a dealer
# files the same car as model "Model 3", trim "Performance" — so the parent has
# to carry the child's ratings, labelled with what makes them that trim.
#
# Deliberately a list and not an id-prefix rule: mercedes-eqs-suv, gmc-hummer-
# ev-suv and audi-e-tron-gt read like children of eqs, hummer-ev and e-tron and
# are separate vehicles, whose ranges must not be merged into them.
TRIM_OF = {
    'tesla-model-3-performance': 'tesla-model-3',
    'ford-mustang-mach-e-gt': 'ford-mustang-mach-e',
    'hyundai-ioniq-5-n': 'hyundai-ioniq-5',
    'bmw-ix-xdrive40': 'bmw-ix',
    'gmc-sierra-ev-denali': 'gmc-sierra-ev',
    'mercedes-eqs-580': 'mercedes-eqs',
}
for (cid, year), rows in list(variants.items()):
    parent = TRIM_OF.get(cid)
    if not parent:
        continue
    suffix = cid[len(parent) + 1:].replace('-', ' ')
    for miles, drive, label in rows:
        variants[(parent, year)].append((miles, drive, f'{suffix} {label}'.strip()))

table = defaultdict(dict)
for (cid, year), rows in variants.items():
    seen, unique = set(), []
    for v in sorted(rows):
        if v in seen:
            continue
        seen.add(v)
        unique.append(v)
    table[cid][year] = unique

START = '// ── generated: EPA variants ─────────────────────────────────────────────────'
END = '// ── end generated ───────────────────────────────────────────────────────────'
current = open('src/data/ev-range-by-year.ts', encoding='utf-8').read()
head, rest = current.split(START, 1)
tail = rest.split(END, 1)[1]

body = [START,
        'export const EV_RANGE_VARIANTS: '
        'Readonly<Record<string, Readonly<Record<number, readonly EpaVariant[]>>>> = {']
for cid in sorted(table):
    body.append(f'  "{cid}": {{')
    for year in sorted(table[cid]):
        cells = ', '.join(
            f'[{miles}, "{drive}"]' if not label else f'[{miles}, "{drive}", "{label}"]'
            for miles, drive, label in table[cid][year])
        body.append(f'    {year}: [{cells}],')
    body.append('  },')
body.append('};')
body.append(END)

open('src/data/ev-range-by-year.ts', 'w', encoding='utf-8', newline='').write(
    head + "\n".join(body) + tail)

total = sum(len(v) for years in table.values() for v in years.values())
print(f"{len(table)} cars, {sum(len(v) for v in table.values())} model years, "
      f"{total} variants, from {FIRST_YEAR}")
for name, years in sorted(dropped.items()):
    print(f"  dropped pre-{FIRST_YEAR}: {name} {sorted(years)}")
