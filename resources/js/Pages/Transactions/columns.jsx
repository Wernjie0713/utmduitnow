import { Badge } from '@/Components/ui/badge';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Column label mapping for human-readable display
const columnLabels = {
    reference_id: "Reference ID",
    transaction_date: "Transaction Date",
    transaction_time: "Transaction Time",
    amount: "Amount",
    status: "Status",
    submitted_at: "Submitted At"
};

export const columns = [
    {
        accessorKey: "index",
        header: "#",
        cell: ({ row, table }) => {
            const pageIndex = table.getState().pagination.pageIndex;
            const pageSize = table.getState().pagination.pageSize;
            return `${pageIndex * pageSize + row.index + 1}.`;
        },
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "reference_id",
        header: "Reference ID",
        meta: {
            label: columnLabels.reference_id
        },
        cell: ({ row }) => (
            <span className="font-mono text-sm">{row.getValue("reference_id")}</span>
        ),
    },
    {
        accessorKey: "transaction_date",
        header: "Date",
        meta: {
            label: columnLabels.transaction_date
        },
        cell: ({ row }) => new Date(row.getValue("transaction_date")).toLocaleDateString(),
    },
    {
        accessorKey: "transaction_time",
        header: "Time",
        meta: {
            label: columnLabels.transaction_time
        },
        cell: ({ row }) => {
            const time = row.getValue("transaction_time");
            if (!time) return '-';
            
            // Parse HH:MM:SS format
            const [hours, minutes] = String(time).split(':');
            const hour = parseInt(hours, 10);
            const minute = parseInt(minutes, 10);
            
            // Convert to 12-hour format
            const period = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour === 0 ? 12 : (hour > 12 ? hour - 12 : hour);
            
            return `${displayHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${period}`;
        },
    },
    {
        accessorKey: "amount",
        header: "Amount",
        meta: {
            label: columnLabels.amount
        },
        cell: ({ row }) => `RM ${parseFloat(row.getValue("amount")).toFixed(2)}`,
    },
    {
        accessorKey: "status",
        header: "Status",
        meta: {
            label: columnLabels.status
        },
        cell: ({ row }) => {
            const status = row.getValue("status");
            const statusConfig = {
                approved: { variant: 'default', icon: CheckCircle2, text: 'Approved', className: 'bg-green-100 text-green-800 border-green-200' },
                rejected: { variant: 'destructive', icon: XCircle, text: 'Rejected', className: 'bg-red-100 text-red-800 border-red-200' },
                pending: { variant: 'secondary', icon: Clock, text: 'Pending', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
            };
            const config = statusConfig[status] || statusConfig.pending;
            const Icon = config.icon;
            return (
                <Badge variant={config.variant} className={config.className}>
                    <Icon className="mr-1 h-3 w-3" />
                    {config.text}
                </Badge>
            );
        },
    },
    {
        accessorKey: "submitted_at",
        header: "Submitted",
        meta: {
            label: columnLabels.submitted_at
        },
        cell: ({ row }) => {
            const date = new Date(row.getValue("submitted_at"));
            return (
                <span className="text-sm text-gray-500" title={date.toLocaleString()}>
                    {formatDistanceToNow(date, { addSuffix: true })}
                </span>
            );
        },
    },
];

