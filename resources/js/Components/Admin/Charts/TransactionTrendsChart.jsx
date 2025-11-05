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

    // Calculate date range span for smart formatting
    const getDateRangeType = () => {
        if (!data || data.length === 0) return 'month';
        
        const dates = data.map(d => new Date(d.date)).filter(d => !isNaN(d.getTime()));
        if (dates.length === 0) return 'month';
        
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));
        const daysDiff = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));
        
        // Within 1 month (31 days): show individual dates
        if (daysDiff <= 31) return 'date';
        // 1-3 months (32-90 days): show weekly data points
        if (daysDiff <= 90) return 'week';
        // More than 3 months: show monthly data points
        return 'month';
    };

    // Format date based on period and date range
    const formatXAxis = (value) => {
        if (!value) return '';
        const date = new Date(value);
        // Check if date is valid
        if (isNaN(date.getTime())) return '';
        
        if (period === 'weekly') {
            // Show day name for weekly period
            return date.toLocaleDateString('en-US', { weekday: 'short' });
        } else if (period === 'monthly') {
            // Show day and month for monthly period
            return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
        } else if (period === 'custom') {
            // Smart formatting based on date range
            const rangeType = getDateRangeType();
            
            if (rangeType === 'date') {
                // Show date and month for daily data (within 1 month)
                return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
            } else if (rangeType === 'week') {
                // Show "Week of [date]" for weekly data (1-3 months)
                const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                return monthDay;
            } else {
                // Show month and year for monthly data (3+ months)
                return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            }
        } else {
            // Show month and year for all time
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
                                if (!value) return '';
                                const date = new Date(value);
                                if (isNaN(date.getTime())) return '';
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

