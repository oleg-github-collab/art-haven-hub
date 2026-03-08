import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Eye, Euro } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AnalyticsChartsProps {
  labels: {
    analytics: string;
    views_week: string;
    sales_dynamics: string;
    views: string;
    sales: string;
  };
}

/* ── fake weekly views data ── */
const viewsData = [
  { week: "Тиж 1", views: 42 },
  { week: "Тиж 2", views: 78 },
  { week: "Тиж 3", views: 134 },
  { week: "Тиж 4", views: 89 },
  { week: "Тиж 5", views: 156 },
  { week: "Тиж 6", views: 201 },
  { week: "Тиж 7", views: 312 },
  { week: "Тиж 8", views: 278 },
];

/* ── fake sales data ── */
const salesData = [
  { month: "Січ", sales: 0 },
  { month: "Лют", sales: 680 },
  { month: "Бер", sales: 0 },
  { month: "Кві", sales: 1200 },
  { month: "Тра", sales: 850 },
  { month: "Чер", sales: 1500 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-foreground">{label}</p>
      <p className="text-muted-foreground mt-0.5">
        {typeof payload[0].value === "number" && payload[0].value > 100 && payload[0].name === "sales"
          ? `€${payload[0].value.toLocaleString()}`
          : payload[0].value.toLocaleString()}
      </p>
    </div>
  );
};

export default function AnalyticsCharts({ labels }: AnalyticsChartsProps) {
  const maxViews = useMemo(() => Math.max(...viewsData.map((d) => d.views)), []);
  const maxSales = useMemo(() => Math.max(...salesData.map((d) => d.sales)), []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="mb-8 rounded-2xl border border-border bg-card p-5 card-shadow"
    >
      <h3 className="mb-4 text-sm font-semibold">{labels.analytics}</h3>

      <Tabs defaultValue="views" className="w-full">
        <TabsList className="mb-4 h-9 w-fit rounded-full bg-muted/60 p-1">
          <TabsTrigger
            value="views"
            className="gap-1.5 rounded-full px-3 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Eye className="h-3.5 w-3.5" />
            {labels.views_week}
          </TabsTrigger>
          <TabsTrigger
            value="sales"
            className="gap-1.5 rounded-full px-3 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Euro className="h-3.5 w-3.5" />
            {labels.sales_dynamics}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="views" className="mt-0">
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={viewsData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, Math.ceil(maxViews * 1.15)]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="views"
                  name="views"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  fill="url(#viewsGrad)"
                  dot={{ r: 3, fill: "hsl(var(--primary))", stroke: "hsl(var(--background))", strokeWidth: 2 }}
                  activeDot={{ r: 5, stroke: "hsl(var(--primary))", strokeWidth: 2, fill: "hsl(var(--background))" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="mt-0">
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, Math.ceil(maxSales * 1.15)]}
                  tickFormatter={(v) => `€${v}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="sales"
                  name="sales"
                  fill="hsl(var(--primary))"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
