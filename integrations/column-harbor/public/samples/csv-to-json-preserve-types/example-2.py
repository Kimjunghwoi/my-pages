import csv, json, re, sys

if len(sys.argv) not in (3, 4):
    raise SystemExit("Usage: python csv_to_json.py input.csv output.json [--quantity-as-number]")
typed = len(sys.argv) == 4
if typed and sys.argv[3] != "--quantity-as-number":
    raise SystemExit("Unknown option")
with open(sys.argv[1], encoding="utf-8-sig", newline="") as f:
    reader = csv.reader(f, strict=True)
    header = next(reader, None)
    if not header or any(not h.strip() for h in header):
        raise ValueError("Nonempty headers required")
    if len(header) != len(set(header)):
        raise ValueError("Duplicate headers would overwrite JSON properties")
    if typed and "quantity" not in header:
        raise ValueError("Typed mode requires a quantity column")
    result = []
    for number, row in enumerate(reader, 2):
        if len(row) != len(header):
            raise ValueError(f"Record {number}: wrong number of fields")
        item = dict(zip(header, row))
        if typed:
            value = item["quantity"]
            if value == "":
                item["quantity"] = None
            elif re.fullmatch(r"0|[1-9][0-9]*", value):
                item["quantity"] = int(value)
            else:
                raise ValueError(f"Record {number}: invalid quantity")
        result.append(item)
with open(sys.argv[2], "x", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, indent=2, allow_nan=False)
    f.write("\n")
print(f"Wrote {len(result)} objects")

