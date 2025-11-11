#!/usr/bin/env python3

import requests
import json

# Test data
test_order = {
    "customerName": "Frontend Test Customer",
    "customerPhone": "9876543210", 
    "customerEmail": "frontend@test.com",
    "serviceIds": ["82af8acb", "8d7930d0"],
    "total": 95
}

def test_order_creation():
    """Test the complete order creation workflow"""
    try:
        # Create order
        response = requests.post(
            "http://localhost:5001/api/orders",
            headers={"Content-Type": "application/json"},
            json=test_order
        )
        
        if response.status_code == 201:
            data = response.json()
            print("✅ Order created successfully!")
            print(f"Order ID: {data['order']['id']}")
            print(f"Customer: {data['customer']['name']}")
            
            # Check barcodes
            if 'barcodes' in data:
                barcodes = data['barcodes']
                print(f"✅ Main QR Code: {barcodes['main_qr']}")
                print(f"✅ Individual Items: {len(barcodes['items'])}")
                
                for i, item in enumerate(barcodes['items']):
                    print(f"  Item {item['item_number']}: {item['service_name']}")
                    print(f"  Barcode: {item['barcode_url']}")
                    print(f"  Data: {item['item_data']}")
                    
                    # Test if barcode is accessible
                    barcode_response = requests.head(f"http://localhost:5001{item['barcode_url']}")
                    if barcode_response.status_code == 200:
                        print(f"  ✅ Barcode {item['item_number']} accessible")
                    else:
                        print(f"  ❌ Barcode {item['item_number']} not accessible")
                
                return True
            else:
                print("❌ No barcodes in response")
                return False
        else:
            print(f"❌ Order creation failed: {response.status_code}")
            print(response.text)
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing Item Barcode System...")
    success = test_order_creation()
    if success:
        print("\n🎉 All tests passed! Item barcode system is working correctly.")
    else:
        print("\n💥 Tests failed! Check the system.")