import ExcelJS from 'exceljs'

export interface ExcelColumn {
  header: string
  key: string
}

export async function exportRowsToExcel(filename: string, columns: ExcelColumn[], rows: Record<string, unknown>[]) {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Sheet1')
  sheet.columns = columns.map((c) => ({ header: c.header, key: c.key, width: 20 }))
  rows.forEach((row) => sheet.addRow(row))

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

// Matches uploaded header cells to column keys case-insensitively, so a re-exported
// template (or one with reordered/whitespace-padded columns) still parses correctly.
export async function parseExcelFile(file: File, columns: ExcelColumn[]): Promise<Record<string, string>[]> {
  const workbook = new ExcelJS.Workbook()
  const buffer = await file.arrayBuffer()
  await workbook.xlsx.load(buffer)
  const sheet = workbook.worksheets[0]
  if (!sheet) return []

  const headerMap = new Map<number, string>()
  sheet.getRow(1).eachCell((cell, colNumber) => {
    const headerText = String(cell.value ?? '').trim().toLowerCase()
    const match = columns.find((c) => c.header.toLowerCase() === headerText)
    if (match) headerMap.set(colNumber, match.key)
  })

  const rows: Record<string, string>[] = []
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return
    const record: Record<string, string> = {}
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const key = headerMap.get(colNumber)
      if (key) record[key] = cell.value == null ? '' : String(cell.value).trim()
    })
    if (Object.values(record).some((v) => v !== '')) rows.push(record)
  })
  return rows
}
