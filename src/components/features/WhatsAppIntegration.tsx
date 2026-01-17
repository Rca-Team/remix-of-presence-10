import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageCircle, 
  Send, 
  Settings, 
  Users, 
  Bell,
  Check,
  Clock,
  AlertCircle,
  Phone,
  History,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  type: 'attendance' | 'absent' | 'late' | 'custom';
}

interface MessageLog {
  id: string;
  recipient: string;
  message: string;
  status: 'sent' | 'delivered' | 'failed';
  timestamp: Date;
}

const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: '1',
    name: 'Present Notification',
    content: 'Hello {parent_name}, your child {student_name} has been marked present at {time} today. Have a great day!',
    type: 'attendance',
  },
  {
    id: '2',
    name: 'Absent Alert',
    content: '⚠️ Alert: {student_name} has been marked absent today ({date}). If this is unexpected, please contact the school.',
    type: 'absent',
  },
  {
    id: '3',
    name: 'Late Arrival',
    content: 'Notice: {student_name} arrived late at {time} today. Please ensure timely arrival for better academic performance.',
    type: 'late',
  },
];

const WhatsAppIntegration: React.FC = () => {
  const { toast } = useToast();
  const [isConfigured, setIsConfigured] = useState(false);
  const [templates, setTemplates] = useState<MessageTemplate[]>(DEFAULT_TEMPLATES);
  const [messageLogs, setMessageLogs] = useState<MessageLog[]>([]);
  const [settings, setSettings] = useState({
    autoNotifyPresent: false,
    autoNotifyAbsent: true,
    autoNotifyLate: true,
    quietHoursStart: '21:00',
    quietHoursEnd: '07:00',
  });
  
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', content: '', type: 'custom' as const });

  useEffect(() => {
    loadSettings();
    loadMessageLogs();
  }, []);

  const loadSettings = () => {
    const saved = localStorage.getItem('whatsapp_settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  };

  const loadMessageLogs = () => {
    const saved = localStorage.getItem('whatsapp_logs');
    if (saved) {
      const logs = JSON.parse(saved).map((l: any) => ({
        ...l,
        timestamp: new Date(l.timestamp),
      }));
      setMessageLogs(logs);
    }
  };

  const saveSettings = () => {
    localStorage.setItem('whatsapp_settings', JSON.stringify(settings));
    toast({
      title: "Settings Saved",
      description: "WhatsApp notification settings updated.",
    });
  };

  const sendTestMessage = async () => {
    if (!testPhone || !testMessage) {
      toast({
        title: "Missing Information",
        description: "Please enter phone number and message.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      // In production, this would call an edge function that uses Twilio/WhatsApp Business API
      // For demo, we'll simulate the send
      await new Promise(resolve => setTimeout(resolve, 1500));

      const log: MessageLog = {
        id: Date.now().toString(),
        recipient: testPhone,
        message: testMessage,
        status: 'sent',
        timestamp: new Date(),
      };

      const updatedLogs = [log, ...messageLogs].slice(0, 50);
      setMessageLogs(updatedLogs);
      localStorage.setItem('whatsapp_logs', JSON.stringify(updatedLogs));

      toast({
        title: "Message Sent",
        description: `Test message sent to ${testPhone}`,
      });

      setTestPhone('');
      setTestMessage('');
    } catch (error) {
      toast({
        title: "Send Failed",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const addTemplate = () => {
    if (!newTemplate.name || !newTemplate.content) {
      toast({
        title: "Missing Information",
        description: "Please fill in template name and content.",
        variant: "destructive",
      });
      return;
    }

    const template: MessageTemplate = {
      id: Date.now().toString(),
      ...newTemplate,
    };

    setTemplates(prev => [...prev, template]);
    setNewTemplate({ name: '', content: '', type: 'custom' });
    
    toast({
      title: "Template Added",
      description: "New message template created successfully.",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="secondary"><Check className="h-3 w-3 mr-1" />Sent</Badge>;
      case 'delivered':
        return <Badge variant="default" className="bg-green-500"><Check className="h-3 w-3 mr-1" />Delivered</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card className="bg-gradient-to-r from-green-500/10 to-green-500/5 border-green-500/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-green-500 rounded-full">
                <MessageCircle className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">WhatsApp Notifications</h2>
                <p className="text-muted-foreground">
                  Send automated attendance alerts to parents
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-lg py-2 px-4">
              <Zap className="h-4 w-4 mr-1" />
              {messageLogs.filter(l => l.status === 'sent').length} sent today
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="send" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="send" className="gap-2">
            <Send className="h-4 w-4" />
            Send
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <MessageCircle className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <History className="h-4 w-4" />
            Logs
          </TabsTrigger>
        </TabsList>

        {/* Send Tab */}
        <TabsContent value="send">
          <Card>
            <CardHeader>
              <CardTitle>Send Test Message</CardTitle>
              <CardDescription>
                Test the WhatsApp integration by sending a message
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Phone Number (with country code)</Label>
                <div className="flex gap-2">
                  <span className="flex items-center px-3 bg-muted rounded-l-md border border-r-0">
                    <Phone className="h-4 w-4" />
                  </span>
                  <Input
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="rounded-l-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Enter your message..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Quick Templates</Label>
                <div className="flex flex-wrap gap-2">
                  {templates.map(template => (
                    <Button
                      key={template.id}
                      variant="outline"
                      size="sm"
                      onClick={() => setTestMessage(template.content)}
                    >
                      {template.name}
                    </Button>
                  ))}
                </div>
              </div>

              <Button 
                onClick={sendTestMessage} 
                disabled={isSending}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isSending ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Message Templates</CardTitle>
                <CardDescription>
                  Use variables: {'{student_name}'}, {'{parent_name}'}, {'{time}'}, {'{date}'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {templates.map(template => (
                  <div key={template.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{template.name}</span>
                      <Badge variant="outline">{template.type}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{template.content}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Add New Template</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Template Name</Label>
                    <Input
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter template name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={newTemplate.type}
                      onValueChange={(value: any) => setNewTemplate(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="attendance">Attendance</SelectItem>
                        <SelectItem value="absent">Absent</SelectItem>
                        <SelectItem value="late">Late</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Message Content</Label>
                  <Textarea
                    value={newTemplate.content}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Enter message template..."
                    rows={3}
                  />
                </div>
                <Button onClick={addTemplate}>
                  Add Template
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure automatic notification behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-notify on Present</Label>
                    <p className="text-sm text-muted-foreground">
                      Send confirmation when student marks attendance
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoNotifyPresent}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, autoNotifyPresent: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-notify on Absent</Label>
                    <p className="text-sm text-muted-foreground">
                      Alert parents when student is marked absent
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoNotifyAbsent}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, autoNotifyAbsent: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-notify on Late</Label>
                    <p className="text-sm text-muted-foreground">
                      Notify when student arrives late
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoNotifyLate}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, autoNotifyLate: checked }))
                    }
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <Label className="mb-4 block">Quiet Hours</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Start Time</Label>
                    <Input
                      type="time"
                      value={settings.quietHoursStart}
                      onChange={(e) => 
                        setSettings(prev => ({ ...prev, quietHoursStart: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">End Time</Label>
                    <Input
                      type="time"
                      value={settings.quietHoursEnd}
                      onChange={(e) => 
                        setSettings(prev => ({ ...prev, quietHoursEnd: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  No notifications will be sent during quiet hours
                </p>
              </div>

              <Button onClick={saveSettings} className="w-full">
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Message History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {messageLogs.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {messageLogs.map(log => (
                    <div key={log.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-sm">{log.recipient}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(log.status)}
                          <span className="text-xs text-muted-foreground">
                            {format(log.timestamp, 'MMM d, HH:mm')}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{log.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No messages sent yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WhatsAppIntegration;
