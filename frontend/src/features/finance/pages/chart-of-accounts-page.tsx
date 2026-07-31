import { useMemo, useState } from 'react'
import { BookOpen, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { DeleteConfirmDialog } from '@/components/shared/delete-confirm-dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useChartOfAccounts, useDeleteAccount } from '@/features/finance/hooks/use-chart-of-accounts'
import { AccountFormDialog } from '@/features/finance/components/account-form-dialog'
import { ACCOUNT_TYPE_LABELS, buildAccountTree, type AccountType, type ChartOfAccount, type ChartOfAccountWithChildren } from '@/features/finance/types/finance-types'
import { useAuth } from '@/providers/auth-provider'

function AccountNode({
  node,
  canManage,
  onAddChild,
  onEdit,
  onDelete,
  depth = 0,
}: {
  node: ChartOfAccountWithChildren
  canManage: boolean
  onAddChild: (parentId: string) => void
  onEdit: (account: ChartOfAccount) => void
  onDelete: (account: ChartOfAccount) => void
  depth?: number
}) {
  return (
    <div style={{ marginLeft: depth * 20 }}>
      <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card p-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <Badge variant="secondary" className="shrink-0 text-[10px]">
            {node.code}
          </Badge>
          <span className="truncate text-sm font-medium text-foreground">{node.name}</span>
          <span className="shrink-0 text-xs text-muted-foreground">{ACCOUNT_TYPE_LABELS[node.account_type as AccountType]}</span>
          {!node.is_group && node.opening_balance > 0 && (
            <span className="shrink-0 text-xs text-muted-foreground">
              Opening: ₹{node.opening_balance.toLocaleString('en-IN')} {node.opening_balance_type === 'debit' ? 'Dr' : 'Cr'}
            </span>
          )}
          {node.is_system && (
            <Badge variant="outline" className="shrink-0 text-[10px]">
              System
            </Badge>
          )}
        </div>
        {canManage && (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {node.is_group && (
                <DropdownMenuItem onClick={() => onAddChild(node.id)}>
                  <Plus /> Add Child Account
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onEdit(node)}>
                <Pencil /> Edit
              </DropdownMenuItem>
              {!node.is_system && (
                <DropdownMenuItem variant="destructive" onClick={() => onDelete(node)}>
                  <Trash2 /> Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      {node.children.length > 0 && (
        <div className="mt-2 space-y-2">
          {node.children.map((child) => (
            <AccountNode key={child.id} node={child} canManage={canManage} onAddChild={onAddChild} onEdit={onEdit} onDelete={onDelete} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export function ChartOfAccountsPage() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('finance.manage')
  const { data: accounts, isLoading } = useChartOfAccounts()
  const deleteAccount = useDeleteAccount()

  const [formState, setFormState] = useState<{ parentId?: string; account?: ChartOfAccount } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ChartOfAccount | null>(null)

  const tree = useMemo(() => buildAccountTree(accounts ?? []), [accounts])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chart of Accounts"
        description="Hierarchical ledger accounts with opening balances for the current financial year."
        actions={
          canManage && (
            <Button onClick={() => setFormState({})}>
              <Plus /> New Account
            </Button>
          )
        }
      />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      ) : tree.length === 0 ? (
        <EmptyState icon={BookOpen} title="No accounts yet" description="Create your first ledger account to get started." />
      ) : (
        <div className="space-y-2">
          {tree.map((account) => (
            <AccountNode key={account.id} node={account} canManage={canManage} onAddChild={(parentId) => setFormState({ parentId })} onEdit={(account) => setFormState({ account })} onDelete={setDeleteTarget} />
          ))}
        </div>
      )}

      {formState && <AccountFormDialog open={Boolean(formState)} onOpenChange={(open) => !open && setFormState(null)} account={formState.account} defaultParentId={formState.parentId} />}

      <DeleteConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete account?"
        description={`This will permanently delete "${deleteTarget?.name ?? ''}". Accounts with posted transactions cannot be deleted.`}
        isPending={deleteAccount.isPending}
        onConfirm={() => deleteTarget && deleteAccount.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) })}
      />
    </div>
  )
}
