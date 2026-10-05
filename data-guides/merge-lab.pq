// Synthetic learning data only. Change Mode to audit, expanded, or corrected.
let
    Mode = "audit",
    Sales = #table(
        type table [sale_id=text, customer_id=text, address_id=nullable text, amount=number],
        {{"S1","C10","A1",10}, {"S2","C10","A2",20},
         {"S3","C20","A3",5}, {"S4","C30",null,7}}
    ),
    Addresses = #table(
        type table [address_id=text, customer_id=text, city=text],
        {{"A1","C10","Seoul"}, {"A2","C10","Busan"}, {"A3","C20","Incheon"}}
    ),
    ByCustomer = Table.NestedJoin(Sales, {"customer_id"}, Addresses, {"customer_id"}, "matches", JoinKind.LeftOuter),
    Audit = Table.AddColumn(ByCustomer, "match_count", each Table.RowCount([matches]), Int64.Type),
    Expanded = Table.ExpandTableColumn(Audit, "matches", {"city"}, {"city"}),
    KeyCounts = Table.Group(Addresses, {"customer_id", "address_id"}, {{"count", each Table.RowCount(_), Int64.Type}}),
    BadKeys = Table.SelectRows(KeyCounts, each [count] <> 1 or [customer_id] = "" or [address_id] = ""),
    CheckedAddresses = if Table.RowCount(BadKeys) > 0 then error "Address lookup keys must be nonempty and unique" else Addresses,
    ByAddress = Table.NestedJoin(Sales, {"customer_id", "address_id"}, CheckedAddresses, {"customer_id", "address_id"}, "matches", JoinKind.LeftOuter),
    Corrected = Table.ExpandTableColumn(ByAddress, "matches", {"city"}, {"city"}),
    Selected = if Mode = "audit" then Table.RemoveColumns(Audit, {"matches"})
        else if Mode = "expanded" then Expanded
        else if Mode = "corrected" then Corrected
        else error "Mode must be audit, expanded, or corrected",
    Result = Table.Sort(Selected, {{"sale_id", Order.Ascending}})
in
    Result
