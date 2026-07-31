import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { ColumnDef } from '@tanstack/react-table'
import { Loader2, MoreHorizontal, Pencil, Plus, Trash2, Users } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { DeleteConfirmDialog } from '@/components/shared/delete-confirm-dialog'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { employeeSchema, type EmployeeFormValues } from '@/features/hr/schemas/hr-schemas'
import { useCreateEmployee, useDeleteEmployee, useEmployees, useUpdateEmployee } from '@/features/hr/hooks/use-employees'
import type { Employee } from '@/features/hr/types/hr-types'

function EmployeeFormDialog({ open, onOpenChange, employee }: { open: boolean; onOpenChange: (open: boolean) => void; employee: Employee | null }) {
  const createEmployee = useCreateEmployee()
  const updateEmployee = useUpdateEmployee()
  const isPending = createEmployee.isPending || updateEmployee.isPending

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    values: {
      name: employee?.name ?? '',
      role_title: employee?.role_title ?? '',
      skill_tags: employee?.skill_tags?.join(', ') ?? '',
    },
  })

  const onSubmit = (values: EmployeeFormValues) => {
    const onSuccess = () => {
      onOpenChange(false)
      reset()
    }
    if (employee) {
      updateEmployee.mutate({ id: employee.id, values }, { onSuccess })
    } else {
      createEmployee.mutate(values, { onSuccess })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{employee ? 'Edit Employee' : 'New Employee'}</DialogTitle>
          <DialogDescription>Field technicians don't need an app login — this is just a name to assign against jobs.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="role_title">Role / Title</Label>
            <Input id="role_title" placeholder="e.g. Senior Technician" {...register('role_title')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="skill_tags">Skills</Label>
            <Input id="skill_tags" placeholder="Comma-separated, e.g. rewinding, oil filtration" {...register('skill_tags')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {employee ? 'Save changes' : 'Add employee'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function EmployeesPage() {
  const { data, isLoading } = useEmployees()
  const updateEmployee = useUpdateEmployee()
  const deleteEmployee = useDeleteEmployee()

  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null)

  const columns: ColumnDef<Employee>[] = [
    { accessorKey: 'name', header: ({ column }) => <DataTableColumnHeader column={column} title="Name" /> },
    { accessorKey: 'role_title', header: 'Role', cell: ({ row }) => row.original.role_title || <span className="text-muted-foreground">—</span> },
    {
      id: 'skill_tags',
      header: 'Skills',
      cell: ({ row }) =>
        row.original.skill_tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {row.original.skill_tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: 'is_active',
      header: 'Active',
      cell: ({ row }) => <Switch checked={row.original.is_active} onCheckedChange={(checked) => updateEmployee.mutate({ id: row.original.id, values: { is_active: checked } })} />,
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                setEditingEmployee(row.original)
                setFormOpen(true)
              }}
            >
              <Pencil /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => setDeletingEmployee(row.original)}>
              <Trash2 /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        description="Technicians and staff available for job assignment."
        actions={
          <Button
            onClick={() => {
              setEditingEmployee(null)
              setFormOpen(true)
            }}
          >
            <Plus /> Add Employee
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        globalFilter={search}
        onGlobalFilterChange={setSearch}
        toolbar={() => <Input placeholder="Search employees..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />}
        emptyState={<EmptyState icon={Users} title="No employees yet" description="Add technicians so they can be assigned to repair jobs." />}
      />

      <EmployeeFormDialog open={formOpen} onOpenChange={setFormOpen} employee={editingEmployee} />

      <DeleteConfirmDialog
        open={Boolean(deletingEmployee)}
        onOpenChange={(open) => !open && setDeletingEmployee(null)}
        title="Delete employee?"
        description={`This will permanently delete "${deletingEmployee?.name}".`}
        isPending={deleteEmployee.isPending}
        onConfirm={() => deletingEmployee && deleteEmployee.mutate(deletingEmployee.id, { onSuccess: () => setDeletingEmployee(null) })}
      />
    </div>
  )
}
