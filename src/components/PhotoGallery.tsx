'use client';

import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Image as ImageIcon, 
  X, 
  ChevronLeft, 
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface Photo {
  id: number;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

interface PhotoGalleryProps {
  photos: Photo[];
  onDelete?: (photoId: number) => void;
  canDelete?: boolean;
}

export function PhotoGallery({ photos, onDelete, canDelete = false }: PhotoGalleryProps) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [imageLoading, setImageLoading] = useState<Set<number>>(new Set());

  const openPhoto = (index: number) => {
    setSelectedPhotoIndex(index);
    setZoom(1);
  };

  const closePhoto = () => {
    setSelectedPhotoIndex(null);
    setZoom(1);
  };

  const goToPrevious = () => {
    if (selectedPhotoIndex !== null && selectedPhotoIndex > 0) {
      setSelectedPhotoIndex(selectedPhotoIndex - 1);
      setZoom(1);
    }
  };

  const goToNext = () => {
    if (selectedPhotoIndex !== null && selectedPhotoIndex < photos.length - 1) {
      setSelectedPhotoIndex(selectedPhotoIndex + 1);
      setZoom(1);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.5, 0.5));
  };

  const handleDownload = async (photo: Photo) => {
    try {
      const isInIframe = window.self !== window.top;
      
      if (isInIframe) {
        window.open(photo.fileUrl, '_blank');
      } else {
        const base64Data = photo.fileUrl.includes(',') ? photo.fileUrl.split(',')[1] : photo.fileUrl;
        const mimeType = photo.fileUrl.includes(';') ? photo.fileUrl.split(';')[0].split(':')[1] : 'image/jpeg';
        
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = photo.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading photo:', error);
      window.open(photo.fileUrl, '_blank');
    }
  };

  const handleImageError = (photoId: number, event: any) => {
    console.error('Image load error for photo:', photoId, event);
    setImageErrors(prev => new Set(prev).add(photoId));
    setImageLoading(prev => {
      const newSet = new Set(prev);
      newSet.delete(photoId);
      return newSet;
    });
  };

  const handleImageLoad = (photoId: number) => {
    setImageLoading(prev => {
      const newSet = new Set(prev);
      newSet.delete(photoId);
      return newSet;
    });
  };

  const handleImageLoadStart = (photoId: number) => {
    setImageLoading(prev => new Set(prev).add(photoId));
  };

  // Format image URL to ensure it's properly formatted
  const getImageSrc = (fileUrl: string) => {
    if (!fileUrl) {
      console.error('Empty fileUrl provided');
      return '';
    }

    // If it's a Supabase Storage URL (new system)
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      console.log('Using Supabase Storage URL');
      return fileUrl;
    }

    // If already a data URI with proper format (old system - base64)
    if (fileUrl.startsWith('data:image/')) {
      console.log('Using base64 data URI');
      return fileUrl;
    }
    
    // If it starts with data: but might be incomplete
    if (fileUrl.startsWith('data:')) {
      return fileUrl;
    }
    
    // If it looks like base64 data without the data URI prefix
    // Base64 typically contains alphanumeric, +, /, and = characters
    if (fileUrl.length > 100 && /^[A-Za-z0-9+/=]+$/.test(fileUrl.substring(0, 100))) {
      console.log('Adding data URI prefix to base64 string');
      return `data:image/jpeg;base64,${fileUrl}`;
    }
    
    console.warn('Unknown image format, returning as-is');
    return fileUrl;
  };

  if (photos.length === 0) {
    return (
      <div className="text-center py-8 bg-zinc-800/30 rounded-lg border border-zinc-700">
        <ImageIcon className="h-10 w-10 text-white/20 mx-auto mb-2" />
        <p className="text-white/60 text-sm">Aucune photo</p>
      </div>
    );
  }

  const selectedPhoto = selectedPhotoIndex !== null ? photos[selectedPhotoIndex] : null;

  return (
    <>
      {/* Compact Gallery Grid */}
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {photos.map((photo, index) => {
          const hasError = imageErrors.has(photo.id);
          const isLoading = imageLoading.has(photo.id);
          const imageSrc = getImageSrc(photo.fileUrl);
          
          // Check if image source is valid
          const isValidSrc = imageSrc && imageSrc.length > 0;
          
          return (
            <div
              key={photo.id}
              className="relative aspect-square rounded-lg overflow-hidden bg-zinc-800/50 border border-zinc-700 hover:border-primary/50 cursor-pointer group transition-all"
              onClick={() => !hasError && isValidSrc && openPhoto(index)}
            >
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/50 z-10">
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                </div>
              )}
              
              {!isValidSrc || hasError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/10 border border-red-500/30 p-2">
                  <AlertCircle className="h-8 w-8 text-red-400 mb-1" />
                  <p className="text-xs text-red-300 text-center">
                    {!isValidSrc ? 'Données manquantes' : 'Non disponible'}
                  </p>
                </div>
              ) : (
                <>
                  <img
                    src={imageSrc}
                    alt={photo.fileName}
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    onError={(e) => {
                      console.error('Failed to load image:', photo.id, photo.fileName);
                      console.error('Image src length:', imageSrc.length);
                      console.error('Image src preview:', imageSrc.substring(0, 200));
                      handleImageError(photo.id, e);
                    }}
                    onLoad={() => {
                      console.log('Successfully loaded image:', photo.id, photo.fileName);
                      handleImageLoad(photo.id);
                    }}
                    onLoadStart={() => handleImageLoadStart(photo.id)}
                    loading="lazy"
                  />
                  
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-white" />
                  </div>
                </>
              )}

              {/* Delete button */}
              {canDelete && onDelete && !hasError && isValidSrc && (
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 rounded z-20"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Supprimer cette photo ?')) {
                      onDelete(photo.id);
                    }
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Lightbox Dialog - Compact */}
      {selectedPhoto && selectedPhotoIndex !== null && !imageErrors.has(selectedPhoto.id) && (
        <Dialog open={selectedPhotoIndex !== null} onOpenChange={closePhoto}>
          <DialogContent className="max-w-6xl w-full h-[90vh] p-0 bg-zinc-950 border-2 border-zinc-800">
            <div className="relative w-full h-full flex flex-col">
              {/* Compact Header */}
              <div className="absolute top-0 left-0 right-0 z-20 bg-black/90 backdrop-blur-xl p-3 border-b border-zinc-800">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="font-bold text-white text-sm truncate">{selectedPhoto.fileName}</p>
                    <p className="text-xs text-white/60">
                      {new Date(selectedPhoto.uploadedAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/10 h-8 w-8"
                      onClick={() => handleDownload(selectedPhoto)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/10 h-8 w-8"
                      onClick={closePhoto}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Image Container */}
              <div className="flex-1 flex items-center justify-center overflow-hidden p-16 pt-20 pb-16">
                <img
                  src={getImageSrc(selectedPhoto.fileUrl)}
                  alt={selectedPhoto.fileName}
                  className="max-w-full max-h-full object-contain transition-transform"
                  style={{ transform: `scale(${zoom})` }}
                  onError={(e) => handleImageError(selectedPhoto.id, e)}
                />
              </div>

              {/* Controls Bottom */}
              <div className="absolute bottom-0 left-0 right-0 z-20 bg-black/90 backdrop-blur-xl p-3 border-t border-zinc-800">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/10 h-9 w-9"
                    onClick={goToPrevious}
                    disabled={selectedPhotoIndex === 0}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>

                  <div className="flex items-center gap-2 bg-zinc-900 rounded-lg px-4 py-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/10 h-7 w-7"
                      onClick={handleZoomOut}
                      disabled={zoom <= 0.5}
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-white text-sm font-bold w-14 text-center">
                      {Math.round(zoom * 100)}%
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/10 h-7 w-7"
                      onClick={handleZoomIn}
                      disabled={zoom >= 3}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/10 h-9 w-9"
                    onClick={goToNext}
                    disabled={selectedPhotoIndex === photos.length - 1}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>

                <div className="flex justify-center">
                  <div className="bg-primary/20 border border-primary/30 rounded-full px-3 py-1">
                    <p className="text-center text-white text-xs font-semibold">
                      {selectedPhotoIndex + 1} / {photos.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}