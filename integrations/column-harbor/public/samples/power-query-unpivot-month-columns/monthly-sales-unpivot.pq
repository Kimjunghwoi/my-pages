let
    Source = Excel.CurrentWorkbook(){[Name="MonthlySales"]}[Content],
    Keys = {"product", "region"},
    Months = List.Difference(Table.ColumnNames(Source), Keys),
    EmptyTextToNull = Table.TransformColumns(
        Source,
        List.Transform(Months, (columnName) =>
            {columnName, each if _ = "" then null else _, type any})
    ),
    Typed = Table.TransformColumnTypes(
        EmptyTextToNull,
        List.Transform(Months, each {_, type number}),
        "en-US"
    ),
    Long = Table.UnpivotOtherColumns(Typed, Keys, "month", "amount"),
    Sorted = Table.Sort(Long, {{"product", Order.Ascending}, {"month", Order.Ascending}})
in
    Sorted
