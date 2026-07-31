import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useBomLines } from '@/features/manufacturing/hooks/use-boms'
import type { BomWithRelations } from '@/features/manufacturing/types/manufacturing-types'

interface BomDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bom: BomWithRelations | null
}

export function BomDetailSheet({ open, onOpenChange, bom }: BomDetailSheetProps) {
  const { data: lines, isLoading } = useBomLines(bom?.id)

  if (!bom) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {bom.product.name} — v{bom.version}
          </DialogTitle>
          <DialogDescription>{bom.name || 'Bill of materials'}</DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Raw Material</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>Unit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center">
                    <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : (
                lines?.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell>
                      <p className="font-medium text-foreground">{line.raw_material_product.name}</p>
                      <p className="text-xs text-muted-foreground">{line.raw_material_product.sku}</p>
                    </TableCell>
                    <TableCell className="text-right">{line.qty}</TableCell>
                    <TableCell>{line.unit.short_code}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
}
