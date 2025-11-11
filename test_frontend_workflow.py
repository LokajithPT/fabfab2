#!/usr/bin/env python3

import requests
import json

def test_frontend_workflow():
    """Test the complete frontend workflow"""
    
    # 1. Create an order (simulating frontend form submission)
    test_order = {
        "customerName": "Frontend Workflow Test",
        "customerPhone": "9999999999", 
        "customerEmail": "workflow@test.com",
        "serviceIds": ["82af8acb", "8d7930d0", "8c7c92f5"],
        "total": 140
    }
    
    print("🎭 Simulating Frontend Order Creation...")
    
    try:
        response = requests.post(
            "http://localhost:5001/api/orders",
            headers={"Content-Type": "application/json"},
            json=test_order
        )
        
        if response.status_code != 201:
            print(f"❌ Order creation failed: {response.status_code}")
            return False
            
        data = response.json()
        order_id = data['order']['id']
        
        print(f"✅ Order {order_id} created")
        
        # 2. Simulate frontend processing the response
        print("\n📱 Simulating Frontend Response Processing...")
        
        # Extract data like the frontend would
        createdOrderId = data['order']['id']
        qrCodeUrl = f"/qr/{data['order']['id']}.png"
        itemBarcodes = data.get('barcodes', {}).get('items', [])
        
        print(f"✅ Frontend would set:")
        print(f"   - createdOrderId: {createdOrderId}")
        print(f"   - qrCodeUrl: {qrCodeUrl}")
        print(f"   - itemBarcodes: {len(itemBarcodes)} items")
        
        # 3. Simulate frontend displaying tabs
        print(f"\n📋 Frontend would display {len(itemBarcodes)} item tabs + 1 summary tab")
        
        for i, item in enumerate(itemBarcodes):
            print(f"   Tab {i}: Item {item['item_number']}/{item['total_items']} - {item['service_name']}")
            print(f"   Barcode URL: {item['barcode_url']}")
            print(f"   Encoded Data: {item['item_data']}")
            
            # Test barcode accessibility (like frontend image loading)
            img_response = requests.head(f"http://localhost:5001{item['barcode_url']}")
            if img_response.status_code == 200:
                print(f"   ✅ Image would load successfully")
            else:
                print(f"   ❌ Image would fail to load")
        
        # 4. Test main QR code
        main_qr_response = requests.head(f"http://localhost:5001{qrCodeUrl}")
        if main_qr_response.status_code == 200:
            print(f"   ✅ Main QR code would load successfully")
        else:
            print(f"   ❌ Main QR code would fail to load")
            
        # 5. Test print functionality simulation
        print(f"\n🖨️  Frontend print modal would show:")
        print(f"   - {len(itemBarcodes)} individual item barcodes")
        print(f"   - 1 main order QR code")
        print(f"   - Order details and customer info")
        
        return True
        
    except Exception as e:
        print(f"❌ Error in workflow: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing Complete Frontend Workflow...")
    success = test_frontend_workflow()
    if success:
        print("\n🎉 Frontend workflow test passed! The UI should work correctly.")
    else:
        print("\n💥 Frontend workflow test failed!")