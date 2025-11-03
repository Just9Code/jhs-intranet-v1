'use client';

import { useRef, useState } from 'react';
import { Upload, X, FileIcon, Image as ImageIcon, Video, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useFileUpload } from '@/hooks/useFileUpload';

interface FileUploadProps {
  onUploadComplete: (url: string, fileName: string) => void;
  onUploadError?: (error: string) => void;
  accept?: string;
  maxSize?: number; // in MB
  bucket?: string;
  chantierId?: number;
  fileType?: string;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function FileUpload({
  onUploadComplete,
  onUploadError,
  accept = 'image/*,video/*,.pdf,.doc,.docx',
  maxSize = 50,
  bucket,
  chantierId,
  fileType,
  disabled = false,
  className,
  children,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const { uploadFile, uploading, progress } = useFileUpload();

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFile = async (file: File) => {
    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      const error = `File too large. Maximum size is ${maxSize}MB`;
      onUploadError?.(error);
      return;
    }

    try {
      const result = await uploadFile(file, {
        bucket,
        chantierId,
        fileType,
        onSuccess: (url) => onUploadComplete(url, file.name),
        onError: onUploadError,
      });
    } catch (error) {
      // Error already handled in hook
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        disabled={disabled || uploading}
        className="hidden"
      />

      {children ? (
        <div onClick={handleClick} className={cn(disabled && 'opacity-50 cursor-not-allowed')}>
          {children}
        </div>
      ) : (
        <div
          onClick={!uploading ? handleClick : undefined}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={cn(
            'relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all',
            dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
            uploading && 'pointer-events-none opacity-70',
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
        >
          <div className="flex flex-col items-center gap-3">
            {uploading ? (
              <>
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <div className="w-full max-w-xs">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{progress}% Uploaded</p>
                </div>
              </>
            ) : (
              <>
                <Upload className="w-10 h-10 text-muted-foreground" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {dragActive ? 'Drop file here' : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Maximum file size: {maxSize}MB
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

interface FilePreviewProps {
  fileName: string;
  fileUrl: string;
  fileType: string;
  onDelete?: () => void;
  className?: string;
}

export function FilePreview({ fileName, fileUrl, fileType, onDelete, className }: FilePreviewProps) {
  const getFileIcon = () => {
    if (fileType.startsWith('image/')) {
      return <ImageIcon className="w-5 h-5" />;
    }
    if (fileType.startsWith('video/')) {
      return <Video className="w-5 h-5" />;
    }
    if (fileType === 'application/pdf' || fileType.includes('document')) {
      return <FileText className="w-5 h-5" />;
    }
    return <FileIcon className="w-5 h-5" />;
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border bg-card',
        className
      )}
    >
      <div className="flex-shrink-0 p-2 rounded bg-primary/10 text-primary">
        {getFileIcon()}
      </div>
      
      <div className="flex-1 min-w-0">
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium hover:text-primary truncate block"
        >
          {fileName}
        </a>
      </div>

      {onDelete && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="flex-shrink-0 h-8 w-8 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
