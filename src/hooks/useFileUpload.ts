import { useState } from 'react';
import { toast } from 'sonner';

interface UploadOptions {
  bucket?: string;
  chantierId?: number;
  fileType?: string;
  onSuccess?: (url: string) => void;
  onError?: (error: string) => void;
}

interface UploadResponse {
  success: boolean;
  url: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  path: string;
}

export function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadFile = async (file: File, options: UploadOptions = {}) => {
    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (options.bucket) formData.append('bucket', options.bucket);
      if (options.chantierId) formData.append('chantierId', options.chantierId.toString());
      if (options.fileType) formData.append('fileType', options.fileType);

      // Simulate progress (real progress requires more complex setup)
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data: UploadResponse = await response.json();
      
      toast.success(`${file.name} uploaded successfully`);
      options.onSuccess?.(data.url);

      return data;
    } catch (error) {
      const errorMessage = (error as Error).message;
      toast.error(`Upload failed: ${errorMessage}`);
      options.onError?.(errorMessage);
      throw error;
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const deleteFile = async (path: string, bucket?: string) => {
    try {
      const params = new URLSearchParams({ path });
      if (bucket) params.append('bucket', bucket);

      const response = await fetch(`/api/storage/delete?${params.toString()}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Delete failed');
      }

      toast.success('File deleted successfully');
      return true;
    } catch (error) {
      const errorMessage = (error as Error).message;
      toast.error(`Delete failed: ${errorMessage}`);
      throw error;
    }
  };

  return {
    uploadFile,
    deleteFile,
    uploading,
    progress,
  };
}
