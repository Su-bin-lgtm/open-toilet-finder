import openpyxl

file_path = r"C:\Users\hyunjinkim\Documents\카카오톡 받은 파일\open-toilet-finder_작업_체크리스트.xlsx"

try:
    wb = openpyxl.load_workbook(file_path)
    ws = wb.active
    
    for row in ws.iter_rows(values_only=True):
        print(row)
except Exception as e:
    print(f"Error: {e}")
