let
    FilePath = "C:\CSVInput\headers-input.csv",
    Raw = Csv.Document(File.Contents(FilePath), 3, ",", ExtraValues.Error, 65001),
    AfterPreamble = Table.Skip(Raw, 2),
    ExpectedHeaders = {"item_id", "region", "quantity"},
    Checked = if Table.RowCount(AfterPreamble) = 0 then error "Missing header row after the two-record preamble"
        else if Record.FieldValues(AfterPreamble{0}) <> ExpectedHeaders then error "Header contract changed: expected item_id,region,quantity"
        else AfterPreamble,
    Headers = Table.PromoteHeaders(Checked, [PromoteAllScalars=true]),
    Typed = Table.TransformColumnTypes(Headers, {{"item_id", type text}, {"region", type text}, {"quantity", Int64.Type}}, "en-US")
in
    Typed
