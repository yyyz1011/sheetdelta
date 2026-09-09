# Apache POI regression fixtures

These three files are copied unchanged from Apache POI, commit `f5f1ddbb03973cb3bce91af9ae20d6b73c086087`, under the Apache License 2.0. The upstream LICENSE and NOTICE are included alongside them. They are test-only assets and are not included in the npm tarball.

- [WithChart.xlsx](https://github.com/apache/poi/blob/f5f1ddbb03973cb3bce91af9ae20d6b73c086087/test-data/spreadsheet/WithChart.xlsx): chart parts and relationships.
- [SimpleMacro.xlsm](https://github.com/apache/poi/blob/f5f1ddbb03973cb3bce91af9ae20d6b73c086087/test-data/spreadsheet/SimpleMacro.xlsm): VBA payload preservation. Tests only inspect ZIP/XML bytes; no macro is executed.
- [SampleSS.strict.xlsx](https://github.com/apache/poi/blob/f5f1ddbb03973cb3bce91af9ae20d6b73c086087/test-data/spreadsheet/SampleSS.strict.xlsx): Strict OOXML namespaces.

All three identify Microsoft Excel in their embedded application metadata. This establishes regression coverage for these Excel-authored files; it does not mean an installed Microsoft Excel or WPS application was run in CI.
