$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$workbook = $excel.Workbooks.Open('C:\Users\hyunjinkim\Documents\카카오톡 받은 파일\open-toilet-finder_작업_체크리스트.xlsx')
$worksheet = $workbook.Worksheets.Item(1)
$lastRow = $worksheet.UsedRange.Rows.Count
$lastCol = $worksheet.UsedRange.Columns.Count

for ($i = 1; $i -le $lastRow; $i++) {
    $row = @()
    for ($j = 1; $j -le $lastCol; $j++) {
        $cell = $worksheet.Cells.Item($i, $j)
        $row += $cell.Value2
    }
    $row -join "`t"
}

$workbook.Close()
$excel.Quit()
