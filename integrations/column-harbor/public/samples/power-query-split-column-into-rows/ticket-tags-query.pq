let
    Source = Excel.CurrentWorkbook(){[Name="TicketTags"]}[Content],
    Typed = Table.TransformColumnTypes(Source, {{"ticket_id", type text}, {"tags", type text}}),
    WithRecords = Table.AddColumn(Typed, "tokens", each
        let
            Parts = if [tags] = null then {} else Text.Split([tags], ";"),
            Records = List.Transform(List.Positions(Parts), (i) => [tag_position = i + 1, tag = Text.Trim(Parts{i})])
        in List.Select(Records, each [tag] <> "")
    ),
    NonemptyParents = Table.SelectRows(WithRecords, each List.Count([tokens]) > 0),
    ExpandedList = Table.ExpandListColumn(NonemptyParents, "tokens"),
    ExpandedRecord = Table.ExpandRecordColumn(ExpandedList, "tokens", {"tag_position", "tag"}),
    Output = Table.SelectColumns(ExpandedRecord, {"ticket_id", "tag_position", "tag"}),
    OutputTypes = Table.TransformColumnTypes(Output, {{"tag_position", Int64.Type}, {"tag", type text}}),
    Sorted = Table.Sort(OutputTypes, {{"ticket_id", Order.Ascending}, {"tag_position", Order.Ascending}})
in
    Sorted
