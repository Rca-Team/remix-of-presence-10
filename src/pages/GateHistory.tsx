import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import PageLayout from '@/components/layouts/PageLayout';
import PageTransition from '@/components/PageTransition';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  DoorOpen, Clock, Users, AlertTriangle, CheckCircle2, 
  ChevronRight, Calendar, ArrowLeft 
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

const GateHistory = () => {
  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['gateSessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gate_sessions')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    }
  });

  const [selectedSession, setSelectedSession] = React.useState<string | null>(null);

  const { data: entries, isLoading: entriesLoading } = useQuery({
    queryKey: ['gateEntries', selectedSession],
    queryFn: async () => {
      if (!selectedSession) return [];
      const { data, error } = await supabase
        .from('gate_entries')
        .select('*')
        .eq('gate_session_id', selectedSession)
        .order('entry_time', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedSession
  });

  const totalRecognized = sessions?.reduce((sum, s) => sum + (s.total_entries || 0), 0) || 0;
  const totalUnknown = sessions?.reduce((sum, s) => sum + (s.unknown_entries || 0), 0) || 0;

  return (
    <PageTransition>
      <PageLayout className="min-h-screen">
        <PageHeader
          title="Gate Entry History"
          description="View all past gate sessions with stats and entry logs"
        />

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Sessions', value: sessions?.length || 0, icon: DoorOpen, color: 'text-primary' },
            { label: 'Recognized', value: totalRecognized, icon: CheckCircle2, color: 'text-emerald' },
            { label: 'Unknown', value: totalUnknown, icon: AlertTriangle, color: 'text-rose' },
            { label: 'Total Entries', value: totalRecognized + totalUnknown, icon: Users, color: 'text-cyan' },
          ].map((stat, i) => (
            <Card key={i} className="border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <stat.icon className={`h-5 w-5 ${stat.color} flex-shrink-0`} />
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Sessions list */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Sessions</h3>
            {sessionsLoading ? (
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
            ) : sessions?.length === 0 ? (
              <Card className="border-dashed border-border/50">
                <CardContent className="p-8 text-center text-muted-foreground">
                  <DoorOpen className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p>No gate sessions yet</p>
                  <Link to="/dashboard">
                    <Button variant="outline" size="sm" className="mt-3">Start a Session</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              sessions?.map((session, i) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card
                    className={`cursor-pointer transition-all border-border/50 hover:border-primary/50 ${
                      selectedSession === session.id ? 'ring-2 ring-primary border-primary' : ''
                    }`}
                    onClick={() => setSelectedSession(session.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <DoorOpen className="h-4 w-4 text-primary" />
                          <span className="font-semibold text-sm text-foreground">{session.gate_name}</span>
                        </div>
                        <Badge variant={session.ended_at ? 'secondary' : 'default'} className="text-[10px]">
                          {session.ended_at ? 'Ended' : 'Active'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(session.started_at), 'MMM d, yyyy')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(session.started_at), 'h:mm a')}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs">
                        <span className="flex items-center gap-1 text-emerald">
                          <CheckCircle2 className="h-3 w-3" /> {session.total_entries || 0}
                        </span>
                        {(session.unknown_entries || 0) > 0 && (
                          <span className="flex items-center gap-1 text-rose">
                            <AlertTriangle className="h-3 w-3" /> {session.unknown_entries}
                          </span>
                        )}
                        {session.ended_at && (
                          <span className="text-muted-foreground ml-auto">
                            {formatDistanceToNow(new Date(session.started_at), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>

          {/* Entry log */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Entry Log {selectedSession ? '' : '— Select a session'}
            </h3>
            {!selectedSession ? (
              <Card className="border-dashed border-border/50">
                <CardContent className="p-8 text-center text-muted-foreground">
                  <ChevronRight className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p>Select a session to view entries</p>
                </CardContent>
              </Card>
            ) : entriesLoading ? (
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
            ) : entries?.length === 0 ? (
              <Card className="border-dashed border-border/50">
                <CardContent className="p-8 text-center text-muted-foreground">
                  <p>No entries in this session</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                {entries?.map((entry, i) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Card className="border-border/50">
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          entry.is_recognized 
                            ? 'bg-emerald/10 text-emerald' 
                            : 'bg-rose/10 text-rose'
                        }`}>
                          {entry.is_recognized ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {entry.student_name || 'Unknown'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(entry.entry_time), 'h:mm:ss a')}
                            {entry.confidence && ` · ${Math.round(entry.confidence * 100)}% match`}
                          </p>
                        </div>
                        <Badge variant={entry.is_recognized ? 'default' : 'destructive'} className="text-[10px] flex-shrink-0">
                          {entry.is_recognized ? 'Recognized' : 'Unknown'}
                        </Badge>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </PageLayout>
    </PageTransition>
  );
};

export default GateHistory;
