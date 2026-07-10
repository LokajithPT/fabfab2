INDIAN_STATES = {
    "AP": "Andhra Pradesh", "AR": "Arunachal Pradesh", "AS": "Assam",
    "BR": "Bihar", "CG": "Chhattisgarh", "GA": "Goa", "GJ": "Gujarat",
    "HR": "Haryana", "HP": "Himachal Pradesh", "JK": "Jammu and Kashmir",
    "JH": "Jharkhand", "KA": "Karnataka", "KL": "Kerala", "MP": "Madhya Pradesh",
    "MH": "Maharashtra", "MN": "Manipur", "ML": "Meghalaya", "MZ": "Mizoram",
    "NL": "Nagaland", "OD": "Odisha", "PB": "Punjab", "RJ": "Rajasthan",
    "SK": "Sikkim", "TN": "Tamil Nadu", "TS": "Telangana", "TR": "Tripura",
    "UP": "Uttar Pradesh", "UK": "Uttarakhand", "WB": "West Bengal",
    "AN": "Andaman and Nicobar", "CH": "Chandigarh", "DN": "Dadra and Nagar Haveli",
    "DD": "Daman and Diu", "LD": "Lakshadweep", "DL": "Delhi",
    "PY": "Puducherry", "LA": "Ladakh"
}

GST_RATES = {
    "exempt": 0, "5": 5, "12": 12, "18": 18, "28": 28
}

SERVICE_SAC = {
    "laundry": 998561, "dry_cleaning": 998562, "ironing": 998563,
    "washing": 998564, "fabric_care": 998565, "carpet_cleaning": 998566,
    "upholstery": 998567, "curtain": 998568, "pickup_delivery": 998569,
}


def validate_gstin(gstin):
    if not gstin or len(gstin) != 15:
        return False
    import re
    pattern = r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$'
    return bool(re.match(pattern, gstin))


def calculate_gst(amount, rate=18, is_interstate=False):
    gst_total = amount * rate / 100
    if is_interstate:
        return {"igst": round(gst_total, 2), "cgst": 0, "sgst": 0}
    return {
        "igst": 0,
        "cgst": round(gst_total / 2, 2),
        "sgst": round(gst_total / 2, 2),
    }


def calculate_order_gst(items, rate=18, is_interstate=False):
    subtotal = sum(item.get("price", 0) * item.get("quantity", 1) for item in items)
    gst = calculate_gst(subtotal, rate, is_interstate)
    return {
        "subtotal": round(subtotal, 2),
        "totalGst": round(gst["igst"] or gst["cgst"] * 2, 2),
        "cgst": gst["cgst"],
        "sgst": gst["sgst"],
        "igst": gst["igst"],
        "grandTotal": round(subtotal + (gst["igst"] or gst["cgst"] * 2), 2),
    }


def format_indian_currency(amount):
    s = f"{amount:.2f}"
    parts = s.split(".")
    integer_part = parts[0]
    if len(integer_part) > 3:
        last_three = integer_part[-3:]
        rest = integer_part[:-3]
        if rest:
            rest = "".join([rest[i] + "," for i in range(len(rest) - 1, -1, -3)][::-1]).strip(",")
            integer_part = rest + "," + last_three
    return f"Rs {integer_part}.{parts[1]}"
