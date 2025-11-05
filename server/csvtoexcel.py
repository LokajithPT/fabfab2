import pandas as pd

# input Excel file and output CSV file
input_file = "services.xlsx"   # your Excel file
output_file = "combined.csv"   # name for the CSV you'll get

# load the Excel workbook
xls = pd.ExcelFile(input_file)

# combine all sheets
combined_df = pd.DataFrame()
for sheet_name in xls.sheet_names:
    df = pd.read_excel(xls, sheet_name)
    combined_df = pd.concat([combined_df, df], ignore_index=True)

# save as one CSV file
combined_df.to_csv(output_file, index=False)

print(f"✅ All sheets from '{input_file}' combined into '{output_file}'")

