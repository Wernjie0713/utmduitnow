import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/Components/ui/chart';

export default function YearParticipationChart({ data, period }) {
    const chartConfig = {
        count: {
            label: 'Transactions',
            color: 'hsl(var(--chart-3))',
        },
    };

    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-[350px] text-gray-500">
                <div className="text-center">
                    <p className="text-lg font-medium">No year participation data available</p>
                    <p className="text-sm mt-2">Data will appear once transactions are recorded</p>
                </div>
            </div>
        );
    }

    return (
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                    dataKey="year"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => `Year ${value}`}
                />
                <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                />
                <ChartTooltip
                    content={
                        <ChartTooltipContent
                            labelFormatter={(value) => `Year ${value}`}
                            formatter={(value, name, props) => {
                                const students = props.payload.students;
                                const rate = props.payload.rate;
                                return [
                                    <div key="tooltip" className="flex flex-col gap-1">
                                        <span>{value} transactions</span>
                                        <span className="text-xs text-muted-foreground">
                                            {students} students ({(rate * 100).toFixed(1)}% participation)
                                        </span>
                                    </div>,
                                    'Total',
                                ];
                            }}
                        />
                    }
                />
                <Bar dataKey="count" fill="var(--color-count)" radius={[8, 8, 0, 0]} />
            </BarChart>
        </ChartContainer>
    );
}

