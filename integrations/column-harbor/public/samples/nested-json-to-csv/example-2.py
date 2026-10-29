import csv, json, sys

def unique_object(pairs):
    obj = {}
    for key, value in pairs:
        if key in obj:
            raise ValueError(f"Duplicate JSON key: {key}")
        obj[key] = value
    return obj

def bad_constant(value):
    raise ValueError(f"Not a JSON number: {value}")

def fields(obj, names):
    if not isinstance(obj, dict) or set(obj) != set(names):
        raise ValueError(f"Expected exactly these keys: {names}")

if len(sys.argv) != 3:
    raise SystemExit("Usage: python flatten_orders.py orders.json output.csv")
with open(sys.argv[1], encoding="utf-8-sig") as f:
    orders = json.load(f, object_pairs_hook=unique_object,
                       parse_constant=bad_constant)
if not isinstance(orders, list):
    raise ValueError("Top level must be an array")
output, seen = [], set()
for order in orders:
    fields(order, ["order_id", "customer", "items"])
    key = order["order_id"]
    if not isinstance(key, str) or not key.strip() or key in seen:
        raise ValueError("Order IDs must be unique nonempty strings")
    seen.add(key)
    fields(order["customer"], ["name"])
    name = order["customer"]["name"]
    items = order["items"]
    if not isinstance(name, str) or not isinstance(items, list):
        raise ValueError("Customer name must be text; items must be an array")
    if not items:
        output.append([key, name, "", ""])
    for item in items:
        fields(item, ["sku", "quantity"])
        sku, qty = item["sku"], item["quantity"]
        if not isinstance(sku, str) or not sku.strip():
            raise ValueError("SKU must be a nonempty string")
        if type(qty) is not int or qty < 0:
            raise ValueError("Quantity must be a nonnegative integer")
        output.append([key, name, sku, qty])
with open(sys.argv[2], "x", encoding="utf-8", newline="") as f:
    writer = csv.writer(f, lineterminator="\r\n")
    writer.writerow(["order_id", "customer_name", "sku", "quantity"])
    writer.writerows(output)
print(f"Wrote {len(output)} rows from {len(orders)} orders")

