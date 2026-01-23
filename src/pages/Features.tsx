import React, { useState } from 'react';
import PageLayout from '@/components/layouts/PageLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  IdCard, CalendarDays, Smile, Users, FileText, 
  Shield, Database, MessageCircle, Sparkles, Bus,
  MapPin, Brain, Heart, Trophy, Camera, Siren
} from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

// Feature components
import StudentIDCard from '@/components/features/StudentIDCard';
import AttendanceHeatMap from '@/components/features/AttendanceHeatMap';
import EmotionAnalytics from '@/components/features/EmotionAnalytics';
import ParentPortal from '@/components/features/ParentPortal';
import CustomReportBuilder from '@/components/features/CustomReportBuilder';
import EmergencyLockdown from '@/components/features/EmergencyLockdown';
import BackupRestore from '@/components/features/BackupRestore';
import WhatsAppIntegration from '@/components/features/WhatsAppIntegration';

// New Phase 2-4 components
import VisitorManagement from '@/components/features/VisitorManagement';
import BusTracker from '@/components/features/BusTracker';
import ZoneTracker from '@/components/features/ZoneTracker';
import PanicButton from '@/components/features/PanicButton';
import AttendancePredictions from '@/components/features/AttendancePredictions';
import WellnessScore from '@/components/features/WellnessScore';
import Gamification from '@/components/features/Gamification';
import ClassPhotoRegistration from '@/components/features/ClassPhotoRegistration';

const Features = () => {
  const { isAdminOrPrincipal } = useUserRole();
  const [activeTab, setActiveTab] = useState('heatmap');

  const sampleStudent = {
    id: '1',
    name: 'John Smith',
    employee_id: 'STU-2024-001',
    category: 'A',
    department: 'Science',
  };

  return (
    <PageLayout>
      <PageHeader
        title={
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            Advanced Features
          </span>
        }
        description="Access powerful tools for attendance management"
        icon={<Sparkles className="h-8 w-8 text-cyan-400" />}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <ScrollArea className="w-full whitespace-nowrap">
          <TabsList className="inline-flex mb-6">
            <TabsTrigger value="heatmap" className="gap-2">
              <CalendarDays className="h-4 w-4" />
              Heat Map
            </TabsTrigger>
            <TabsTrigger value="emotions" className="gap-2">
              <Smile className="h-4 w-4" />
              Emotions
            </TabsTrigger>
            <TabsTrigger value="idcard" className="gap-2">
              <IdCard className="h-4 w-4" />
              ID Cards
            </TabsTrigger>
            <TabsTrigger value="parent" className="gap-2">
              <Users className="h-4 w-4" />
              Parent Portal
            </TabsTrigger>
            <TabsTrigger value="batch" className="gap-2">
              <Camera className="h-4 w-4" />
              Batch Register
            </TabsTrigger>
            <TabsTrigger value="gamification" className="gap-2">
              <Trophy className="h-4 w-4" />
              Rewards
            </TabsTrigger>
            {isAdminOrPrincipal && (
              <>
                <TabsTrigger value="visitors" className="gap-2">
                  <Users className="h-4 w-4" />
                  Visitors
                </TabsTrigger>
                <TabsTrigger value="bus" className="gap-2">
                  <Bus className="h-4 w-4" />
                  Bus Tracker
                </TabsTrigger>
                <TabsTrigger value="zones" className="gap-2">
                  <MapPin className="h-4 w-4" />
                  Zone Tracker
                </TabsTrigger>
                <TabsTrigger value="predictions" className="gap-2">
                  <Brain className="h-4 w-4" />
                  AI Predictions
                </TabsTrigger>
                <TabsTrigger value="wellness" className="gap-2">
                  <Heart className="h-4 w-4" />
                  Wellness
                </TabsTrigger>
                <TabsTrigger value="emergency" className="gap-2">
                  <Siren className="h-4 w-4" />
                  Emergency
                </TabsTrigger>
                <TabsTrigger value="reports" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Reports
                </TabsTrigger>
                <TabsTrigger value="whatsapp" className="gap-2">
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </TabsTrigger>
                <TabsTrigger value="backup" className="gap-2">
                  <Database className="h-4 w-4" />
                  Backup
                </TabsTrigger>
              </>
            )}
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <TabsContent value="heatmap"><AttendanceHeatMap /></TabsContent>
        <TabsContent value="emotions"><EmotionAnalytics /></TabsContent>
        <TabsContent value="idcard"><StudentIDCard student={sampleStudent} /></TabsContent>
        <TabsContent value="parent"><ParentPortal /></TabsContent>
        <TabsContent value="batch"><ClassPhotoRegistration /></TabsContent>
        <TabsContent value="gamification"><Gamification /></TabsContent>
        <TabsContent value="visitors"><VisitorManagement /></TabsContent>
        <TabsContent value="bus"><BusTracker /></TabsContent>
        <TabsContent value="zones"><ZoneTracker /></TabsContent>
        <TabsContent value="predictions"><AttendancePredictions /></TabsContent>
        <TabsContent value="wellness"><WellnessScore /></TabsContent>
        <TabsContent value="emergency"><PanicButton /></TabsContent>
        <TabsContent value="reports"><CustomReportBuilder /></TabsContent>
        <TabsContent value="whatsapp"><WhatsAppIntegration /></TabsContent>
        <TabsContent value="backup"><BackupRestore /></TabsContent>
      </Tabs>
    </PageLayout>
  );
};

export default Features;
