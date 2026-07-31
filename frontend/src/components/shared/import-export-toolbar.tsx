import { useRef, useState } from 'react'
import { Download, Loader2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { exportRowsToExcel, parseExcelFile, type ExcelColumn } from '@/lib/excel-io'

export interface ImportResult {
  successCount: number
  errors: { row: number; message: string }[]
}

interface ImportExportToolbarProps {
  entityLabel: string
  exportFilename: string
  exportColumns: ExcelColumn[]
  getExportRows: () => Record<string, unknown>[]
  importColumns: ExcelColumn[]
  onImport: (rows: Record<string, string>[]) => Promise<ImportResult>
}

export function ImportExportToolbar({ entityLabel, exportFilename, exportColumns, getExportRows, importColumns, onImport }: ImportExportToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  const handleExport = () => {
    void exportRowsToExcel(exportFilename, exportColumns, getExportRows())
  }

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setImporting(true)
    try {
      const rows = await parseExcelFile(file, importColumns)
      if (rows.length === 0) {
        toast.error('No rows found — check the file matches the exported template headers.')
        return
      }
      const importResult = await onImport(rows)
      setResult(importResult)
      if (importResult.errors.length === 0) {
        toast.success(`Imported ${importResult.successCount} ${entityLabel.toLowerCase()}.`)
      } else {
        toast.error(`Imported ${importResult.successCount}, ${importResult.errors.length} failed. See details.`)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  return (
    <>
      <input ref={fileInputRef} type="file" accept=".xlsx" className="hidden" onChange={(e) => void handleFileSelected(e)} />
      <Button variant="outline" onClick={handleExport}>
        <Download /> Export
      </Button>
      <Button variant="outline" disabled={importing} onClick={() => fileInputRef.current?.click()}>
        {importing ? <Loader2 className="animate-spin" /> : <Upload />}
        Import
      </Button>

      <Dialog open={Boolean(result)} onOpenChange={(open) => !open && setResult(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Results</DialogTitle>
            <DialogDescription>
              {result?.successCount ?? 0} {entityLabel.toLowerCase()} imported successfully
              {result && result.errors.length > 0 ? `, ${result.errors.length} row(s) failed.` : '.'}
            </DialogDescription>
          </DialogHeader>
          {result && result.errors.length > 0 && (
            <div className="max-h-64 space-y-1 overflow-y-auto text-sm">
              {result.errors.map((err) => (
                <p key={err.row} className="text-destructive">
                  Row {err.row}: {err.message}
                </p>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setResult(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
