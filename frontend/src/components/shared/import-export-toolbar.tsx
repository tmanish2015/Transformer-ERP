import { useState } from 'react'
import { Download, Loader2, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DeleteConfirmDialog } from '@/components/shared/delete-confirm-dialog'
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
  importDescription: string
  onImport: (rows: Record<string, string>[]) => Promise<ImportResult>
  /** Optional — omit to hide the "Clear existing" option entirely. Returns the count deleted. */
  onClearExisting?: () => Promise<number>
}

export function ImportExportToolbar({
  entityLabel,
  exportFilename,
  exportColumns,
  getExportRows,
  importColumns,
  importDescription,
  onImport,
  onClearExisting,
}: ImportExportToolbarProps) {
  const [importOpen, setImportOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  const handleExport = () => {
    void exportRowsToExcel(exportFilename, exportColumns, getExportRows())
  }

  const handleDownloadTemplate = () => {
    void exportRowsToExcel(`${entityLabel.toLowerCase()}-template.xlsx`, importColumns, [])
  }

  const handleClearExisting = async () => {
    if (!onClearExisting) return
    setClearing(true)
    try {
      const count = await onClearExisting()
      toast.success(`Cleared ${count} existing ${entityLabel.toLowerCase()}.`)
      setClearConfirmOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to clear existing data')
    } finally {
      setClearing(false)
    }
  }

  const handleImport = async () => {
    if (!file) return
    setImporting(true)
    try {
      const rows = await parseExcelFile(file, importColumns)
      if (rows.length === 0) {
        toast.error('No rows found — check the file matches the template headers.')
        return
      }
      const importResult = await onImport(rows)
      setImportOpen(false)
      setFile(null)
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
      <Button variant="outline" onClick={handleExport}>
        <Download /> Export
      </Button>
      <Button variant="outline" onClick={() => setImportOpen(true)}>
        <Upload /> Import
      </Button>

      <Dialog
        open={importOpen}
        onOpenChange={(open) => {
          setImportOpen(open)
          if (!open) setFile(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import {entityLabel}</DialogTitle>
            <DialogDescription>{importDescription}</DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleDownloadTemplate}>
              <Download /> Download template
            </Button>
            {onClearExisting && (
              <Button type="button" variant="destructive" size="sm" onClick={() => setClearConfirmOpen(true)}>
                <Trash2 /> Clear existing
              </Button>
            )}
          </div>

          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground hover:bg-muted/50">
            <input type="file" accept=".xlsx" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <Upload className="size-5" />
            {file ? <span className="text-foreground">{file.name}</span> : 'Click to upload an .xlsx file'}
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setImportOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={!file || importing} onClick={() => void handleImport()}>
              {importing && <Loader2 className="animate-spin" />}
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {onClearExisting && (
        <DeleteConfirmDialog
          open={clearConfirmOpen}
          onOpenChange={setClearConfirmOpen}
          title={`Clear all ${entityLabel.toLowerCase()}?`}
          description={`This permanently deletes every existing ${entityLabel.toLowerCase()} record. This cannot be undone.`}
          isPending={clearing}
          onConfirm={() => void handleClearExisting()}
        />
      )}

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
