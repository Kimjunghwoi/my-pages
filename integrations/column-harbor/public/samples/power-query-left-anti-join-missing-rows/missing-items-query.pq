let
    Left = Excel.CurrentWorkbook(){[Name="RequestedItems"]}[Content],
    Right = Excel.CurrentWorkbook(){[Name="AvailableItems"]}[Content],
    LeftTyped = Table.TransformColumnTypes(Left, {{"line_id", type text}, {"item_id", type text}, {"quantity", Int64.Type}}),
    RightTyped = Table.TransformColumnTypes(Right, {{"item_id", type text}}),
    ValidLeft = Table.SelectRows(LeftTyped, each [item_id] <> null and Text.Trim([item_id]) <> ""),
    ValidRight = Table.SelectRows(RightTyped, each [item_id] <> null and Text.Trim([item_id]) <> ""),
    Missing = Table.NestedJoin(ValidLeft, {"item_id"}, ValidRight, {"item_id"}, "right_matches", JoinKind.LeftAnti),
    Output = Table.RemoveColumns(Missing, {"right_matches"}),
    Sorted = Table.Sort(Output, {{"line_id", Order.Ascending}})
in
    Sorted
