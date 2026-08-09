import React from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

const AXIS = { fontSize: 10, fill: 'hsl(var(--muted-foreground))' };
const TOOLTIP = {
  background: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 8,
  fontSize: 12,
  color: 'hsl(var(--foreground))',
};
const COLORS = [
  'hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))',
  'hsl(var(--chart-4))', 'hsl(var(--chart-5))',
];

export function BiLineChart({ data, lines = [], height = 220 }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="label" tick={AXIS} stroke="hsl(var(--muted-foreground))" />
          <YAxis tick={AXIS} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
          <Tooltip contentStyle={TOOLTIP} />
          {lines.map((l, i) => (
            <Line key={l.key} type="monotone" dataKey={l.key} name={l.name || l.key}
              stroke={l.color || COLORS[i % COLORS.length]} strokeWidth={2} dot={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BiBarChart({ data, bars = [], height = 220 }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="label" tick={AXIS} stroke="hsl(var(--muted-foreground))" />
          <YAxis tick={AXIS} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
          <Tooltip contentStyle={TOOLTIP} cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} />
          {bars.map((b, i) => (
            <Bar key={b.key} dataKey={b.key} name={b.name || b.key}
              fill={b.color || COLORS[i % COLORS.length]} radius={[3, 3, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BiAreaChart({ data, areas = [], height = 220 }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <defs>
            {areas.map((a, i) => (
              <linearGradient key={a.key} id={'bi-g-' + i} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={a.color || COLORS[i % COLORS.length]} stopOpacity={0.35} />
                <stop offset="95%" stopColor={a.color || COLORS[i % COLORS.length]} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="label" tick={AXIS} stroke="hsl(var(--muted-foreground))" />
          <YAxis tick={AXIS} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
          <Tooltip contentStyle={TOOLTIP} />
          {areas.map((a, i) => (
            <Area key={a.key} type="monotone" dataKey={a.key} name={a.name || a.key}
              stroke={a.color || COLORS[i % COLORS.length]} fill={`url(#bi-g-${i})`} strokeWidth={2} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BiPieChart({ data, height = 240, nameKey = 'name', valueKey = 'value' }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey={valueKey} nameKey={nameKey} cx="50%" cy="50%" outerRadius={80}
            label={(e) => e.name} labelLine={false}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip contentStyle={TOOLTIP} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}