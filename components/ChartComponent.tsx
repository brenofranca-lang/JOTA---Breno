
import React from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList
} from 'recharts';

interface ChartComponentProps {
  type: 'bar' | 'pie';
  data: any[];
  colors: string[];
  dataKey?: string;
  nameKey?: string;
  unit?: string;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    if (data.name && data.value !== undefined) { // Pie chart
        const percentage = ((data.value / payload.reduce((sum: number, entry: any) => sum + entry.payload.value, 0)) * 100).toFixed(1);
        return (
            <div className="bg-slate-700 text-white p-2 border border-slate-600 rounded-md shadow-lg">
                <p className="font-bold">{`${data.name}: ${data.value}`}</p>
            </div>
        );
    }
    if (data.name && data.rate !== undefined) { // Bar chart
        return (
             <div className="bg-slate-700 text-white p-2 border border-slate-600 rounded-md shadow-lg">
                <p className="font-bold">{data.name}</p>
                <p>{`Conversão: ${data.rate.toFixed(1)}%`}</p>
                <p>{`Total: ${data.total}`}</p>
                <p>{`Ganhos: ${data.won}`}</p>
            </div>
        )
    }
  }
  return null;
};


export const ChartComponent: React.FC<ChartComponentProps> = ({ type, data, colors, dataKey, nameKey, unit, label }) => {
  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        {type === 'bar' && dataKey && nameKey ? (
          <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey={nameKey} tick={{ fill: '#94a3b8' }} fontSize={12} interval={0} angle={-20} textAnchor="end" height={60} />
            <YAxis tick={{ fill: '#94a3b8' }} unit={unit} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#33415580' }}/>
            <Legend />
            <Bar dataKey={dataKey} name={label} fill={colors[0]} radius={[4, 4, 0, 0]}>
               <LabelList dataKey={dataKey} position="top" formatter={(value: number) => `${value.toFixed(1)}%`} fill="#fff" fontSize={12}/>
            </Bar>
          </BarChart>
        ) : (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                const radius = innerRadius + (outerRadius - innerRadius) * 1.2;
                const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
                return (
                  <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12}>
                    {`${data[index].name} (${(percent * 100).toFixed(0)}%)`}
                  </text>
                );
              }}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};
