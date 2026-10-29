let
    FolderPath = "C:\CSVInput",
    Required = {"item_id", "amount"},
    Wanted = {"item_id", "amount", "note"},
    Parse = (content as binary, filename as text) as table =>
        let
            Raw = Csv.Document(content, [Delimiter=",", Encoding=65001, QuoteStyle=QuoteStyle.Csv]),
            HeaderValues = if Table.IsEmpty(Raw) then error "Empty file: " & filename else Record.FieldValues(Raw{0}),
            HeaderNames = List.Transform(HeaderValues, each if _ = null then "" else Text.From(_)),
            HeaderChecked = if List.Contains(HeaderNames, "") or List.Count(List.Distinct(HeaderNames)) <> List.Count(HeaderNames)
                then error "Empty or duplicate header: " & filename else Raw,
            Promoted = Table.PromoteHeaders(HeaderChecked, [PromoteAllScalars=true]),
            Missing = List.Difference(Required, Table.ColumnNames(Promoted)),
            Checked = if List.Count(Missing) > 0 then error "Missing required header in " & filename & ": " & Text.Combine(Missing, ", ") else Promoted,
            Projected = Table.SelectColumns(Checked, Wanted, MissingField.UseNull),
            Indexed = Table.AddIndexColumn(Projected, "row_in_file", 1, 1),
            Blanks = Table.TransformColumns(Indexed, {{"amount", each if _ = "" then null else _, type nullable text}}),
            Typed = Table.TransformColumnTypes(Blanks, {{"item_id", type text}, {"amount", type number}, {"note", type text}}, "en-US"),
            Named = Table.AddColumn(Typed, "source_file", each filename, type text)
        in Named,
    FolderRows = Folder.Contents(FolderPath),
    CsvFiles = Table.SelectRows(FolderRows, each [Extension] <> null and Text.Lower([Extension]) = ".csv"),
    Parsed = List.Transform(Table.ToRecords(CsvFiles), each Parse([Content], [Name])),
    Combined = if Table.IsEmpty(CsvFiles) then error "No CSV files in the selected folder" else Table.Combine(Parsed),
    Reordered = Table.SelectColumns(Combined, {"source_file", "row_in_file", "item_id", "amount", "note"}),
    Sorted = Table.Sort(Reordered, {{"source_file", Order.Ascending}, {"row_in_file", Order.Ascending}})
in
    Sorted
