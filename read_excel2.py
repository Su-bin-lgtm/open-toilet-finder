import pandas as pd

file_path = r"C:\Users\hyunjinkim\Documents\카카오톡 받은 파일\open-toilet-finder_작업_체크리스트.xlsx"

try:
    df = pd.read_excel(file_path)
    print(df.to_string())
except Exception as e:
    print(f"Error: {e}")
