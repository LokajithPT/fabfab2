
import os
import pandas as pd

def clean_combined_csv():
    print("--- Starting CSV cleaning script ---")
    input_csv_path = os.path.join(os.path.dirname(__file__), 'combined.csv')
    output_csv_path = os.path.join(os.path.dirname(__file__), 'cleaned_services.csv')

    if not os.path.exists(input_csv_path):
        print(f"!!! ERROR: Input CSV file not found at {input_csv_path} !!!")
        return

    print(f"Reading input CSV from: {input_csv_path}")
    try:
        df = pd.read_csv(input_csv_path)
        print("Input CSV read successfully.")

        # Drop Unnamed columns
        df = df.loc[:, ~df.columns.str.contains('^Unnamed')]
        print("Dropped 'Unnamed' columns.")

        # Drop the specific combined header column if it exists
        if 'Service Category,Item Name,Rate (INR)' in df.columns:
            df = df.drop(columns=['Service Category,Item Name,Rate (INR)'])
            print("Dropped 'Service Category,Item Name,Rate (INR)' column.")

        # Drop the 'Type' column as requested
        if 'Type' in df.columns:
            df = df.drop(columns=['Type'])
            print("Dropped 'Type' column.")

        # Rename columns
        df = df.rename(columns={
            'Rate (₹)': 'price',
            'Item Name': 'name',
            'Category': 'category'
        })
        print("Renamed columns: 'Rate (₹)' to 'price', 'Item Name' to 'name', 'Category' to 'category'.")

        # Save the cleaned DataFrame to a new CSV file
        df.to_csv(output_csv_path, index=False)
        print(f"Cleaned data saved to: {output_csv_path}")
        print("--- CSV cleaning script finished ---")

    except Exception as e:
        print(f"!!! AN ERROR OCCURRED during CSV cleaning: {e} !!!")

if __name__ == '__main__':
    clean_combined_csv()
