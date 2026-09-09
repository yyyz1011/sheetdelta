# Independent-producer fixtures

These small synthetic fixtures belong to this MIT-licensed project. They were generated with **openpyxl 3.1.5**, independently of SheetDelta's SheetJS writer. Recreate them with `python -m pip install openpyxl==3.1.5` and `python tests/fixtures/generate.py`. Normal npm tests use committed bytes and do not require Python.

- `openpyxl-compat.xlsx`: leading-zero and long text identifiers, formatted dates, booleans, a blank row, hidden worksheet, merged cells, an offset header, formula cells, and an Excel error cell. openpyxl does not evaluate formulas: the script inserts one known cached value (`SUM(2,3) = 5`) into the generated XML; another formula deliberately has no cache.
- `openpyxl-1904.xlsx`: a workbook using the 1904 date epoch.
- `gb18030.csv`: a Chinese CSV encoded as GB18030.

These are not captures from Microsoft Excel, WPS, or production users. Passing them establishes cross-library fixture compatibility, not certification of every spreadsheet application or workbook feature.
