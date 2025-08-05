'use client';

import { Bar, BarChart, CartesianGrid, Legend, Pie, PieChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface ChartRendererProps {
  chartData: any;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export function ChartRenderer({ chartData }: ChartRendererProps) {
  if (!chartData || !chartData.type || !chartData.data) {
    return <p className='text-destructive'>Invalid chart data provided.</p>;
  }
  
  const renderChart = () => {
    switch (chartData.type) {
      case 'bar':
        const dataKey = Object.keys(chartData.data[0] || {}).find(k => k !== 'name') || 'value';
        return (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                    contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        borderColor: 'hsl(var(--border))'
                    }}
                />
                <Legend />
                <Bar dataKey={dataKey} fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
                    return (
                        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                        {`${(percent * 100).toFixed(0)}%`}
                        </text>
                    );
                }}
              >
                {chartData.data.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                 contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))'
                 }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return <p className='text-destructive'>Unsupported chart type: {chartData.type}</p>;
    }
  }

  return (
    <Card className='my-4'>
        <CardHeader>
            {chartData.title && <CardTitle>{chartData.title}</CardTitle>}
            {chartData.description && <CardDescription>{chartData.description}</CardDescription>}
        </CardHeader>
        <CardContent>
            {renderChart()}
        </CardContent>
    </Card>
  )
}
