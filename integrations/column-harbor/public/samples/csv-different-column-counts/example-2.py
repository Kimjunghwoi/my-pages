import csv

with open("input.csv", encoding="utf-8-sig", newline="") as f:
    reader = csv.reader(f, delimiter=",", strict=True)
    header = next(reader, None)
    if header is None:
        raise ValueError("The file is empty")
    expected = len(header)
    for record, fields in enumerate(reader, start=2):
        if len(fields) != expected:
            print(f"record {record}: {len(fields)} fields; expected {expected}")

# Output for this sample:
# record 3: 4 fields; expected 3
# record 4: 2 fields; expected 3
