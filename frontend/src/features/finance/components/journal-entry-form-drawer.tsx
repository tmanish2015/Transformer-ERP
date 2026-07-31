import { useEffect, useMemo } from 'react'
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { journalEntrySchema, type JournalEntryFormInput, type JournalEntryFormValues } from '@/features/finance/schemas/finance-schemas'
import { useCreateJournalEntry } from '@/features/finance/hooks/use-journal-entries'
import { useChartOfAccounts } from '@/features/finance/hooks/use-chart-of-accounts'
import { useAuth } from '@/providers/auth-provider'

interface JournalEntryFormDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const emptyLine = { account_id: '', debit: undefined, credit: undefined, description: '' }

export function JournalEntryFormDrawer({ open, onOpenChange }: JournalEntryFormDrawerProps) {
  const { user } = useAuth()
  const { data: accounts } = useChartOfAccounts()
  const createEntry = useCreateJournalEntry()

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<JournalEntryFormInput, unknown, JournalEntryFormValues>({
    resolver: zodResolver(journalEntrySchema),
    defaultValues: {
      entry_date: new Date().toISOString().slice(0, 10),
      narration: '',
      lines: [emptyLine, emptyLine],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'lines' })
  const lines = useWatch({ control, name: 'lines' })

  useEffect(() => {
    if (open) {
      reset({
        entry_date: new Date().toISOString().slice(0, 10),
        narration: '',
        lines: [emptyLine, emptyLine],
      })
    }
  }, [open, reset])

  const { totalDebit, totalCredit } = useMemo(() => {
    return (lines ?? []).reduce(
      (acc, l) => ({ totalDebit: acc.totalDebit + Number(l?.debit || 0), totalCredit: acc.totalCredit + Number(l?.credit || 0) }),
      { totalDebit: 0, totalCredit: 0 },
    )
  }, [lines])

  const balanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0

  const postableAccounts = useMemo(() => (accounts ?? []).filter((a) => !a.is_group), [accounts])

  const onSubmit = (values: JournalEntryFormValues) => {
    if (!user) return
    createEntry.mutate({ values, createdBy: user.id }, { onSuccess: () => onOpenChange(false) })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="data-[side=right]:w-full data-[side=right]:sm:max-w-none">
        <SheetHeader className="mx-auto w-full max-w-4xl">
          <SheetTitle>New Journal Entry</SheetTitle>
          <SheetDescription>Record a manual double-entry transaction. Total debit must equal total credit.</SheetDescription>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1 px-4">
          <form id="journal-entry-form" onSubmit={handleSubmit(onSubmit)} className="mx-auto w-full max-w-4xl space-y-6 pb-6">
            <div className="space-y-1.5">
              <Label htmlFor="entry_date">Entry Date</Label>
              <Input id="entry_date" type="date" className="w-56" {...register('entry_date')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="narration">Narration</Label>
              <Textarea id="narration" rows={2} {...register('narration')} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Journal Lines</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => append(emptyLine)}>
                  <Plus className="size-3.5" /> Add Line
                </Button>
              </div>
              {errors.lines?.message && <p className="text-xs text-destructive">{errors.lines.message}</p>}

              <div className="rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead className="w-28 text-right">Debit</TableHead>
                      <TableHead className="w-28 text-right">Credit</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => (
                      <TableRow key={field.id}>
                        <TableCell>
                          <Controller
                            control={control}
                            name={`lines.${index}.account_id`}
                            render={({ field: accField }) => (
                              <Select value={accField.value} onValueChange={(v) => accField.onChange(v ?? '')}>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select account" />
                                </SelectTrigger>
                                <SelectContent>
                                  {postableAccounts.map((a) => (
                                    <SelectItem key={a.id} value={a.id}>
                                      {a.code} · {a.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <Controller
                            control={control}
                            name={`lines.${index}.debit`}
                            render={({ field: debitField }) => (
                              <Input
                                type="number"
                                step="0.01"
                                className="text-right"
                                value={debitField.value == null ? '' : String(debitField.value)}
                                onChange={(e) => debitField.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)}
                              />
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <Controller
                            control={control}
                            name={`lines.${index}.credit`}
                            render={({ field: creditField }) => (
                              <Input
                                type="number"
                                step="0.01"
                                className="text-right"
                                value={creditField.value == null ? '' : String(creditField.value)}
                                onChange={(e) => creditField.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)}
                              />
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <Button type="button" variant="ghost" size="icon-sm" disabled={fields.length === 2} onClick={() => remove(index)}>
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-end gap-6 rounded-lg border border-border bg-muted/40 px-4 py-2 text-sm">
                <span>
                  Total Debit: <span className="font-semibold">₹{totalDebit.toLocaleString('en-IN')}</span>
                </span>
                <span>
                  Total Credit: <span className="font-semibold">₹{totalCredit.toLocaleString('en-IN')}</span>
                </span>
                <Badge variant={balanced ? 'secondary' : 'destructive'}>{balanced ? 'Balanced' : 'Not Balanced'}</Badge>
              </div>
            </div>
          </form>
        </ScrollArea>

        <div className="border-t border-border px-4 py-3">
          <div className="mx-auto flex w-full max-w-4xl justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" form="journal-entry-form" disabled={createEntry.isPending || !balanced}>
              {createEntry.isPending && <Loader2 className="size-4 animate-spin" />}
              Post Journal Entry
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
