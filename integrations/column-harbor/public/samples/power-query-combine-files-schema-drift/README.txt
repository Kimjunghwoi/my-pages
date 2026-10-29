Combine CSV Files in Power Query When Headers Change: A Safe Schema Contract

Synthetic example for https://jhsoftlabs.com/guides/power-query-combine-files-schema-drift

Three source files produce four output rows totaling 13. File b.csv has reordered required columns and no optional note, which becomes null. File c.csv has an extra export_version column that is deliberately excluded. The item codes keep their leading zeros, and source_file plus row_in_file identifies every original record.

Read the guide for interpretation and application-specific steps. Preserve your own source files.
