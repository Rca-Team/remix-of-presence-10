import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  CreditCard, 
  Download, 
  Loader2, 
  User, 
  CheckCircle,
  X,
  FileDown,
  Users
} from 'lucide-react';

interface StudentData {
  id: string;
  name: string;
  employee_id: string;
  department: string;
  position: string;
  avatar_url?: string;
  category?: string;
}

interface StudentIDCardGeneratorProps {
  students?: StudentData[];
}

const StudentIDCardGenerator: React.FC<StudentIDCardGeneratorProps> = ({ students: propStudents }) => {
  const { toast } = useToast();
  const [students, setStudents] = useState<StudentData[]>(propStudents || []);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewStudent, setPreviewStudent] = useState<StudentData | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('id, user_id, device_info, category')
        .eq('status', 'registered');

      if (error) throw error;

      const uniqueStudents = new Map<string, StudentData>();
      
      data?.forEach(record => {
        const deviceInfo = record.device_info as any;
        const metadata = deviceInfo?.metadata;
        
        if (metadata?.name && metadata.name !== 'Unknown') {
          const userId = record.user_id || record.id;
          if (!uniqueStudents.has(userId)) {
            uniqueStudents.set(userId, {
              id: userId,
              name: metadata.name,
              employee_id: metadata.employee_id || 'N/A',
              department: metadata.department || record.category || 'General',
              position: metadata.position || 'Student',
              avatar_url: metadata.firebase_image_url,
              category: record.category
            });
          }
        }
      });

      setStudents(Array.from(uniqueStudents.values()));
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch student data',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (!propStudents) {
      fetchStudents();
    }
  }, [propStudents]);

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    if (selectedIds.size === students.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(students.map(s => s.id)));
    }
  };

  const generateIDCard = async (student: StudentData): Promise<string> => {
    // Generate QR code data
    const qrData = JSON.stringify({
      type: 'student_id',
      id: student.id,
      name: student.name,
      employee_id: student.employee_id
    });

    // Create a temporary container to render the QR code using React
    const qrContainer = document.createElement('div');
    qrContainer.style.position = 'absolute';
    qrContainer.style.left = '-9999px';
    document.body.appendChild(qrContainer);

    // Create QR code SVG string manually using a simple pattern
    // We'll use the QRCodeSVG component's output
    const tempQRDiv = document.createElement('div');
    document.body.appendChild(tempQRDiv);
    
    // Use ReactDOM to render QR code
    const { createRoot } = await import('react-dom/client');
    const qrRoot = createRoot(tempQRDiv);
    
    await new Promise<void>((resolve) => {
      qrRoot.render(
        <QRCodeSVG
          value={qrData}
          size={100}
          level="M"
          bgColor="white"
          fgColor="black"
        />
      );
      setTimeout(resolve, 100);
    });

    const qrSvg = tempQRDiv.querySelector('svg');
    const qrSvgString = qrSvg ? new XMLSerializer().serializeToString(qrSvg) : '';
    const qrBase64 = btoa(unescape(encodeURIComponent(qrSvgString)));

    qrRoot.unmount();
    document.body.removeChild(tempQRDiv);

    // Create temporary element for rendering
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.innerHTML = `
      <div style="
        width: 340px;
        height: 540px;
        background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%);
        border-radius: 20px;
        padding: 24px;
        font-family: 'Inter', sans-serif;
        color: white;
        position: relative;
        overflow: hidden;
      ">
        <div style="
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(180deg, rgba(6, 182, 212, 0.1) 0%, transparent 50%);
        "></div>
        
        <div style="position: relative; z-index: 1;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="
              font-size: 14px;
              color: #22d3ee;
              font-weight: 600;
              letter-spacing: 2px;
              margin-bottom: 4px;
            ">STUDENT ID CARD</div>
            <div style="
              font-size: 11px;
              color: #94a3b8;
            ">Smart Attendance System</div>
          </div>
          
          <div style="
            width: 120px;
            height: 120px;
            margin: 0 auto 20px;
            border-radius: 50%;
            border: 4px solid #22d3ee;
            overflow: hidden;
            background: #1e293b;
          ">
            ${student.avatar_url 
              ? `<img src="${student.avatar_url}" style="width: 100%; height: 100%; object-fit: cover;" crossorigin="anonymous" />`
              : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #64748b; font-size: 48px;">👤</div>`
            }
          </div>
          
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="font-size: 22px; font-weight: 700; margin-bottom: 4px;">${student.name}</div>
            <div style="font-size: 14px; color: #22d3ee;">${student.employee_id}</div>
          </div>
          
          <div style="
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            padding: 12px;
            margin-bottom: 20px;
          ">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #94a3b8; font-size: 12px;">Department</span>
              <span style="font-size: 12px; font-weight: 500;">${student.department}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #94a3b8; font-size: 12px;">Position</span>
              <span style="font-size: 12px; font-weight: 500;">${student.position}</span>
            </div>
          </div>
          
          <div style="
            display: flex;
            justify-content: center;
            padding: 16px;
            background: white;
            border-radius: 12px;
          ">
            <img src="data:image/svg+xml;base64,${qrBase64}" style="width: 100px; height: 100px;" />
          </div>
          
          <div style="text-align: center; margin-top: 12px; font-size: 10px; color: #64748b;">
            Scan QR for quick attendance
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(container);

    await new Promise(resolve => setTimeout(resolve, 150));

    const canvas = await html2canvas(container.firstElementChild as HTMLElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null
    });

    document.body.removeChild(container);
    document.body.removeChild(qrContainer);
    
    return canvas.toDataURL('image/png');
  };

  const downloadSingleCard = async (student: StudentData) => {
    setIsGenerating(true);
    try {
      const dataUrl = await generateIDCard(student);
      
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `ID_Card_${student.name.replace(/\s+/g, '_')}.png`;
      link.click();
      
      toast({
        title: 'Downloaded',
        description: `ID card for ${student.name} downloaded`,
      });
    } catch (error) {
      console.error('Error generating ID card:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate ID card',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadSelectedCards = async () => {
    if (selectedIds.size === 0) {
      toast({
        title: 'No Selection',
        description: 'Please select students first',
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);
    const selectedStudents = students.filter(s => selectedIds.has(s.id));
    
    try {
      for (const student of selectedStudents) {
        await downloadSingleCard(student);
        await new Promise(resolve => setTimeout(resolve, 500)); // Delay between downloads
      }
      
      toast({
        title: 'Complete',
        description: `Downloaded ${selectedStudents.length} ID cards`,
      });
    } catch (error) {
      console.error('Error downloading cards:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-blue-100 dark:border-blue-900/50 shadow-xl overflow-hidden">
      <CardHeader className="pb-4 border-b border-blue-100 dark:border-blue-900/50 bg-gradient-to-r from-purple-600 to-pink-600">
        <CardTitle className="flex items-center gap-3 text-white">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <span>ID Card Generator</span>
            <p className="text-sm font-normal text-white/70">Generate QR-enabled ID cards</p>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4 sm:p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No registered students found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedIds.size === students.length}
                  onCheckedChange={selectAll}
                  id="select-all"
                />
                <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                  Select All ({students.length})
                </label>
              </div>
              
              <Button
                onClick={downloadSelectedCards}
                disabled={selectedIds.size === 0 || isGenerating}
                className="bg-gradient-to-r from-purple-600 to-pink-600"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileDown className="w-4 h-4 mr-2" />
                    Download Selected ({selectedIds.size})
                  </>
                )}
              </Button>
            </div>

            {/* Student Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.map((student) => (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    selectedIds.has(student.id)
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-slate-200 dark:border-slate-700 hover:border-purple-300'
                  }`}
                  onClick={() => toggleSelect(student.id)}
                >
                  <div className="absolute top-3 right-3">
                    <Checkbox
                      checked={selectedIds.has(student.id)}
                      onCheckedChange={() => toggleSelect(student.id)}
                    />
                  </div>
                  
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
                      {student.avatar_url ? (
                        <img src={student.avatar_url} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{student.name}</p>
                      <p className="text-xs text-muted-foreground">{student.employee_id}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      {student.department}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadSingleCard(student);
                      }}
                      disabled={isGenerating}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewStudent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setPreviewStudent(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                size="icon"
                variant="ghost"
                className="absolute -top-12 right-0 text-white"
                onClick={() => setPreviewStudent(null)}
              >
                <X className="w-6 h-6" />
              </Button>
              
              <div
                ref={cardRef}
                className="w-[340px] bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 rounded-[20px] p-6 text-white relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 to-transparent" />
                
                <div className="relative z-10">
                  <div className="text-center mb-5">
                    <p className="text-cyan-400 font-semibold tracking-widest text-sm">STUDENT ID CARD</p>
                    <p className="text-slate-400 text-xs">Smart Attendance System</p>
                  </div>
                  
                  <div className="w-28 h-28 mx-auto mb-5 rounded-full border-4 border-cyan-400 overflow-hidden bg-slate-800">
                    {previewStudent.avatar_url ? (
                      <img src={previewStudent.avatar_url} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">👤</div>
                    )}
                  </div>
                  
                  <div className="text-center mb-5">
                    <p className="text-xl font-bold">{previewStudent.name}</p>
                    <p className="text-cyan-400">{previewStudent.employee_id}</p>
                  </div>
                  
                  <div className="bg-white/5 rounded-xl p-3 mb-5">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-400">Department</span>
                      <span>{previewStudent.department}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Position</span>
                      <span>{previewStudent.position}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-center p-4 bg-white rounded-xl">
                    <QRCodeSVG
                      value={JSON.stringify({
                        type: 'student_id',
                        id: previewStudent.id,
                        name: previewStudent.name,
                        employee_id: previewStudent.employee_id
                      })}
                      size={100}
                    />
                  </div>
                  
                  <p className="text-center text-xs text-slate-500 mt-3">
                    Scan QR for quick attendance
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default StudentIDCardGenerator;
