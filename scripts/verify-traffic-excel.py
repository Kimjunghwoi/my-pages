"""Run fixed guide examples in a new, isolated native Excel process."""
import json
from datetime import datetime, timezone

import win32com.client

results = []


def check(name, observed, expected):
    assert observed == expected, (name, observed, expected)
    results.append({"check": name, "observed": observed, "expected": expected})


excel = win32com.client.DispatchEx("Excel.Application")
book = None
try:
    excel.Visible = False
    excel.DisplayAlerts = False
    excel.AutomationSecurity = 3
    book = excel.Workbooks.Add()
    sheet = book.Worksheets(1)
    source = {
        "A2": '="  Seoul  Center  "',
        "A3": '=UNICHAR(160)&"Seoul"&UNICHAR(160)&"Center"&UNICHAR(160)',
        "A4": '="AB  12"',
        "A5": '=UNICHAR(8239)&"Seoul"&UNICHAR(8239)',
    }
    for cell, formula in source.items():
        sheet.Range(cell).Formula = formula
    for row in range(2, 6):
        sheet.Range(f"B{row}").Formula = f"=TRIM(A{row})"
        sheet.Range(f"C{row}").Formula = f'=TRIM(SUBSTITUTE(A{row},UNICHAR(160)," "))'
        sheet.Range(f"D{row}").Formula = f"=LEN(A{row})"
        sheet.Range(f"E{row}").Formula = f"=LEN(B{row})"
        sheet.Range(f"F{row}").Formula = f"=LEN(C{row})"
        sheet.Range(f"G{row}").Formula = f"=EXACT(A{row},C{row})"
    excel.CalculateFull()
    for row, raw, trimmed, cleaned in [
        (2, "  Seoul  Center  ", "Seoul Center", "Seoul Center"),
        (3, "\u00a0Seoul\u00a0Center\u00a0", "\u00a0Seoul\u00a0Center\u00a0", "Seoul Center"),
        (4, "AB  12", "AB 12", "AB 12"),
        (5, "\u202fSeoul\u202f", "\u202fSeoul\u202f", "\u202fSeoul\u202f"),
    ]:
        for col, value in [(1, raw), (2, trimmed), (3, cleaned), (4, len(raw)), (5, len(trimmed)), (6, len(cleaned)), (7, raw == cleaned)]:
            check(f"trim.{row}.{col}", sheet.Cells(row, col).Value2, value)
    sheet.Range("H3").Formula = "=UNICODE(LEFT(A3,1))"
    sheet.Range("H5").Formula = "=UNICODE(LEFT(A5,1))"
    # Literal entry and explicit Text assignment are distinct from binary-double arithmetic.
    sheet.Range("J2").Formula = "=1234567890123456"
    sheet.Range("K2").NumberFormat = "@"
    sheet.Range("K2").Value2 = "1234567890123456"
    sheet.Range("L2").Formula = '=TEXT(J2,"0")'
    sheet.Range("M2").Formula = '=EXACT(L2,K2)'
    sheet.Range("N2").Formula = "=LEN(L2)"
    sheet.Range("O2").Formula = "=LEN(K2)"
    sheet.Range("P2").Formula = "=ISTEXT(K2)"
    excel.CalculateFull()
    check("trim.nbsp-code", sheet.Range("H3").Value2, 160)
    check("trim.narrow-nbsp-code", sheet.Range("H5").Value2, 8239)
    check("id.numeric-rendered", sheet.Range("L2").Value2, "1234567890123450")
    check("id.text-value", sheet.Range("K2").Value2, "1234567890123456")
    check("id.exact", sheet.Range("M2").Value2, False)
    check("id.numeric-length", sheet.Range("N2").Value2, 16)
    check("id.text-length", sheet.Range("O2").Value2, 16)
    check("id.is-text", sheet.Range("P2").Value2, True)
    print(json.dumps({
        "checkedAt": datetime.now(timezone.utc).isoformat(),
        "excelVersion": excel.Version, "excelBuild": excel.Build,
        "method": "Isolated Excel COM workbook; fixed formulas, Text assignment and CalculateFull",
        "limits": "Not UI-click, CSV import, clipboard, save/reopen or cross-version testing; all values are synthetic.",
        "passed": len(results), "results": results,
    }, ensure_ascii=True, indent=2))
finally:
    if book is not None:
        book.Close(SaveChanges=False)
    excel.Quit()
