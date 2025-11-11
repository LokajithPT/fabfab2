#!/usr/bin/env python3

import requests
import json

def demo_item_barcode_system():
    """Demonstrate the complete item barcode system"""
    
    print("🎯 FABFAB ITEM BARCODE SYSTEM DEMO")
    print("=" * 50)
    
    # Create a test order with multiple services
    test_order = {
        "customerName": "Demo Customer",
        "customerPhone": "1234567890", 
        "customerEmail": "demo@fabfab.com",
        "serviceIds": ["82af8acb", "8d7930d0", "8c7c92f5", "a6c51010"],
        "total": 185
    }
    
    print("\n1️⃣ Creating Order with 4 Services...")
    print(f"   Customer: {test_order['customerName']}")
    print(f"   Services: {len(test_order['serviceIds'])} items")
    
    try:
        response = requests.post(
            "http://localhost:5001/api/orders",
            headers={"Content-Type": "application/json"},
            json=test_order
        )
        
        if response.status_code != 201:
            print(f"❌ Failed: {response.status_code}")
            return
            
        data = response.json()
        order_id = data['order']['id']
        barcodes = data['barcodes']
        
        print(f"✅ Order {order_id} created successfully!")
        
        print("\n2️⃣ Generated Barcodes:")
        print(f"   📋 Main Order QR: {barcodes['main_qr']}")
        print(f"   🏷️  Individual Items: {len(barcodes['items'])}")
        
        print("\n3️⃣ Individual Item Details:")
        for i, item in enumerate(barcodes['items']):
            print(f"\n   📦 Item {item['item_number']}/{item['total_items']}")
            print(f"      Service: {item['service_name']}")
            print(f"      Barcode: {item['barcode_url']}")
            print(f"      📊 Encoded Data: {item['item_data']}")
            
            # Verify barcode accessibility
            img_check = requests.head(f"http://localhost:5001{item['barcode_url']}")
            status = "✅" if img_check.status_code == 200 else "❌"
            print(f"      {status} Barcode Accessible")
        
        print("\n4️⃣ Frontend Integration:")
        print(f"   🎭 UI would show {len(barcodes['items'])} tabs + 1 summary tab")
        print(f"   🖱️  Each tab shows item barcode and details")
        print(f"   🖨️  Print modal shows all items + summary")
        
        print("\n5️⃣ Barcode Content Format:")
        print("   Each barcode contains:")
        print("   - ORDER: [Order ID]")
        print("   - ITEM: [Current Item]/[Total Items]")
        print("   - CUSTOMER: [Customer Name]")
        print("   - SERVICE: [Service Name]")
        
        print("\n6️⃣ Benefits:")
        print("   ✅ Individual item tracking")
        print("   ✅ Better inventory management")
        print("   ✅ Reduced error rates")
        print("   ✅ Enhanced customer experience")
        
        print(f"\n🎉 Demo Complete! Order {order_id} with {len(barcodes['items'])} items ready for tracking.")
        
    except Exception as e:
        print(f"❌ Demo failed: {e}")

if __name__ == "__main__":
    demo_item_barcode_system()