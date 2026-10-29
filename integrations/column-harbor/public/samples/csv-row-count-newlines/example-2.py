import csv

with open("input.csv", encoding="utf-8-sig", newline="") as f:
    reader = csv.reader(f, delimiter=",", strict=True)
    header = next(reader, None)
    if header is None:
        raise ValueError("The file is empty")
    count = 0
    end_lines = []
    for fields in reader:
        count += 1
        end_lines.append(reader.line_num)
    print("data records:", count)
    print("data records end on lines:", end_lines)

# data records: 2
# data records end on lines: [3, 4]
