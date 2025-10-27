import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/Components/ui/chart';

export default function FacultyComparisonChart({ data, period }) {
    const chartConfig = {
        count: {
            label: 'Transactions',
            color: 'hsl(var(--chart-2))',
        },
    };

    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-[350px] text-gray-500">
                <div className="text-center">
                    <p className="text-lg font-medium">No faculty data available</p>
                    <p className="text-sm mt-2">Data will appear once transactions are recorded</p>
                </div>
            </div>
        );
    }

    return (
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
            <BarChart
                data={data}
                layout="horizontal"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis
                    type="category"
                    dataKey="faculty"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                />
                <ChartTooltip
                    content={
                        <ChartTooltipContent
                            labelFormatter={(value, payload) => {
                                if (payload && payload.length > 0) {
                                    return payload[0].payload.name || value;
                                }
                                return value;
                            }}
                            formatter={(value, name, props) => {
                                const average = props.payload.average;
                                const students = props.payload.students;
                                return [
                                    <div key="tooltip" className="flex flex-col gap-1">
                                        <span>{value} transactions</span>
                                        <span className="text-xs text-muted-foreground">
                                            {students} students (avg: {average} per student)
                                        </span>
                                    </div>,
                                    'Total',
                                ];
                            }}
                        />
                    }
                />
                <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} />
            </BarChart>
        </ChartContainer>
    );
}

