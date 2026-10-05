"""Verify the published synthetic CSV in an isolated native Excel instance."""
import json
from datetime import datetime, timezone
from pathlib import Path

import win32com.client

root = Path(__file__).resolve().parent.parent
results = []


def check(name, observed, expected):
    assert observed == expected, (name, observed, expected)
    results.append({"check": name, "expected": expected, "observed": observed})


excel = win32com.client.DispatchEx("Excel.Application")
try:
    excel.Visible = False
    excel.DisplayAlerts = False
    excel.AutomationSecurity = 3
    version, build = excel.Version, excel.Build
    for mode in ("general", "text"):
        book = excel.Workbooks.Add()
        try:
            sheet = book.Worksheets(1)
            query = sheet.QueryTables.Add(
                Connection="TEXT;" + str(root / "data-guides" / "semicolon-example.csv"),
                Destination=sheet.Range("A1"),
            )
            query.TextFilePlatform = 65001
            query.TextFileStartRow = 1
            query.TextFileParseType = 1
            query.TextFileTextQualifier = 1
            query.TextFileConsecutiveDelimiter = False
            query.TextFileTabDelimiter = False
            query.TextFileSemicolonDelimiter = True
            query.TextFileCommaDelimiter = False
            query.TextFileSpaceDelimiter = False
            query.TextFileOtherDelimiter = ""
            query.TextFileColumnDataTypes = (2 if mode == "text" else 1, 2, 1)
            query.TextFileDecimalSeparator = "."
            query.TextFileThousandsSeparator = ","
            query.Refresh(BackgroundQuery=False)
            query.Delete()
            check(mode + ".rows", sheet.UsedRange.Rows.Count, 3)
            check(mode + ".columns", sheet.UsedRange.Columns.Count, 3)
            check(mode + ".description1", sheet.Cells(2, 2).Value2, "Mug, blue")
            check(mode + ".description2", sheet.Cells(3, 2).Value2, "Plate; small")
            check(mode + ".price1", sheet.Cells(2, 3).Value2, 12.5)
            check(mode + ".price2", sheet.Cells(3, 3).Value2, 8)
            check(mode + ".sku", sheet.Cells(2, 1).Value2, "00123" if mode == "text" else 123)
            check(mode + ".sku2", sheet.Cells(3, 1).Value2, "00456" if mode == "text" else 456)
            check(mode + ".skuIsText", isinstance(sheet.Cells(2, 1).Value2, str), mode == "text")
            for cell, formula, expected in (
                ("E2", "=ISTEXT(A2)", mode == "text"),
                ("F2", "=LEN(A2)", 5 if mode == "text" else 3),
                ("G2", '=EXACT(A2,"00123")', mode == "text"),
            ):
                sheet.Range(cell).Formula = formula
                excel.CalculateFull()
                check(mode + "." + formula, sheet.Range(cell).Value2, expected)
            if mode == "general":
                sheet.Cells(2, 1).NumberFormat = "00000"
                check("display-only.text", sheet.Cells(2, 1).Text, "00123")
                check("display-only.value", sheet.Cells(2, 1).Value2, 123)
                check("display-only.isText", isinstance(sheet.Cells(2, 1).Value2, str), False)
        finally:
            book.Close(SaveChanges=False)
    print(json.dumps({
        "checkedAt": datetime.now(timezone.utc).isoformat(),
        "excelVersion": version, "excelBuild": build,
        "method": "Excel COM QueryTables TEXT import; semicolon, double-quote qualifier, explicit column types and decimal point",
        "limits": "Not Power Query or UI-click testing. Source unchanged; no claim about every version or default settings.",
        "passed": len(results), "results": results,
    }, indent=2))
finally:
    excel.Quit()
