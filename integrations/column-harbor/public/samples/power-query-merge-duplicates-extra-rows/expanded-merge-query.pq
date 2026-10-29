let
    SalesSource = Excel.CurrentWorkbook(){[Name="Sales"]}[Content],
    AddressSource = Excel.CurrentWorkbook(){[Name="Addresses"]}[Content],
    Sales = Table.TransformColumnTypes(SalesSource, {{"sale_id", type text}, {"customer_id", type text}, {"amount", type number}}),
    Addresses = Table.TransformColumnTypes(AddressSource, {{"customer_id", type text}, {"address_id", type text}, {"city", type text}}),
    Merged = Table.NestedJoin(Sales, {"customer_id"}, Addresses, {"customer_id"}, "Addresses", JoinKind.LeftOuter),
    Expanded = Table.ExpandTableColumn(Merged, "Addresses", {"address_id", "city"}, {"address_id", "city"}),
    Sorted = Table.Sort(Expanded, {{"sale_id", Order.Ascending}, {"address_id", Order.Ascending}})
in
    Sorted
