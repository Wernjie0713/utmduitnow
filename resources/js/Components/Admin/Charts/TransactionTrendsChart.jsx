import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/Components/ui/chart';

export default function TransactionTrendsChart({ data, period }) {
    const chartConfig = {
        count: {
            label: 'Transactions',
            color: 'hsl(var(--chart-1))',
        },
        amount: {
            label: 'Amount (RM)',
            color: 'hsl(var(--chart-2))',
        },
    };

    // Format date based on period
    const formatXAxis = (value) => {
        const date = new Date(value);
        if (period === 'weekly') {
            // Show day name for weekly
            return date.toLocaleDateString('en-US', { weekday: 'short' });
        } else if (period === 'monthly') {
            // Show day for monthly
            return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
        } else {
            // Show month for all time
            return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        }
    };

    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-[350px] text-gray-500">
                <div className="text-center">
                    <p className="text-lg font-medium">No transaction data available</p>
                    <p className="text-sm mt-2">Data will appear once transactions are recorded</p>
                </div>
            </div>
        );
    }

    return (
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="fillCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-count)" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="var(--color-count)" stopOpacity={0.1} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={formatXAxis}
                />
                <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => `${value}`}
                />
                <ChartTooltip
                    content={
                        <ChartTooltipContent
                            labelFormatter={(value) => {
                                const date = new Date(value);
                                return date.toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                });
                            }}
                            formatter={(value, name) => {
                                if (name === 'amount') {
                                    return [`RM ${parseFloat(value).toFixed(2)}`, 'Total Amount'];
                                }
                                return [value, 'Transactions'];
                            }}
                        />
                    }
                />
                <Area
                    type="monotone"
                    dataKey="count"
                    stroke="var(--color-count)"
                    fill="url(#fillCount)"
                    strokeWidth={2}
                />
            </AreaChart>
        </ChartContainer>
    );
}

