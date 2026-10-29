import csv, json, sys

def ids(path):
    with open(path, encoding="utf-8-sig", newline="") as f:
        rows = csv.reader(f, strict=True)
        header = next(rows, None)
        if not header or any(not h.strip() for h in header):
            raise ValueError(f"{path}: missing or blank header")
        if len(header) != len(set(header)) or header.count("id") != 1:
            raise ValueError(f"{path}: unique headers including id required")
        col = header.index("id")
        result = set()
        for record, row in enumerate(rows, 2):
            if len(row) != len(header):
                raise ValueError(f"{path}: record {record} has wrong width")
            key = row[col]
            if not key.strip() or key in result:
                raise ValueError(f"{path}: blank or duplicate id at {record}")
            result.add(key)
        return result

if len(sys.argv) != 3:
    raise SystemExit("Usage: python compare_ids.py old.csv new.csv")
old, new = map(ids, sys.argv[1:])
report = {"added": sorted(new - old), "missing": sorted(old - new),
          "common": sorted(old & new)}
print(json.dumps(report, ensure_ascii=False, indent=2, allow_nan=False))

