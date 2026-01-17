import React, { useState } from 'react';
import PageLayout from '@/components/layouts/PageLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  IdCard, CalendarDays, Smile, Users, FileText, 
  Shield, Database, MessageCircle, Sparkles
} from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';

// Lazy load feature components
import StudentIDCard from '@/components/features/StudentIDCard';
import AttendanceHeatMap from '@/components/features/AttendanceHeatMap';
import EmotionAnalytics from '@/components/features/EmotionAnalytics';
import ParentPortal from '@/components/features/ParentPortal';
import CustomReportBuilder from '@/components/features/CustomReportBuilder';
import EmergencyLockdown from '@/components/features/EmergencyLockdown';
import BackupRestore from '@/components/features/BackupRestore';
import WhatsAppIntegration from '@/components/features/WhatsAppIntegration';

const Features = () => {
  const { isAdminOrPrincipal } = useUserRole();
  const [activeTab, setActiveTab] = useState('heatmap');

  // Sample student data for ID card demo
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
        <TabsList className="flex-wrap mb-6">
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
          {isAdminOrPrincipal && (
            <>
              <TabsTrigger value="reports" className="gap-2">
                <FileText className="h-4 w-4" />
                Reports
              </TabsTrigger>
              <TabsTrigger value="whatsapp" className="gap-2">
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </TabsTrigger>
              <TabsTrigger value="lockdown" className="gap-2">
                <Shield className="h-4 w-4" />
                Lockdown
              </TabsTrigger>
              <TabsTrigger value="backup" className="gap-2">
                <Database className="h-4 w-4" />
                Backup
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="heatmap">
          <AttendanceHeatMap />
        </TabsContent>

        <TabsContent value="emotions">
          <EmotionAnalytics />
        </TabsContent>

        <TabsContent value="idcard">
          <StudentIDCard student={sampleStudent} />
        </TabsContent>

        <TabsContent value="parent">
          <ParentPortal />
        </TabsContent>

        <TabsContent value="reports">
          <CustomReportBuilder />
        </TabsContent>

        <TabsContent value="whatsapp">
          <WhatsAppIntegration />
        </TabsContent>

        <TabsContent value="lockdown">
          <EmergencyLockdown />
        </TabsContent>

        <TabsContent value="backup">
          <BackupRestore />
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
};

export default Features;
