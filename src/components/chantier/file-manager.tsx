'use client';

import { useState, useEffect } from 'react';
import { FileUpload, FilePreview } from '@/components/ui/file-upload';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, AlertCircle } from 'lucide-react';
import { STORAGE_BUCKETS } from '@/lib/supabase';

interface ChantierFile {
  id: number;
  fileName: string;
  fileUrl: string;
  fileType: string;
  uploadedAt: string;
  uploadedBy: number | null;
}

interface FileManagerProps {
  chantierId: number;
  currentUserId: number;
}

const FILE_TYPE_CATEGORIES = {
  facture_materiau: 'Factures Matériaux',
  facture_client: 'Factures Client',
  devis: 'Devis',
  pdf: 'Documents PDF',
  photo: 'Photos',
  video: 'Vidéos',
};

export function ChantierFileManager({ chantierId, currentUserId }: FileManagerProps) {
  const [files, setFiles] = useState<ChantierFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('facture_materiau');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Fetch files
  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/chantier-files?chantierId=${chantierId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch files');
      }

      const data = await response.json();
      setFiles(data);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast.error('Erreur lors du chargement des fichiers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [chantierId]);

  // Handle file upload completion
  const handleUploadComplete = async (url: string, fileName: string) => {
    try {
      // Save file reference to database
      const response = await fetch('/api/chantier-files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chantierId,
          fileName,
          fileUrl: url,
          fileType: activeTab,
          uploadedBy: currentUserId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save file reference');
      }

      toast.success('Fichier uploadé avec succès');
      fetchFiles(); // Refresh list
    } catch (error) {
      console.error('Error saving file:', error);
      toast.error('Erreur lors de la sauvegarde du fichier');
    }
  };

  // Handle file deletion
  const handleDelete = async (file: ChantierFile) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${file.fileName}" ?`)) {
      return;
    }

    setDeletingId(file.id);

    try {
      // Extract path from URL (assumes format: .../storage/v1/object/public/bucket/path)
      const urlParts = file.fileUrl.split('/storage/v1/object/public/');
      if (urlParts.length === 2) {
        const [bucket, ...pathParts] = urlParts[1].split('/');
        const path = pathParts.join('/');

        // Delete from storage
        const storageResponse = await fetch(
          `/api/storage/delete?path=${encodeURIComponent(path)}&bucket=${bucket}`,
          { method: 'DELETE' }
        );

        if (!storageResponse.ok) {
          console.error('Failed to delete from storage, continuing with database deletion');
        }
      }

      // Delete from database
      const dbResponse = await fetch(`/api/chantier-files?id=${file.id}`, {
        method: 'DELETE',
      });

      if (!dbResponse.ok) {
        throw new Error('Failed to delete file from database');
      }

      toast.success('Fichier supprimé avec succès');
      fetchFiles(); // Refresh list
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Erreur lors de la suppression du fichier');
    } finally {
      setDeletingId(null);
    }
  };

  // Filter files by active tab
  const filteredFiles = files.filter((file) => file.fileType === activeTab);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          {Object.entries(FILE_TYPE_CATEGORIES).map(([key, label]) => (
            <TabsTrigger key={key} value={key} className="text-xs sm:text-sm">
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.keys(FILE_TYPE_CATEGORIES).map((fileType) => (
          <TabsContent key={fileType} value={fileType} className="space-y-4">
            {/* Upload Area */}
            <FileUpload
              onUploadComplete={handleUploadComplete}
              bucket={STORAGE_BUCKETS.CHANTIER_FILES}
              chantierId={chantierId}
              fileType={fileType}
              accept={
                fileType === 'photo'
                  ? 'image/*'
                  : fileType === 'video'
                  ? 'video/*'
                  : '.pdf,.doc,.docx'
              }
              maxSize={fileType === 'video' ? 100 : 50}
            />

            {/* Files List */}
            {filteredFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="w-12 h-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  Aucun fichier dans cette catégorie
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Uploadez votre premier fichier ci-dessus
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredFiles.map((file) => (
                  <FilePreview
                    key={file.id}
                    fileName={file.fileName}
                    fileUrl={file.fileUrl}
                    fileType={file.fileType}
                    onDelete={
                      deletingId === file.id
                        ? undefined
                        : () => handleDelete(file)
                    }
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
