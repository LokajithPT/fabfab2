import os
import barcode
from barcode.writer import ImageWriter

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))


def generate_qr(order):
    qr_dir = os.path.join(BASE_DIR, "qr")
    os.makedirs(qr_dir, exist_ok=True)

    order_id = order.id
    EAN = barcode.get_barcode_class('code128')
    ean = EAN(order_id, writer=ImageWriter())
    qr_path = os.path.join(qr_dir, f"{order.id}")
    ean.save(qr_path)

    return f"{qr_path}.png"


def generate_individual_item_barcodes(order):
    qr_dir = os.path.join(BASE_DIR, "qr")
    os.makedirs(qr_dir, exist_ok=True)

    service_ids = order.service_id.split(",") if order.service_id else []
    service_names = order.service_name.split(",") if order.service_name else []

    item_barcodes = []

    for i, (service_id, service_name) in enumerate(zip(service_ids, service_names), 1):
        item_data = f"{order.id}-{i}"

        EAN = barcode.get_barcode_class('code128')
        ean = EAN(item_data, writer=ImageWriter())
        item_path = os.path.join(qr_dir, f"{order.id}_item_{i}")
        ean.save(item_path)

        item_barcodes.append({
            "item_number": i,
            "total_items": len(service_ids),
            "service_name": service_name,
            "barcode_path": f"{item_path}.png",
            "barcode_url": f"/qr/{order.id}_item_{i}.png",
            "item_data": item_data,
            "display_data": f"Order {order.id} • Item {i}/{len(service_ids)} • {service_name}"
        })

    return item_barcodes
