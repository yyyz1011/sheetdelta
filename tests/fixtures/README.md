# Independent-producer fixtures

These small synthetic fixtures belong to this MIT-licensed project. They were generated with **openpyxl 3.1.5**, independently of SheetDelta's SheetJS writer. Recreate them with `python -m pip install openpyxl==3.1.5` and `python tests/fixtures/generate.py`. Normal npm tests use committed bytes and do not require Python.

- `openpyxl-compat.xlsx`: leading-zero and long text identifiers, formatted dates, booleans, a blank row, hidden worksheet, merged cells, an offset header, formula cells, and an Excel error cell. openpyxl does not evaluate formulas: the script inserts one known cached value (`SUM(2,3) = 5`) into the generated XML; another formula deliberately has no cache.
- `openpyxl-1904.xlsx`: a workbook using the 1904 date epoch.
- `gb18030.csv`: a Chinese CSV encoded as GB18030.

These are not captures from Microsoft Excel, WPS, or production users. Passing them establishes cross-library fixture compatibility, not certification of every spreadsheet application or workbook feature.

## Business workflow and application roundtrips

`business.py` creates `business-template.xlsx`: SKU identifiers, invoice formulas, summary formulas, formatting, a bar chart, hyperlink, comment, validation, frozen panes and a hidden sheet. `business-libreoffice.xlsx` and `.xls` were opened/recalculated/exported locally using LibreOfficeDev 26.8.0.0.alpha0, commit `2c87e51eeaa2b413ff4ae097b2705eea1995d8e5`, on 2026-09-09. The XLSX caches are an independent oracle for 11 formula cells. These files are project-owned synthetic business data, not customer data.

Reproduce with `python tests/fixtures/business.py`, then run `soffice --headless --convert-to xlsx --outdir /tmp/roundtrip tests/fixtures/business-template.xlsx` (use a separate output folder). Repeat with `--convert-to xls`. Keep the original and application-produced files distinct. Normal CI uses committed files and needs neither Python nor LibreOffice.

The `apache-poi/` subdirectory adds unchanged, externally maintained Excel-authored regression fixtures with their own Apache 2.0 attribution.

`formulas.py` generates `formula-oracle-input.xlsx`, subsequently recalculated as `formula-oracle-libreoffice.xlsx` using the same LibreOffice build. Of 53 formula cells, 44 agree with the package; 9 mixed-type coercion differences are explicit regression expectations, not claimed matches. The formula documentation explains these rules. Newer function storage prefixes are included in the source fixture.
