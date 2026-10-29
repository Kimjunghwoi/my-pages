let
    SalesSource = Excel.CurrentWorkbook(){[Name="Sales"]}[Content],
    AddressSource = Excel.CurrentWorkbook(){[Name="Addresses"]}[Content],
    Sales = Table.TransformColumnTypes(SalesSource, {{"sale_id", type text}, {"customer_id", type text}, {"amount", type number}}),
    Addresses = Table.TransformColumnTypes(AddressSource, {{"customer_id", type text}, {"address_id", type text}, {"city", type text}}),
    Merged = Table.NestedJoin(Sales, {"customer_id"}, Addresses, {"customer_id"}, "Addresses", JoinKind.LeftOuter),
    Counted = Table.AddColumn(Merged, "address_matches", each Table.RowCount([Addresses]), Int64.Type),
    Selected = Table.SelectColumns(Counted, {"sale_id", "customer_id", "amount", "address_matches"}),
    Sorted = Table.Sort(Selected, {{"sale_id", Order.Ascending}})
in
    Sorted
