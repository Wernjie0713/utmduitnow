import { Badge } from '@/Components/ui/badge';
import { CheckCircle2, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Column label mapping for human-readable display
const columnLabels = {
    name: "Name",
    email: "Email",
    phone_number: "Phone Number",
    matric_no: "Matric No",
    duitnow_id: "DuitNow ID",
    faculty: "Faculty",
    year_of_study: "Year of Study",
    email_verified_at: "Email Verified",
    created_at: "Registered At"
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
        accessorKey: "name",
        header: "Name",
        meta: {
            label: columnLabels.name
        },
        cell: ({ row }) => (
            <span className="font-medium">{row.getValue("name")}</span>
        ),
    },
    {
        accessorKey: "email",
        header: "Email",
        meta: {
            label: columnLabels.email
        },
        cell: ({ row }) => (
            <span className="text-sm">{row.getValue("email")}</span>
        ),
    },
    {
        accessorKey: "phone_number",
        header: "Phone Number",
        meta: {
            label: columnLabels.phone_number
        },
        cell: ({ row }) => (
            <span className="text-sm">{row.getValue("phone_number") || 'N/A'}</span>
        ),
    },
    {
        accessorKey: "matric_no",
        header: "Matric No",
        meta: {
            label: columnLabels.matric_no
        },
        cell: ({ row }) => (
            <span className="font-mono text-sm">{row.getValue("matric_no")}</span>
        ),
    },
    {
        accessorKey: "duitnow_id",
        header: "DuitNow ID",
        meta: {
            label: columnLabels.duitnow_id
        },
        cell: ({ row }) => (
            <span className="font-mono text-sm">{row.getValue("duitnow_id")}</span>
        ),
    },
    {
        accessorKey: "faculty",
        header: "Faculty",
        meta: {
            label: columnLabels.faculty
        },
        cell: ({ row }) => {
            const faculty = row.original.faculty;
            return (
                <Badge variant="outline">
                    {faculty?.short_name || 'N/A'}
                </Badge>
            );
        },
    },
    {
        accessorKey: "year_of_study",
        header: "Year",
        meta: {
            label: columnLabels.year_of_study
        },
        cell: ({ row }) => {
            const year = row.getValue("year_of_study");
            return year ? `Year ${year}` : 'N/A';
        },
    },
    {
        accessorKey: "email_verified_at",
        header: "Email Verified",
        meta: {
            label: columnLabels.email_verified_at
        },
        cell: ({ row }) => {
            const verified = row.getValue("email_verified_at");
            return verified ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
                <XCircle className="h-5 w-5 text-red-600" />
            );
        },
    },
    {
        accessorKey: "created_at",
        header: "Registered",
        meta: {
            label: columnLabels.created_at
        },
        cell: ({ row }) => {
            const date = new Date(row.getValue("created_at"));
            return (
                <span className="text-sm text-gray-500" title={date.toLocaleString()}>
                    {formatDistanceToNow(date, { addSuffix: true })}
                </span>
            );
        },
    },
];

