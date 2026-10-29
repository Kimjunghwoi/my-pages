import csv, sys

if len(sys.argv) != 3:
    raise SystemExit("Usage: python tsv_to_csv.py input.tsv output.csv")
with open(sys.argv[1], encoding="utf-8-sig", newline="") as f:
    reader = csv.reader(f, delimiter="\t", quotechar='"', strict=True)
    header = next(reader, None)
    if not header or any(not h.strip() for h in header):
        raise ValueError("Nonempty headers required")
    if len(header) != len(set(header)):
        raise ValueError("Duplicate headers require a schema decision")
    rows = []
    for number, row in enumerate(reader, 2):
        if len(row) != len(header):
            raise ValueError(f"Record {number}: wrong number of fields")
        rows.append(row)
with open(sys.argv[2], "x", encoding="utf-8", newline="") as f:
    writer = csv.writer(f, lineterminator="\r\n")
    writer.writerow(header)
    writer.writerows(rows)
with open(sys.argv[2], encoding="utf-8", newline="") as f:
    round_trip = list(csv.reader(f, strict=True))
if round_trip != [header, *rows]:
    raise ValueError("Converted CSV does not preserve the input fields")
print(f"Wrote {len(rows)} data records; field values verified")

