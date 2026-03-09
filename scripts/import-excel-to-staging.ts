import fs from 'node:fs';
import path from 'node:path';

import XLSX from 'xlsx';

import {
  createColumnMap,
  detectHeaderRow,
  hasMeaningfulContent,
  normalizeRow,
  type StagingRow,
} from '../shared/excelImport';
import { buildImportPlan } from '../shared/stagingImport';

interface FileSummary {
  file: string;
  sheet: string;
  headerRowNumber: number;
  rowCount: number;
  keptRows: number;
  missingSchoolCount: number;
  missingUrlCount: number;
}

const projectRoot = path.resolve(import.meta.dirname, '..');
const excelDir = path.join(projectRoot, 'excel');
const reportsDir = path.join(projectRoot, 'reports', 'excel-import');
const stagingPath = path.join(reportsDir, 'staging-rows.json');
const rawRowsPath = path.join(reportsDir, 'raw-excel-rows.json');
const normalizedNoticesPath = path.join(reportsDir, 'normalized-notices.json');
const departmentEntitiesPath = path.join(reportsDir, 'department-entities.json');
const departmentCardsPath = path.join(reportsDir, 'department-cards.json');
const summaryPath = path.join(reportsDir, 'staging-summary.json');

function main(): void {
  fs.mkdirSync(reportsDir, { recursive: true });

  const allRows: StagingRow[] = [];
  const fileSummaries: FileSummary[] = [];

  const files = fs.readdirSync(excelDir).filter((name) => name.endsWith('.xlsx'));

  for (const file of files) {
    const workbook = XLSX.readFile(path.join(excelDir, file), {
      cellDates: false,
      raw: false,
    });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<string[]>(sheet, {
      header: 1,
      raw: false,
      defval: '',
    });

    const headerIndex = detectHeaderRow(rows.slice(0, 8));
    const columnMap = createColumnMap(rows[headerIndex] ?? []);

    let keptRows = 0;
    let missingSchoolCount = 0;
    let missingUrlCount = 0;

    rows.slice(headerIndex + 1).forEach((row, offset) => {
      const normalized = normalizeRow(row, columnMap, {
        sourceFile: file,
        sheetName,
        rowNumber: headerIndex + 2 + offset,
      });

      if (!hasMeaningfulContent(normalized)) {
        return;
      }

      if (!normalized.school_name) missingSchoolCount += 1;
      if (!normalized.notice_url) missingUrlCount += 1;

      allRows.push(normalized);
      keptRows += 1;
    });

    fileSummaries.push({
      file,
      sheet: sheetName,
      headerRowNumber: headerIndex + 1,
      rowCount: Math.max(0, rows.length - headerIndex - 1),
      keptRows,
      missingSchoolCount,
      missingUrlCount,
    });
  }

  const plan = buildImportPlan(allRows);

  fs.writeFileSync(stagingPath, JSON.stringify(allRows, null, 2));
  fs.writeFileSync(rawRowsPath, JSON.stringify(plan.rawExcelRows, null, 2));
  fs.writeFileSync(normalizedNoticesPath, JSON.stringify(plan.normalizedNotices, null, 2));
  fs.writeFileSync(departmentEntitiesPath, JSON.stringify(plan.departmentEntities, null, 2));
  fs.writeFileSync(departmentCardsPath, JSON.stringify(plan.departmentCards, null, 2));
  fs.writeFileSync(
    summaryPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        totalFiles: fileSummaries.length,
        totalRows: allRows.length,
        files: fileSummaries,
        planStats: plan.stats,
      },
      null,
      2,
    ),
  );

  console.log(`Wrote ${allRows.length} staging rows to ${stagingPath}`);
  console.log(`Wrote ${plan.rawExcelRows.length} raw rows to ${rawRowsPath}`);
  console.log(`Wrote ${plan.normalizedNotices.length} normalized notices to ${normalizedNoticesPath}`);
  console.log(`Wrote ${plan.departmentEntities.length} department entities to ${departmentEntitiesPath}`);
  console.log(`Wrote ${plan.departmentCards.length} department cards to ${departmentCardsPath}`);
  console.log(`Wrote summary to ${summaryPath}`);
}

main();
