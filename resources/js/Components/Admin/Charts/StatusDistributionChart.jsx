import { Pie, PieChart, Cell, Legend } from 'recharts';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/Components/ui/chart';

export default function StatusDistributionChart({ data }) {
    const chartConfig = {
        approved: {
            label: 'Approved',
            color: 'hsl(142, 76%, 36%)', // Green
        },
        pending: {
            label: 'Pending',
            color: 'hsl(48, 96%, 53%)', // Yellow
        },
        rejected: {
            label: 'Rejected',
            color: 'hsl(0, 84%, 60%)', // Red
        },
    };

    // Transform data to array format for Recharts
    const chartData = [
        { name: 'Approved', value: data.approved || 0, color: chartConfig.approved.color },
        { name: 'Pending', value: data.pending || 0, color: chartConfig.pending.color },
        { name: 'Rejected', value: data.rejected || 0, color: chartConfig.rejected.color },
    ];

    const total = (data.approved || 0) + (data.pending || 0) + (data.rejected || 0);

    if (total === 0) {
        return (
            <div className="flex items-center justify-center h-[350px] text-gray-500">
                <div className="text-center">
                    <p className="text-lg font-medium">No transaction status data available</p>
                    <p className="text-sm mt-2">Data will appear once transactions are recorded</p>
                </div>
            </div>
        );
    }

    const renderCustomLabel = ({
        cx,
        cy,
        midAngle,
        innerRadius,
        outerRadius,
        percent,
    }) => {
        if (percent === 0) return null;

        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
        const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));

        return (
            <text
                x={x}
                y={y}
                fill="white"
                textAnchor="middle"
                dominantBaseline="central"
                className="font-bold"
            >
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <div className="flex flex-col items-center">
            <ChartContainer config={chartConfig} className="h-[350px] w-full">
                <PieChart>
                    <ChartTooltip
                        content={
                            <ChartTooltipContent
                                formatter={(value, name, props) => {
                                    const percentage = ((value / total) * 100).toFixed(1);
                                    const color = props.payload.fill || props.color || props.payload.color;
                                    return (
                                        <>
                                            <div className="h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: color }} />
                                            <div className="flex flex-1 justify-between leading-none items-center">
                                                <span className="text-muted-foreground">{name}</span>
                                                <span className="font-mono font-medium tabular-nums text-foreground ml-3">
                                                    {value} ({percentage}%)
                                                </span>
                                            </div>
                                        </>
                                    );
                                }}
                            />
                        }
                    />
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomLabel}
                        outerRadius={120}
                        innerRadius={60}
                        dataKey="value"
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value, entry) => {
                            const percentage = ((entry.payload.value / total) * 100).toFixed(1);
                            return `${value}: ${entry.payload.value} (${percentage}%)`;
                        }}
                    />
                </PieChart>
            </ChartContainer>
            <div className="mt-4 text-center text-sm text-muted-foreground">
                Total Transactions: <span className="font-semibold text-foreground">{total}</span>
            </div>
        </div>
    );
}

