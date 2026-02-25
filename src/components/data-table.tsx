'use client';

import * as React from 'react';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconDotsVertical,
  IconGripVertical,
  IconLayoutColumns,
  IconRefresh,
  IconShieldCheck,
  IconAlertTriangle,
  IconAlertCircle,
} from '@tabler/icons-react';
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type Row,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table';
import { z } from 'zod';

import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AddAccountModal } from '@/components/add-account-modal';

// ─── Schema ────────────────────────────────────────────────────────────────────

export const schema = z.object({
  id: z.number(),
  login: z.string(),
  avatarUrl: z.string(),
  plan: z.string(),
  accessTypeSku: z.string(),
  premiumPercentRemaining: z.number(),
  premiumUnitsRemaining: z.number(),
  premiumEntitlement: z.number(),
  chatUnlimited: z.boolean(),
  completionsUnlimited: z.boolean(),
  quotaResetDateUtc: z.string(),
  lastSnapshotUtc: z.string(),
  tokenEncrypted: z.string(),
});

export type CopilotAccount = z.infer<typeof schema>;

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getStatusInfo(pct: number) {
  if (pct < 10)
    return {
      label: 'Critical',
      color: 'text-red-500',
      bg: 'bg-red-500',
      icon: IconAlertCircle,
    };
  if (pct < 30)
    return {
      label: 'Low',
      color: 'text-orange-500',
      bg: 'bg-orange-500',
      icon: IconAlertTriangle,
    };
  if (pct < 70)
    return {
      label: 'Watch',
      color: 'text-yellow-500',
      bg: 'bg-yellow-500',
      icon: IconAlertTriangle,
    };
  return {
    label: 'Healthy',
    color: 'text-green-500',
    bg: 'bg-green-500',
    icon: IconShieldCheck,
  };
}

/** Format UTC string → "DD Mon, HH:MM AM/PM IST" */
function toIST(utc: string): string {
  try {
    return (
      new Date(utc).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }) + ' IST'
    );
  } catch {
    return utc;
  }
}

/** "in Xd Yh" or "Xd Yh ago" */
function countdown(utc: string): string {
  const diff = new Date(utc).getTime() - Date.now();
  const abs = Math.abs(diff);
  const d = Math.floor(abs / 86_400_000);
  const h = Math.floor((abs % 86_400_000) / 3_600_000);
  const label = d > 0 ? `${d}d ${h}h` : `${h}h`;
  return diff > 0 ? `in ${label}` : `${label} ago`;
}

/** Compact SKU label */
function skuLabel(sku: string) {
  if (sku.includes('free_educational')) return 'Free / Edu';
  if (sku.includes('business')) return 'Business';
  if (sku.includes('enterprise')) return 'Enterprise';
  if (sku.includes('pro')) return 'Pro';
  return sku;
}

// ─── Drag Handle ───────────────────────────────────────────────────────────────

function DragHandle({ id }: { id: number }) {
  const { attributes, listeners } = useSortable({ id });
  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
    >
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  );
}

// ─── Progress Bar ──────────────────────────────────────────────────────────────

function QuotaBar({ pct }: { pct: number }) {
  const { bg } = getStatusInfo(pct);
  return (
    <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
      <div
        className={`h-full rounded-full ${bg} transition-all`}
        style={{ width: `${Math.max(pct, 0)}%` }}
      />
    </div>
  );
}

// ─── Columns Factory ─────────────────────────────────────────────────────────

