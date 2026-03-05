import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { GateEntry } from '@/pages/GateMode';

interface LateEntryFormProps {
  student: GateEntry;
  onSubmit: (reason: string, detail: string) => Promise<void>;
  onDismiss: () => void;
}

const LATE_REASONS = [
  { value: 'traffic', label: 'Traffic / यातायात' },
  { value: 'medical', label: 'Medical / चिकित्सा' },
  { value: 'transport', label: 'Transport Issue / परिवहन' },
  { value: 'weather', label: 'Weather / मौसम' },
  { value: 'personal', label: 'Personal / व्यक्तिगत' },
  { value: 'other', label: 'Other / अन्य' },
];

const LateEntryForm = ({ student, onSubmit, onDismiss }: LateEntryFormProps) => {
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;
    setSubmitting(true);
    await onSubmit(reason, detail);
    setSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ y: 30, scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 30, scale: 0.95 }}
        transition={{ type: 'tween' }}
        className="bg-card rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-border"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            <h3 className="font-bold text-foreground">Late Entry</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onDismiss}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          <span className="font-semibold text-foreground">{student.studentName}</span> arrived late at{' '}
          {student.time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </p>

        <div className="space-y-3">
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger>
              <SelectValue placeholder="Select reason / कारण चुनें" />
            </SelectTrigger>
            <SelectContent>
              {LATE_REASONS.map(r => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Textarea
            value={detail}
            onChange={e => setDetail(e.target.value)}
            placeholder="Additional details (optional)..."
            rows={2}
          />

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onDismiss}>Skip</Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={!reason || submitting}>
              {submitting ? 'Saving...' : 'Record'}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LateEntryForm;
