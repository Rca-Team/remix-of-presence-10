import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DoorOpen, ArrowRight, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';

interface GateModeSetupProps {
  onStart: (gateName: string) => void;
  onCancel: () => void;
}

const GateModeSetup = ({ onStart, onCancel }: GateModeSetupProps) => {
  const [gates, setGates] = useState<{ id: string; name: string; gate_type: string }[]>([]);
  const [selectedGate, setSelectedGate] = useState('Main Gate');
  const [customGate, setCustomGate] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  useEffect(() => {
    supabase.from('school_gates').select('id, name, gate_type').eq('is_active', true)
      .then(({ data }) => {
        if (data?.length) setGates(data);
        else setGates([
          { id: '1', name: 'Main Gate', gate_type: 'main' },
          { id: '2', name: 'Back Gate', gate_type: 'back' },
          { id: '3', name: 'Bus Gate', gate_type: 'bus' },
        ]);
      });
  }, []);

  return (
    <div className="fixed inset-0 bg-background z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-lg w-full"
      >
        <Card className="border-primary/20">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <DoorOpen className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Gate Mode Setup</CardTitle>
            <CardDescription>
              Select which gate this device will monitor. The camera will continuously scan faces.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-2">
              {gates.map(gate => (
                <Button
                  key={gate.id}
                  variant={selectedGate === gate.name ? 'default' : 'outline'}
                  className="justify-start h-12 text-left"
                  onClick={() => { setSelectedGate(gate.name); setShowCustom(false); }}
                >
                  <DoorOpen className="h-4 w-4 mr-2" />
                  {gate.name}
                  <span className="ml-auto text-xs text-muted-foreground capitalize">{gate.gate_type}</span>
                </Button>
              ))}
              
              {showCustom ? (
                <div className="flex gap-2">
                  <Input
                    value={customGate}
                    onChange={e => setCustomGate(e.target.value)}
                    placeholder="Enter gate name..."
                    className="flex-1"
                  />
                  <Button onClick={() => { if (customGate.trim()) { setSelectedGate(customGate.trim()); setShowCustom(false); } }}>
                    Set
                  </Button>
                </div>
              ) : (
                <Button variant="ghost" className="justify-start" onClick={() => setShowCustom(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Custom Gate
                </Button>
              )}
            </div>

            {/* Quick Start */}
            <Button 
              variant="secondary"
              className="w-full h-12 bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary font-semibold"
              onClick={() => onStart('Main Gate')}
            >
              <Zap className="h-4 w-4 mr-2" />
              Quick Start — Main Gate
            </Button>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onCancel}>
                <X className="h-4 w-4 mr-2" /> Cancel
              </Button>
              <Button className="flex-1" onClick={() => onStart(selectedGate)}>
                Start Scanning <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default GateModeSetup;
