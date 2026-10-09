import { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, BarChart3, Activity, Calendar, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Track } from '@/types';

interface TrackAnalyticsChartProps {
  track: Track;
}

interface DailyPlayPoint {
  date: string;
  fullDate: string;
  plays: number;
  cumulative: number;
}

// Generate realistic deterministic 30-day play statistics based on track id and total playsCount
function generate30DayStats(trackId: string, totalPlays: number): DailyPlayPoint[] {
  const points: DailyPlayPoint[] = [];
  const basePlays = Math.max(totalPlays || 150, 80);
  
  // Seed hash from trackId
  let hash = 0;
  for (let i = 0; i < trackId.length; i++) {
    hash = (hash << 5) - hash + trackId.charCodeAt(i);
    hash |= 0;
  }
  const seed = Math.abs(hash);

  // Target plays over 30 days is roughly 60-80% of total all-time plays (or 40-100 per day for new tracks)
  const target30DayPlays = Math.max(Math.round(basePlays * 0.45), 90);
  const avgDaily = Math.max(Math.round(target30DayPlays / 30), 3);

  const now = new Date(2026, 9, 9); // October 9, 2026
  let runningCumulative = 0;

  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);

    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Deterministic organic variation
    const pseudoRand = ((seed * (i + 1) * 9301 + 49297) % 233280) / 233280;
    const wave = Math.sin((30 - i) / 4) * 0.35 + Math.cos((30 - i) / 2.5) * 0.2;
    const weekendBoost = isWeekend ? 1.35 : 1.0;
    const growthTrend = 0.8 + ((30 - i) / 30) * 0.5; // Slight upward momentum

    let dailyCount = Math.round(avgDaily * (1 + wave) * weekendBoost * growthTrend * (0.8 + pseudoRand * 0.4));
    if (dailyCount < 1) dailyCount = 1;

    runningCumulative += dailyCount;

    const dayName = d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
    const fullDate = d.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'long' });

    points.push({
      date: dayName,
      fullDate,
      plays: dailyCount,
      cumulative: runningCumulative,
    });
  }

  return points;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string }>;
  label?: string;
  mode: 'daily' | 'cumulative' | 'bars';
}

function CustomTooltip({ active, payload, mode }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const item = payload[0];
    const data = (item as unknown as { payload: DailyPlayPoint }).payload;
    const value = item.value;

    return (
      <div className="bg-popover/95 backdrop-blur-md border border-border/80 px-3.5 py-2.5 rounded-xl shadow-2xl text-xs space-y-1">
        <p className="font-semibold text-foreground flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-orange-500" />
          {data.fullDate}
        </p>
        <div className="flex items-center gap-2 pt-0.5">
          <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />
          <span className="text-muted-foreground">
            {mode === 'cumulative' ? 'Cumulatief aantal:' : 'Aantal afspelingen:'}
          </span>
          <span className="font-bold text-orange-400 font-mono">
            {value.toLocaleString()} {value === 1 ? 'play' : 'plays'}
          </span>
        </div>
      </div>
    );
  }
  return null;
}

