import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Video, 
  File, 
  CheckCircle, 
  AlertCircle,
  Loader
} from 'lucide-react';
import { 
  uploadEventMedia, 
  validateFileType, 
  validateFileSize, 
  compressImage,
  UploadProgress 
} from '../firebase/storage';

interface MediaUploadProps {
  onUploadComplete: (urls: string[]) => void;
  onUploadError: (error: string) => void;
  eventId?: string;
  userId: string;
  maxFiles?: number;
  maxSizeMB?: number;
  allowedTypes?: string[];
  className?: string;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  url?: string;
  error?: string;
}

export const MediaUpload: React.FC<MediaUploadProps> = ({
  onUploadComplete,
  onUploadError,
  eventId = 'temp',
  userId,
  maxFiles = 5,
  maxSizeMB = 10,
  allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'],
  className = ''
}) => {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = useCallback(async (files: FileList) => {
    const fileArray = Array.from(files);
    
    // Validate file count
    if (fileArray.length > maxFiles) {
      onUploadError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate each file
    const validFiles: File[] = [];
    for (const file of fileArray) {
      if (!validateFileType(file, allowedTypes)) {
        onUploadError(`File type ${file.type} not allowed`);
        continue;
      }
      
      if (!validateFileSize(file, maxSizeMB)) {
        onUploadError(`File ${file.name} exceeds ${maxSizeMB}MB limit`);
        continue;
      }
      
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // Initialize uploading state
    const initialUploadingFiles: UploadingFile[] = validFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading'
    }));
    
    setUploadingFiles(initialUploadingFiles);

    try {
      // Compress images if needed
      const processedFiles = await Promise.all(
        validFiles.map(async (file) => {
          if (file.type.startsWith('image/') && file.size > 2 * 1024 * 1024) {
            return await compressImage(file);
          }
          return file;
        })
      );

      // Upload files
      const urls = await uploadEventMedia(
        processedFiles,
        eventId,
        userId,
        (fileIndex, progress) => {
          setUploadingFiles(prev => 
            prev.map((item, index) => 
              index === fileIndex 
                ? { ...item, progress: progress.progress }
                : item
            )
          );
        }
      );

      // Update status to completed
      setUploadingFiles(prev => 
        prev.map((item, index) => ({
          ...item,
          status: 'completed',
          url: urls[index],
          progress: 100
        }))
      );

      onUploadComplete(urls);
      
      // Clear after a delay
      setTimeout(() => {
        setUploadingFiles([]);
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadingFiles(prev => 
        prev.map(item => ({
          ...item,
          status: 'error',
          error: error instanceof Error ? error.message : 'Upload failed'
        }))
      );
      onUploadError('Upload failed. Please try again.');
    }
  }, [eventId, userId, maxFiles, maxSizeMB, allowedTypes, onUploadComplete, onUploadError]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const removeFile = (index: number) => {
    setUploadingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <ImageIcon className="h-5 w-5" />;
    if (file.type.startsWith('video/')) return <Video className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  const getStatusIcon = (status: UploadingFile['status']) => {
    switch (status) {
      case 'uploading':
        return <Loader className="h-4 w-4 animate-spin text-blue-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept={allowedTypes.join(',')}
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600 mb-1">
          Drop files here or click to browse
        </p>
        <p className="text-xs text-gray-500">
          Max {maxFiles} files, {maxSizeMB}MB each. Supports images and videos.
        </p>
      </div>

      {/* Uploading Files */}
      <AnimatePresence>
        {uploadingFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {uploadingFiles.map((uploadingFile, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white border border-gray-200 rounded-lg p-3"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {getFileIcon(uploadingFile.file)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {uploadingFile.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(uploadingFile.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    {getStatusIcon(uploadingFile.status)}
                    
                    {uploadingFile.status === 'uploading' && (
                      <span className="text-xs text-gray-600">
                        {Math.round(uploadingFile.progress)}%
                      </span>
                    )}
                    
                    {uploadingFile.status === 'error' && (
                      <button
                        onClick={() => removeFile(index)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                {uploadingFile.status === 'uploading' && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div
                        className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                        style={{ width: `${uploadingFile.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {uploadingFile.status === 'error' && uploadingFile.error && (
                  <p className="mt-1 text-xs text-red-600">
                    {uploadingFile.error}
                  </p>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};