function createColumns(
  onRefresh: (id: number) => void,
  onDelete: (id: number) => void
): ColumnDef<CopilotAccount>[] {
  return [
    {
      id: 'drag',
      header: () => null,
      cell: ({ row }) => <DragHandle id={row.original.id} />,
      enableHiding: false,
    },
    {
      id: 'select',
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'login',
      header: 'Account',
      cell: ({ row }) => (
        <TableCellViewer item={row.original} onRefresh={onRefresh} />
      ),
      enableHiding: false,
    },
    {
      accessorKey: 'premiumPercentRemaining',
      header: 'Premium Left',
      cell: ({ row }) => {
        const pct = row.original.premiumPercentRemaining;
        const used = 100 - pct;
        const { color } = getStatusInfo(pct);
        return (
          <div className="flex min-w-[120px] flex-col gap-1">
            <div className="flex justify-between text-xs">
              <span className={`font-medium ${color}`}>
                {pct.toFixed(1)}% left
              </span>
              <span className="text-muted-foreground">
                {used.toFixed(1)}% used
              </span>
            </div>
            <QuotaBar pct={pct} />
            <span className="text-muted-foreground text-xs">
              {row.original.premiumUnitsRemaining} /{' '}
              {row.original.premiumEntitlement} units
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'premiumPercentRemaining',
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const {
          label,
          color,
          icon: Icon,
        } = getStatusInfo(row.original.premiumPercentRemaining);
        return (
          <Badge
            variant="outline"
            className={`flex w-24 items-center gap-1 px-2 ${color}`}
          >
            <Icon className="size-3" />
            {label}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'quotaResetDateUtc',
      header: 'Resets',
      cell: ({ row }) => (
        <div className="flex flex-col text-xs">
          <span className="font-medium">
            {toIST(row.original.quotaResetDateUtc)}
          </span>
          <span className="text-muted-foreground">
            {countdown(row.original.quotaResetDateUtc)}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'lastSnapshotUtc',
      header: 'Last Checked',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">
          {toIST(row.original.lastSnapshotUtc)}
        </span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
              size="icon"
            >
              <IconDotsVertical />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem onClick={() => onRefresh(row.original.id)}>
              <IconRefresh className="mr-2 size-4" />
              Refresh
            </DropdownMenuItem>
            <DropdownMenuItem>View Details</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDelete(row.original.id)}
            >
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}

// ─── Draggable Row ─────────────────────────────────────────────────────────────

function DraggableRow({ row }: { row: Row<CopilotAccount> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  });

  return (
    <TableRow
      data-state={row.getIsSelected() && 'selected'}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}

// ─── DataTable ─────────────────────────────────────────────────────────────────

const noop = () => {};

export function DataTable({
  data: initialData,
  onRefresh,
  onDelete,
  onAdd,
}: {
  data: CopilotAccount[];
  onRefresh?: (id: number) => void;
  onDelete?: (id: number) => void;
  onAdd?: (token: string) => void;
}) {
  const [data, setData] = React.useState(() => initialData);

  // Sync external data into local state (e.g. after SpacetimeDB inserts/deletes).
  // Drag-reorder is local-only so it resets when the source data changes.
  React.useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const columns = React.useMemo(
    () => createColumns(onRefresh ?? noop, onDelete ?? noop),
    [onRefresh, onDelete]
  );
  const sortableId = React.useId();
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map(({ id }) => id) ?? [],
    [data]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setData((d) => {
        const oldIndex = dataIds.indexOf(active.id);
        const newIndex = dataIds.indexOf(over.id);
        return arrayMove(d, oldIndex, newIndex);
      });
    }
  }

  return (
    <Tabs
      defaultValue="accounts"
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select defaultValue="accounts">
          <SelectTrigger
            className="flex w-fit @4xl/main:hidden"
            size="sm"
            id="view-selector"
          >
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="accounts">Accounts</SelectItem>
            <SelectItem value="alerts">Alerts</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="alerts">
            Alerts{' '}
            <Badge variant="secondary">
              {data.filter((a) => a.premiumPercentRemaining < 30).length}
            </Badge>
          </TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Filter accounts…"
            value={(table.getColumn('login')?.getFilterValue() as string) ?? ''}
            onChange={(e) =>
              table.getColumn('login')?.setFilterValue(e.target.value)
            }
            className="h-8 w-44 text-sm"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns />
                <span className="hidden lg:inline">Columns</span>
                <IconChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter(
                  (col) =>
                    typeof col.accessorFn !== 'undefined' && col.getCanHide()
                )
                .map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.id}
                    className="capitalize"
                    checked={col.getIsVisible()}
                    onCheckedChange={(v) => col.toggleVisibility(!!v)}
                  >
                    {col.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {onAdd && <AddAccountModal onAdd={onAdd} />}
        </div>
      </div>

      {/* Accounts tab */}
      <TabsContent
        value="accounts"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="overflow-hidden rounded-lg border">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>
                    {hg.headers.map((header) => (
                      <TableHead key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="**:data-[slot=table-cell]:first:w-8">
                {table.getRowModel().rows?.length ? (
                  <SortableContext
                    items={dataIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {table.getRowModel().rows.map((row) => (
                      <DraggableRow key={row.id} row={row} />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} of{' '}
            {table.getFilteredRowModel().rows.length} account(s) selected.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(v) => table.setPageSize(Number(v))}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 50].map((s) => (
                    <SelectItem key={s} value={`${s}`}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{' '}
              {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">First page</span>
                <IconChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Previous page</span>
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Next page</span>
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Last page</span>
                <IconChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>

      {/* Alerts tab */}
      <TabsContent value="alerts" className="flex flex-col px-4 lg:px-6">
        <div className="rounded-lg border">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Premium Left</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Resets</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data
                .filter((a) => a.premiumPercentRemaining < 30)
                .sort(
                  (a, b) =>
                    a.premiumPercentRemaining - b.premiumPercentRemaining
                )
                .map((account) => {
                  const { label, color } = getStatusInfo(
                    account.premiumPercentRemaining
                  );
                  return (
                    <TableRow key={account.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={account.avatarUrl}
                            alt={account.login}
                            className="size-7 rounded-full"
                          />
                          <span className="font-medium">{account.login}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex min-w-[120px] flex-col gap-1">
                          <QuotaBar pct={account.premiumPercentRemaining} />
                          <span className={`text-xs font-medium ${color}`}>
                            {account.premiumPercentRemaining.toFixed(1)}%
                            remaining
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${color}`}>
                          {label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {countdown(account.quotaResetDateUtc)}
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </div>
      </TabsContent>
    </Tabs>
  );
}

// ─── TableCellViewer (Detail Drawer) ──────────────────────────────────────────

function TableCellViewer({
  item,
  onRefresh,
}: {
  item: CopilotAccount;
  onRefresh?: (id: number) => void;
}) {
  const isMobile = useIsMobile();
  const { label, color, bg } = getStatusInfo(item.premiumPercentRemaining);

  return (
    <Drawer direction={isMobile ? 'bottom' : 'right'}>
      <DrawerTrigger asChild>
        <Button
          variant="link"
          className="text-foreground flex w-fit items-center gap-2 px-0 text-left"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.avatarUrl}
            alt={item.login}
            className="size-6 rounded-full"
          />
          <span>{item.login}</span>
          <Badge variant="secondary" className="text-xs">
            {item.plan}
          </Badge>
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-2">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.avatarUrl}
              alt={item.login}
              className="size-12 rounded-full border"
            />
            <div>
              <DrawerTitle className="text-lg">{item.login}</DrawerTitle>
              <DrawerDescription className="mt-0.5 flex items-center gap-2">
                <Badge variant="secondary">{item.plan}</Badge>
                <Badge variant="outline" className="text-xs">
                  {skuLabel(item.accessTypeSku)}
                </Badge>
              </DrawerDescription>
            </div>
          </div>
        </DrawerHeader>

        <div className="flex flex-col gap-5 overflow-y-auto px-4 pb-2 text-sm">
          {/* Premium Interactions */}
          <div className="flex flex-col gap-3 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold">
                Premium Interactions
              </span>
              <Badge variant="outline" className={color}>
                {label}
              </Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Remaining</span>
              <span className={`font-semibold ${color}`}>
                {item.premiumPercentRemaining.toFixed(2)}%
              </span>
            </div>
            <div className="bg-muted h-2.5 w-full overflow-hidden rounded-full">
              <div
                className={`h-full rounded-full ${bg}`}
                style={{
                  width: `${Math.max(item.premiumPercentRemaining, 0)}%`,
                }}
              />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-muted rounded-md p-2">
                <div className="text-base font-semibold">
                  {item.premiumUnitsRemaining}
                </div>
                <div className="text-muted-foreground">Remaining</div>
              </div>
              <div className="bg-muted rounded-md p-2">
                <div className="text-base font-semibold">
                  {item.premiumEntitlement - item.premiumUnitsRemaining}
                </div>
                <div className="text-muted-foreground">Used</div>
              </div>
              <div className="bg-muted rounded-md p-2">
                <div className="text-base font-semibold">
                  {item.premiumEntitlement}
                </div>
                <div className="text-muted-foreground">Total</div>
              </div>
            </div>
          </div>

          {/* Other quotas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1 rounded-lg border p-3">
              <span className="text-sm font-medium">Chat</span>
              <span className="text-sm font-semibold text-green-500">
                {item.chatUnlimited ? 'Unlimited' : 'Limited'}
              </span>
              <span className="text-muted-foreground text-xs">
                No quota cap
              </span>
            </div>
            <div className="flex flex-col gap-1 rounded-lg border p-3">
              <span className="text-sm font-medium">Completions</span>
              <span className="text-sm font-semibold text-green-500">
                {item.completionsUnlimited ? 'Unlimited' : 'Limited'}
              </span>
              <span className="text-muted-foreground text-xs">
                No quota cap
              </span>
            </div>
          </div>

          <Separator />

          {/* Timing info */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Quota Resets</span>
              <div className="text-right">
                <div className="font-medium">
                  {toIST(item.quotaResetDateUtc)}
                </div>
                <div className="text-muted-foreground text-xs">
                  {countdown(item.quotaResetDateUtc)}
                </div>
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Last Snapshot</span>
              <span className="font-medium">{toIST(item.lastSnapshotUtc)}</span>
            </div>
          </div>
        </div>

        <DrawerFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRefresh?.(item.id)}
          >
            <IconRefresh className="mr-2 size-4" />
            Refresh Now
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
