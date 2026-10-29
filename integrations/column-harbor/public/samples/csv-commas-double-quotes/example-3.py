import csv

rows = [
    ["item_id", "description", "note"],
    ["P11", "Mug, blue", 'Label says "Fragile"'],
    ["P12", "Tray", "Top shelf\nKeep upright"],
]
with open("sample.csv", "w", encoding="utf-8", newline="") as f:
    csv.writer(f, lineterminator="\n").writerows(rows)

with open("sample.csv", encoding="utf-8", newline="") as f:
    assert list(csv.reader(f)) == rows
