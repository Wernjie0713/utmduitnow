import { Badge } from '@/Components/ui/badge';
import { Users, KeySquare } from 'lucide-react';

// Column label mapping for human-readable display
const columnLabels = {
    business_name: "Business Name",
    business_location: "Type & Location",
    course_section: "Course & Section",
    manager: "Manager Details",
    team_members_count: "Team Members",
    duitnow_ids_count: "DuitNow IDs"
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
        accessorKey: "business_name",
        header: "Business Name",
        meta: {
            label: columnLabels.business_name
        },
        cell: ({ row }) => (
            <span className="font-bold">{row.getValue("business_name")}</span>
        ),
    },
    {
        accessorKey: "business_location",
        header: "Type & Location",
        meta: {
            label: columnLabels.business_location
        },
        cell: ({ row }) => {
            const loc = row.getValue("business_location");
            return (
                <Badge variant={loc === 'online' ? 'secondary' : 'default'} className="uppercase">
                    {loc === 'online' ? 'Online Only' : 'Physical Store'}
                </Badge>
            );
        },
    },
    {
        accessorKey: "course_section",
        header: "Course & Section",
        meta: {
            label: columnLabels.course_section
        },
        cell: ({ row }) => {
            const code = row.original.course_code;
            const sec = row.original.section;
            return (
                <div className="flex flex-col">
                    <span className="font-medium text-sm">{code || 'N/A'}</span>
                    <span className="text-xs text-gray-500">Sec: {sec || 'N/A'}</span>
                </div>
            );
        },
    },
    {
        accessorKey: "manager",
        header: "Manager Details",
        meta: {
            label: columnLabels.manager
        },
        cell: ({ row }) => {
            const manager = row.original.manager;
            return (
                <div className="flex flex-col">
                    <span className="font-medium text-sm">{manager?.name || 'Unknown'}</span>
                    <span className="text-xs text-gray-500">{manager?.email}</span>
                </div>
            );
        },
    },
    {
        accessorKey: "team_members_count",
        header: "Team Members",
        meta: {
            label: columnLabels.team_members_count
        },
        cell: ({ row }) => {
            const count = row.getValue("team_members_count") || 0;
            return (
                <div className="flex items-center gap-1 justify-center bg-blue-50 text-blue-700 px-2 py-1 rounded w-fit mx-auto">
                    <Users className="w-4 h-4" />
                    <span className="font-medium text-sm">{count}</span>
                </div>
            );
        },
    },
    {
        accessorKey: "duitnow_ids_count",
        header: "DuitNow IDs",
        meta: {
            label: columnLabels.duitnow_ids_count
        },
        cell: ({ row }) => {
            const count = row.getValue("duitnow_ids_count") || 0;
            return (
                <div className="flex items-center gap-1 justify-center bg-purple-50 text-purple-700 px-2 py-1 rounded w-fit mx-auto">
                    <KeySquare className="w-4 h-4" />
                    <span className="font-medium text-sm">{count}</span>
                </div>
            );
        },
    },
];
