let
    FilePath = "C:\CSVInput\locale-input.csv",
    Raw = Csv.Document(File.Contents(FilePath), [Delimiter=",", Encoding=65001, QuoteStyle=QuoteStyle.Csv]),
    Headers = Table.PromoteHeaders(Raw, [PromoteAllScalars=true]),
    EmptyToNull = Table.TransformColumns(Headers, {
        {"date_text", each if _ = "" then null else _, type nullable text},
        {"amount_text", each if _ = "" then null else _, type nullable text}
    }),
    ParseDate = (value as nullable text) as nullable date =>
        if value = null then null else
        let Parsed = Date.FromText(value, "en-GB")
        in if Date.ToText(Parsed, "dd/MM/yyyy", "en-GB") = value then Parsed
           else error "Expected an exact dd/MM/yyyy date: " & value,
    Dates = Table.AddColumn(EmptyToNull, "date", each ParseDate([date_text]), type nullable date),
    Amounts = Table.AddColumn(Dates, "amount", each Number.FromText([amount_text], "de-DE"), type nullable number),
    Sorted = Table.Sort(Amounts, {{"row_id", Order.Ascending}})
in
    Sorted
