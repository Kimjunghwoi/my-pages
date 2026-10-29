let
    Source = Excel.CurrentWorkbook(){[Name="BatchRows"]}[Content],
    Typed = Table.TransformColumnTypes(Source, {{"row_no", Int64.Type}, {"batch", type text}, {"label", type text}, {"value", Int64.Type}}),
    Normalized = Table.TransformColumns(Typed, {{"label", each if _ = null or Text.Trim(_) = "" then null else _, type nullable text}}),
    Groups = Table.Group(Normalized, {"batch"}, {{"rows", each Table.FillDown(Table.Sort(_, {{"row_no", Order.Ascending}}), {"label"})}}),
    Combined = Table.Combine(Groups[rows]),
    Output = Table.Sort(Combined, {{"row_no", Order.Ascending}})
in
    Output
