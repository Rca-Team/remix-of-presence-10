import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Loader2, TrendingUp, TrendingDown, Minus, Award, Star, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ReportData {
  grade: string;
  summary: string;
  strengths: string[];
  improvements: string[];
  recommendation: string;
  parentNote: string;
  trend: 'improving' | 'stable' | 'declining';
  studentName: string;
  month: string;
  year: number;
  stats: {
    totalDays: number;
    presentDays: number;
    lateDays: number;
    absentDays: number;
    attendanceRate: string | number;
  };
  wellnessScore: number | null;
  badgesEarned: number;
}

export default function SmartReportCard() {
  const [report, setReport] = useState<ReportData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1));
  const [selectedYear] = useState(new Date().getFullYear());
  const { toast } = useToast();

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Please log in first');

      const { data, error } = await supabase.functions.invoke('generate-report-card', {
        body: {
          studentId: user.id,
          month: parseInt(selectedMonth),
          year: selectedYear,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setReport(data.report);
      toast({ title: '📊 Report Generated!', description: 'Your AI-powered report card is ready.' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const gradeColor = (g: string) => {
    if (g.startsWith('A')) return 'from-emerald-500 to-green-600';
    if (g.startsWith('B')) return 'from-blue-500 to-cyan-600';
    if (g.startsWith('C')) return 'from-amber-500 to-orange-600';
    return 'from-red-500 to-rose-600';
  };

  const trendIcon = (t: string) => {
    if (t === 'improving') return <TrendingUp className="h-4 w-4 text-emerald-500" />;
    if (t === 'declining') return <TrendingDown className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  return (
    <div className="space-y-6">
      {/* Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            AI Smart Report Card
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Generate AI-powered monthly attendance report cards with insights & recommendations
          </p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 items-end">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Month</label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((m, i) => (
                  <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={generateReport} disabled={isGenerating} className="gap-2">
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
            {isGenerating ? 'Generating...' : 'Generate Report Card'}
          </Button>
        </CardContent>
      </Card>

      {/* Report Card */}
      {report && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="overflow-hidden">
            {/* Header */}
            <div className={`bg-gradient-to-r ${gradeColor(report.grade)} p-6 text-white`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{report.studentName}</h2>
                  <p className="opacity-90">{report.month} {report.year} Report Card</p>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-black">{report.grade}</div>
                  <div className="flex items-center gap-1 mt-1 justify-center">
                    {trendIcon(report.trend)}
                    <span className="text-sm capitalize opacity-90">{report.trend}</span>
                  </div>
                </div>
              </div>
            </div>

            <CardContent className="p-6 space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Working Days', value: report.stats.totalDays, icon: '📅' },
                  { label: 'Present', value: report.stats.presentDays, icon: '✅' },
                  { label: 'Late', value: report.stats.lateDays, icon: '⏰' },
                  { label: 'Absent', value: report.stats.absentDays, icon: '❌' },
                ].map(s => (
                  <div key={s.label} className="bg-muted/50 rounded-xl p-3 text-center">
                    <div className="text-lg">{s.icon}</div>
                    <div className="text-2xl font-bold text-foreground">{s.value}</div>
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Attendance Rate Bar */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Attendance Rate</span>
                  <span className="font-semibold text-foreground">{report.stats.attendanceRate}%</span>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full bg-gradient-to-r ${gradeColor(report.grade)}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${report.stats.attendanceRate}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="bg-muted/30 rounded-xl p-4">
                <p className="text-sm text-foreground leading-relaxed">{report.summary}</p>
              </div>

              {/* Strengths & Improvements */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-1.5 text-foreground">
                    <CheckCircle className="h-4 w-4 text-emerald-500" /> Strengths
                  </h4>
                  {report.strengths.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-emerald-500 mt-0.5">•</span> {s}
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-1.5 text-foreground">
                    <AlertTriangle className="h-4 w-4 text-amber-500" /> Areas to Improve
                  </h4>
                  {report.improvements.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-amber-500 mt-0.5">•</span> {s}
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendation */}
              <div className="border border-primary/20 rounded-xl p-4 bg-primary/5">
                <h4 className="font-semibold text-sm text-primary mb-1">💡 Recommendation</h4>
                <p className="text-sm text-foreground">{report.recommendation}</p>
              </div>

              {/* Parent Note */}
              <div className="border border-border rounded-xl p-4">
                <h4 className="font-semibold text-sm text-foreground mb-1">📝 Note for Parents</h4>
                <p className="text-sm text-muted-foreground">{report.parentNote}</p>
              </div>

              {/* Extra Info */}
              <div className="flex flex-wrap gap-3">
                {report.wellnessScore !== null && (
                  <Badge variant="outline" className="gap-1">
                    💚 Wellness: {report.wellnessScore}/100
                  </Badge>
                )}
                {report.badgesEarned > 0 && (
                  <Badge variant="outline" className="gap-1">
                    <Award className="h-3 w-3" /> {report.badgesEarned} badges earned
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
