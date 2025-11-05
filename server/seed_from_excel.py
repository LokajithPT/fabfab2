
import os
import pandas as pd
from app import app, db, Service

def seed_services_from_csv():
    """
    Reads service data from a cleaned CSV file and populates the database.
    """
    print("--- Starting service seeding script from cleaned CSV ---")
    
    csv_file = os.path.join(os.path.dirname(__file__), 'cleaned_services.csv')
    print(f"Looking for cleaned CSV file at: {csv_file}")

    if not os.path.exists(csv_file):
        print(f"!!! ERROR: Cleaned CSV file not found at {csv_file} !!!")
        return

    print("Cleaned CSV file found.")

    try:
        print("Reading the cleaned services CSV file...")
        df = pd.read_csv(csv_file)
        print("Successfully read CSV file into a DataFrame.")
        
        with app.app_context():
            print("Application context pushed.")
            print("Connecting to the database...")
            
            print("Clearing existing services from the database...")
            num_deleted = db.session.query(Service).delete()
            print(f"Deleted {num_deleted} existing services.")
            
            print("Iterating through CSV rows and adding new services...")
            for index, row in df.iterrows():
                # Assuming the cleaned CSV has 'name', 'price', 'category' columns
                if pd.notna(row['name']) and pd.notna(row['price']):
                    service_name = row['name']
                    service_price_str = str(row['price'])
                    # Extract the first sequence of digits and an optional decimal point
                    import re
                    match = re.match(r'^\D*(\d+(\.\d+)?)', service_price_str)
                    if match:
                        service_price = float(match.group(1))
                    else:
                        print(f"  - WARNING: Could not parse price for '{service_name}'. Setting to 0.")
                        service_price = 0.0
                    
                    service_duration = row.get('duration', '24h') # Use 'duration' column if exists, else default
                    service_category = row.get('category', None) # Get 'category' column
                    
                    print(f"  - Preparing to add service: Name='{service_name}', Price={service_price}, Duration='{service_duration}', Category='{service_category}'")
                    
                    service = Service(
                        name=service_name,
                        price=service_price,
                        duration=service_duration,
                        category=service_category # Assign category
                    )
                    db.session.add(service)
                    print(f"  - Added '{service_name}' to the session.")
            
            print("Committing all new services to the database...")
            db.session.commit()
            print(f"Successfully seeded {len(df)} services from CSV.")

    except Exception as e:
        print(f"!!! AN ERROR OCCURRED: {e} !!!")
        with app.app_context():
            print("Rolling back any changes to the database.")
            db.session.rollback()

    finally:
        print("--- Service seeding script finished ---")

if __name__ == '__main__':
    seed_services_from_csv()
