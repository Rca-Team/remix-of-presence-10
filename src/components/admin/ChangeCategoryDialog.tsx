import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FolderInput } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Category = 'A' | 'B' | 'C' | 'D' | 'Teacher';

interface ChangeCategoryDialogProps {
  userId: string;
  userName: string;
  currentCategory: Category;
  onCategoryChanged?: () => void;
  trigger?: React.ReactNode;
}

const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'A', label: 'Category A' },
  { key: 'B', label: 'Category B' },
  { key: 'C', label: 'Category C' },
  { key: 'D', label: 'Category D' },
  { key: 'Teacher', label: 'Teacher' },
];

const ChangeCategoryDialog: React.FC<ChangeCategoryDialogProps> = ({
  userId,
  userName,
  currentCategory,
  onCategoryChanged,
  trigger,
}) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [newCategory, setNewCategory] = useState<Category>(currentCategory);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    if (newCategory === currentCategory) {
      setOpen(false);
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('attendance_records')
        .update({ category: newCategory })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: 'Category Updated',
        description: `${userName} has been moved to ${newCategory === 'Teacher' ? 'Teachers' : 'Category ' + newCategory}`,
      });

      onCategoryChanged?.();
      setOpen(false);
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: 'Error',
        description: 'Failed to update category',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-1">
            <FolderInput className="h-3 w-3" />
            Change
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Change Category</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label className="text-muted-foreground">User</Label>
            <p className="font-medium">{userName}</p>
          </div>
          
          <div>
            <Label className="text-muted-foreground">Current Category</Label>
            <p className="font-medium">
              {currentCategory === 'Teacher' ? 'Teacher' : `Category ${currentCategory}`}
            </p>
          </div>

          <div>
            <Label>New Category</Label>
            <Select value={newCategory} onValueChange={(val) => setNewCategory(val as Category)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat.key} value={cat.key}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdate} 
              disabled={isUpdating || newCategory === currentCategory}
            >
              {isUpdating ? 'Updating...' : 'Update Category'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChangeCategoryDialog;
