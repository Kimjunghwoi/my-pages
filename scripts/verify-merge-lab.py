"""Execute the public self-contained M lab in a separate native Excel workbook."""
import hashlib
import json
from pathlib import Path

import win32com.client

root = Path(__file__).resolve().parent.parent
source = (root / "data-guides/merge-lab.pq").read_text(encoding="utf-8")
checks = []


def check(name, actual, expected):
    assert actual == expected, (name, actual, expected)
    checks.append({"name": name, "actual": actual, "expected": expected})


app = win32com.client.DispatchEx("Excel.Application")
book = None
try:
    app.Visible = False
    app.DisplayAlerts = False
    app.AutomationSecurity = 3
    book = app.Workbooks.Add()

    def query(name, formula):
        book.Queries.Add(name, formula)
        sheet = book.Worksheets.Add()
        sheet.Name = name
        connection = f'OLEDB;Provider=Microsoft.Mashup.OleDb.1;Data Source=$Workbook$;Location={name};Extended Properties=""'
        table = sheet.QueryTables.Add(Connection=connection, Destination=sheet.Range("A1"))
        table.CommandType = 2
        table.CommandText = f"SELECT * FROM [{name}]"
        table.BackgroundQuery = False
        table.Refresh(False)
        return [list(row) for row in sheet.UsedRange.Value2]

    for mode, rows, total in (("audit", 4, 42), ("expanded", 6, 72), ("corrected", 4, 42)):
        result = query(mode, source.replace('Mode = "audit"', f'Mode = "{mode}"', 1))
        check(mode + ".rows", len(result) - 1, rows)
        check(mode + ".total", sum(row[3] for row in result[1:]), total)
        if mode == "audit":
            check("match_counts", [row[4] for row in result[1:]], [2, 2, 1, 0])
        if mode == "corrected":
            check("corrected.records", result[1:], [
                ["S1", "C10", "A1", 10, "Seoul"],
                ["S2", "C10", "A2", 20, "Busan"],
                ["S3", "C20", "A3", 5, "Incheon"],
                ["S4", "C30", None, 7, None],
            ])
    faulty = source.replace('Mode = "audit"', 'Mode = "corrected"', 1).replace(
        '{"A1","C10","Seoul"}', '{"A1","C10","Seoul"}, {"A1","C10","Duplicate"}'
    )
    result = query("BadLookup", 'let Attempt = try Json.FromValue((' + faulty +
                   ')) in #table({"message"}, {{if Attempt[HasError] then Attempt[Error][Message] else "NO ERROR"}})')
    check("duplicate_rejected", result, [["message"], ["Address lookup keys must be nonempty and unique"]])
    print(json.dumps({"date": "2026-10-05", "excel": str(app.Version), "build": str(app.Build),
                      "method": "Native Excel Mashup engine through OLE DB; not UI clicks or external connectors",
                      "querySha256": hashlib.sha256(source.encode()).hexdigest(), "checks": checks}, indent=2))
finally:
    if book is not None:
        book.Close(False)
    app.Quit()
