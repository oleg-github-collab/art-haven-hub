import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Eye, Euro, Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

interface AnalyticsChartsProps {
  labels: {
    analytics: string;
    views_week: string;
    sales_dynamics: string;
    views: string;
    sales: string;
    period_week?: string;
    period_month?: string;
    period_year?: string;
  };
}

type Period = "week" | "month" | "year";

const viewsDataByPeriod: Record<Period, { label: string; views: number }[]> = {
  week: [
    { label: "Пн", views: 42 },
    { label: "Вт", views: 58 },
    { label: "Ср", views: 91 },
    { label: "Чт", views: 67 },
    { label: "Пт", views: 134 },
    { label: "Сб", views: 178 },
    { label: "Нд", views: 156 },
  ],
  month: [
    { label: "Тиж 1", views: 312 },
    { label: "Тиж 2", views: 478 },
    { label: "Тиж 3", views: 534 },
    { label: "Тиж 4", views: 389 },
  ],
  year: [
    { label: "Січ", views: 420 },
    { label: "Лют", views: 680 },
    { label: "Бер", views: 890 },
    { label: "Кві", views: 1150 },
    { label: "Тра", views: 1340 },
    { label: "Чер", views: 1580 },
    { label: "Лип", views: 1200 },
    { label: "Сер", views: 980 },
    { label: "Вер", views: 1450 },
    { label: "Жов", views: 1670 },
    { label: "Лис", views: 1890 },
    { label: "Гру", views: 2100 },
  ],
};

const salesDataByPeriod: Record<Period, { label: string; sales: number }[]> = {
  week: [
    { label: "Пн", sales: 0 },
    { label: "Вт", sales: 200 },
    { label: "Ср", sales: 0 },
    { label: "Чт", sales: 450 },
    { label: "Пт", sales: 0 },
    { label: "Сб", sales: 680 },
    { label: "Нд", sales: 0 },
  ],
  month: [
    { label: "Тиж 1", sales: 680 },
    { label: "Тиж 2", sales: 1200 },
    { label: "Тиж 3", sales: 850 },
    { label: "Тиж 4", sales: 1500 },
  ],
  year: [
    { label: "Січ", sales: 0 },
    { label: "Лют", sales: 680 },
    { label: "Бер", sales: 0 },
    { label: "Кві", sales: 1200 },
    { label: "Тра", sales: 850 },
    { label: "Чер", sales: 1500 },
    { label: "Лип", sales: 420 },
    { label: "Сер", sales: 0 },
    { label: "Вер", sales: 950 },
    { label: "Жов", sales: 1800 },
    { label: "Лис", sales: 2200 },
    { label: "Гру", sales: 3100 },
  ],
};

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
  const [period, setPeriod] = useState<Period>("month");

  const viewsData = viewsDataByPeriod[period];
  const salesData = salesDataByPeriod[period];
  const maxViews = useMemo(() => Math.max(...viewsData.map((d) => d.views)), [viewsData]);
  const maxSales = useMemo(() => Math.max(...salesData.map((d) => d.sales)), [salesData]);

  const periodLabels: Record<Period, string> = {
    week: labels.period_week || "Тиждень",
    month: labels.period_month || "Місяць",
    year: labels.period_year || "Рік",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="mb-8 rounded-2xl border border-border bg-card p-5 card-shadow"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{labels.analytics}</h3>
        <div className="flex items-center gap-1 rounded-full bg-muted/60 p-1">
          {(["week", "month", "year"] as Period[]).map((p) => (
            <Button
              key={p}
              size="sm"
              variant="ghost"
              onClick={() => setPeriod(p)}
              className={`h-7 rounded-full px-3 text-xs font-medium transition-all ${
                period === p
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {periodLabels[p]}
            </Button>
          ))}
        </div>
      </div>

      <Tabs defaultValue="views" className="w-full">
        <TabsList className="mb-4 h-9 w-fit rounded-full bg-muted/60 p-1">
          <TabsTrigger
            value="views"
            className="gap-1.5 rounded-full px-3 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Eye className="h-3.5 w-3.5" />
            {labels.views}
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
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} domain={[0, Math.ceil(maxViews * 1.15)]} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="views" name="views" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#viewsGrad)" dot={{ r: 3, fill: "hsl(var(--primary))", stroke: "hsl(var(--background))", strokeWidth: 2 }} activeDot={{ r: 5, stroke: "hsl(var(--primary))", strokeWidth: 2, fill: "hsl(var(--background))" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="mt-0">
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} domain={[0, Math.ceil(maxSales * 1.15)]} tickFormatter={(v) => `€${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="sales" name="sales" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