export function TrackAnalyticsChart({ track }: TrackAnalyticsChartProps) {
  const [chartMode, setChartMode] = useState<'daily' | 'cumulative' | 'bars'>('daily');

  const data = useMemo(() => {
    return generate30DayStats(track.id, track.playsCount || 0);
  }, [track.id, track.playsCount]);

  const summary = useMemo(() => {
    const total30Days = data.reduce((acc, curr) => acc + curr.plays, 0);
    const avgDaily = Math.round(total30Days / data.length);
    const maxDay = data.reduce((max, curr) => (curr.plays > max.plays ? curr : max), data[0]);

    // Trend calculation: compare first 15 days vs last 15 days
    const firstHalf = data.slice(0, 15).reduce((acc, c) => acc + c.plays, 0);
    const secondHalf = data.slice(15).reduce((acc, c) => acc + c.plays, 0);
    const growthPercent = firstHalf > 0 ? Math.round(((secondHalf - firstHalf) / firstHalf) * 100) : 15;

    return {
      total30Days,
      avgDaily,
      maxDay,
      growthPercent: growthPercent >= 0 ? `+${growthPercent}%` : `${growthPercent}%`,
    };
  }, [data]);

  return (
    <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-sm overflow-hidden space-y-5">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500/15 flex items-center justify-center text-orange-500">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              Afspeelstatistieken (Laatste 30 dagen)
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Overzicht van dagelijkse interacties en luistertrends voor &ldquo;{track.title}&rdquo;
          </p>
        </div>

        {/* View mode buttons */}
        <div className="flex items-center gap-1 bg-secondary/80 p-1 rounded-xl self-start sm:self-auto">
          <Button
            size="sm"
            variant={chartMode === 'daily' ? 'default' : 'ghost'}
            className={`h-7 px-2.5 text-xs rounded-lg transition-all ${
              chartMode === 'daily'
                ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setChartMode('daily')}
          >
            <TrendingUp className="w-3.5 h-3.5 mr-1" />
            Verloop
          </Button>
          <Button
            size="sm"
            variant={chartMode === 'bars' ? 'default' : 'ghost'}
            className={`h-7 px-2.5 text-xs rounded-lg transition-all ${
              chartMode === 'bars'
                ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setChartMode('bars')}
          >
            <BarChart3 className="w-3.5 h-3.5 mr-1" />
            Staven
          </Button>
          <Button
            size="sm"
            variant={chartMode === 'cumulative' ? 'default' : 'ghost'}
            className={`h-7 px-2.5 text-xs rounded-lg transition-all ${
              chartMode === 'cumulative'
                ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setChartMode('cumulative')}
          >
            <Play className="w-3.5 h-3.5 mr-1" />
            Totaal
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-secondary/40 border border-border/50 rounded-xl p-3">
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
            30 Dagen Plays
          </p>
          <p className="text-xl font-bold text-foreground mt-0.5">
            {summary.total30Days.toLocaleString()}
          </p>
        </div>
        <div className="bg-secondary/40 border border-border/50 rounded-xl p-3">
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
            Gemiddeld / dag
          </p>
          <p className="text-xl font-bold text-orange-400 mt-0.5">
            {summary.avgDaily.toLocaleString()}
          </p>
        </div>
        <div className="bg-secondary/40 border border-border/50 rounded-xl p-3">
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
            Piekmoment
          </p>
          <p className="text-xl font-bold text-foreground mt-0.5">
            {summary.maxDay.plays} <span className="text-xs font-normal text-muted-foreground">({summary.maxDay.date})</span>
          </p>
        </div>
        <div className="bg-secondary/40 border border-border/50 rounded-xl p-3">
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
            30 Dagen Groei
          </p>
          <p className="text-xl font-bold text-emerald-400 mt-0.5 flex items-center gap-1">
            <TrendingUp className="w-4 h-4 inline" />
            {summary.growthPercent}
          </p>
        </div>
      </div>

      {/* Recharts Chart Area */}
      <div className="w-full h-64 sm:h-72 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartMode === 'bars' ? (
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#ea580c" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border/40" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: 'currentColor' }}
                className="text-muted-foreground"
                interval={Math.floor(data.length / 6)}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: 'currentColor' }}
                className="text-muted-foreground"
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip mode={chartMode} />} />
              <Bar
                dataKey="plays"
                fill="url(#barGradient)"
                radius={[4, 4, 0, 0]}
                animationDuration={900}
              />
            </BarChart>
          ) : (
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="playsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#f97316" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border/40" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: 'currentColor' }}
                className="text-muted-foreground"
                interval={Math.floor(data.length / 6)}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: 'currentColor' }}
                className="text-muted-foreground"
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip mode={chartMode} />} />
              <Area
                type="monotone"
                dataKey={chartMode === 'cumulative' ? 'cumulative' : 'plays'}
                stroke="#f97316"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#playsGradient)"
                animationDuration={900}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
