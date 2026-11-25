import xml.etree.ElementTree as ET
import re

# Parse shared strings
strings_xml = ET.parse(r'C:\Users\hyunjinkim\Downloads\frontend-week3\temp_extracted\xl\sharedStrings.xml')
strings = []
for si in strings_xml.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si'):
    text = ""
    for t in si.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t'):
        text += t.text or ""
    for r in si.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}r'):
        for t in r.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t'):
            text += t.text or ""
    strings.append(text)

# Parse worksheet
ns = {'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
ws_xml = ET.parse(r'C:\Users\hyunjinkim\Downloads\frontend-week3\temp_extracted\xl\worksheets\sheet1.xml')

for row in ws_xml.findall('.//main:row', ns):
    row_data = []
    for cell in row.findall('main:c', ns):
        val = cell.find('main:v', ns)
        if val is not None and val.text:
            v = val.text
            if cell.get('t') == 's':
                v = strings[int(v)] if int(v) < len(strings) else v
            row_data.append(v)
        else:
            row_data.append("")
    print("\t".join(row_data))
