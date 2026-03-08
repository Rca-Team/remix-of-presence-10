import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  Mail, MailOpen, Star, StarOff, Trash2, RefreshCw, 
  Search, ArrowLeft, Clock, Paperclip, Inbox
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

interface ReceivedEmail {
  id: string;
  from_email: string;
  from_name: string | null;
  to_email: string;
  subject: string;
  body_text: string | null;
  body_html: string | null;
  attachments: any[];
  is_read: boolean;
  is_starred: boolean;
  received_at: string;
}

const AdminInbox: React.FC = () => {
  const [emails, setEmails] = useState<ReceivedEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<ReceivedEmail | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('received_emails')
        .select('*')
        .order('received_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setEmails((data as ReceivedEmail[]) || []);
    } catch (err) {
      console.error('Error fetching emails:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();

    const channel = supabase
      .channel('inbox-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'received_emails' }, (payload) => {
        setEmails(prev => [payload.new as ReceivedEmail, ...prev]);
        toast({ title: '📧 New Email', description: (payload.new as any).subject });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const markAsRead = async (id: string) => {
    await supabase.from('received_emails').update({ is_read: true } as any).eq('id', id);
    setEmails(prev => prev.map(e => e.id === id ? { ...e, is_read: true } : e));
  };

  const toggleStar = async (id: string, current: boolean) => {
    await supabase.from('received_emails').update({ is_starred: !current } as any).eq('id', id);
    setEmails(prev => prev.map(e => e.id === id ? { ...e, is_starred: !current } : e));
    if (selectedEmail?.id === id) setSelectedEmail(prev => prev ? { ...prev, is_starred: !current } : null);
  };

  const deleteEmail = async (id: string) => {
    await supabase.from('received_emails').delete().eq('id', id);
    setEmails(prev => prev.filter(e => e.id !== id));
    if (selectedEmail?.id === id) setSelectedEmail(null);
    toast({ title: 'Email deleted' });
  };

  const openEmail = (email: ReceivedEmail) => {
    setSelectedEmail(email);
    if (!email.is_read) markAsRead(email.id);
  };

  const unreadCount = emails.filter(e => !e.is_read).length;

  const filtered = emails.filter(e =>
    !searchQuery ||
    e.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.from_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.from_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  // Email detail view
  if (selectedEmail) {
    return (
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelectedEmail(null)}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <div className="flex-1" />
            <Button variant="ghost" size="icon" onClick={() => toggleStar(selectedEmail.id, selectedEmail.is_starred)}>
              {selectedEmail.is_starred ? <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> : <StarOff className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteEmail(selectedEmail.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <h2 className="text-xl font-bold">{selectedEmail.subject}</h2>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
              {(selectedEmail.from_name || selectedEmail.from_email).charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-foreground">{selectedEmail.from_name || selectedEmail.from_email}</p>
              <p className="text-xs">{selectedEmail.from_email} → {selectedEmail.to_email}</p>
            </div>
            <div className="ml-auto flex items-center gap-1 text-xs">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(new Date(selectedEmail.received_at), { addSuffix: true })}
            </div>
          </div>

          {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded-lg">
              <Paperclip className="w-4 h-4" />
              {selectedEmail.attachments.length} attachment(s)
            </div>
          )}

          <div className="border-t pt-4">
            {selectedEmail.body_html ? (
              <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: selectedEmail.body_html }} />
            ) : (
              <pre className="whitespace-pre-wrap text-sm font-sans text-foreground">{selectedEmail.body_text || '(No content)'}</pre>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Inbox list view
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Inbox className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Inbox</h2>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">{unreadCount} new</Badge>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={fetchEmails}>
          <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search emails..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Email list */}
      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Mail className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground font-medium">No emails yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Emails sent to admission@presences.dev will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[calc(100vh-16rem)]">
          <div className="space-y-1">
            <AnimatePresence>
              {filtered.map((email, i) => (
                <motion.div
                  key={email.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                >
                  <button
                    onClick={() => openEmail(email)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      email.is_read
                        ? 'bg-card border-border hover:bg-muted/50'
                        : 'bg-primary/5 border-primary/20 hover:bg-primary/10'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {email.is_read ? (
                          <MailOpen className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <Mail className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-sm truncate ${!email.is_read ? 'font-semibold' : 'font-medium'}`}>
                            {email.from_name || email.from_email}
                          </span>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(new Date(email.received_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className={`text-sm truncate ${!email.is_read ? 'font-medium' : 'text-muted-foreground'}`}>
                          {email.subject}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {email.body_text?.slice(0, 80) || '(No preview)'}
                        </p>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        {email.is_starred && <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />}
                        {email.attachments && email.attachments.length > 0 && <Paperclip className="w-3 h-3 text-muted-foreground" />}
                      </div>
                    </div>
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default AdminInbox;
