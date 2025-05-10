import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Button, Typography, CircularProgress, Alert, LinearProgress } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import audioProcessor from '../utils/audioProcessor';

const FileUpload = ({ onUploadComplete }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState('');
  const [fileInfo, setFileInfo] = useState(null);
  const [queueInfo, setQueueInfo] = useState(null);
  const [queueCheckInterval, setQueueCheckInterval] = useState(null);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (queueCheckInterval) {
        clearInterval(queueCheckInterval);
      }
    };
  }, [queueCheckInterval]);

  const checkQueueStatus = useCallback(async (queueId) => {
    try {
      const response = await fetch(`/api/queue-status?id=${queueId}`);
      if (!response.ok) {
        throw new Error('Failed to check queue status');
      }
      
      const data = await response.json();
      
      if (data.status === 'processing') {
        setProcessingStage(`Processing file... (${data.progress || 0}%)`);
        setProgress(data.progress || 0);
      } else if (data.status === 'queued') {
        setProcessingStage(`In queue (position ${data.position})`);
        setProgress(0);
      } else if (data.status === 'completed') {
        // Clear interval and handle completion
        if (queueCheckInterval) {
          clearInterval(queueCheckInterval);
          setQueueCheckInterval(null);
        }
        
        onUploadComplete(data.result);
        setIsProcessing(false);
        setQueueInfo(null);
      }
    } catch (error) {
      console.error('Error checking queue status:', error);
    }
  }, [onUploadComplete, queueCheckInterval]);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      setError(null);
      setProgress(0);
      setProcessingStage('Processing audio...');
      setFileInfo({
        originalSize: Math.round(file.size / (1024 * 1024)),
        name: file.name
      });

      // Process the file with progress updates
      console.log(`[FileUpload] Starting file processing... Original size: ${Math.round(file.size / (1024 * 1024))}MB`);
      const processedBlob = await audioProcessor.processAudio(file, (progress) => {
        setProgress(progress);
      });
      
      console.log(`[FileUpload] Processing complete. Compressed size: ${Math.round(processedBlob.size / (1024 * 1024))}MB`);
      
      // Check if the processed file is still too large
      if (processedBlob.size > 50 * 1024 * 1024) {
        throw new Error(`File is still too large (${Math.round(processedBlob.size / (1024 * 1024))}MB) after compression. Maximum size is 50MB.`);
      }
      
      setProcessingStage('Uploading to server...');
      setProgress(0);

      // Create form data with the processed blob
      const formData = new FormData();
      formData.append('audioFile', processedBlob, 'processed_audio.mp3');
      
      // Add options to the form data
      const options = {
        style: 'detailed',
        language: 'he',
        outputType: 'summary'
      };
      formData.append('options', JSON.stringify(options));

      // Upload to server with progress tracking
      console.log('[FileUpload] Uploading processed file...');
      
      // Use fetch for better control over the response
      const response = await fetch('/api/process-audio', {
        method: 'POST',
        body: formData,
        headers: {
          // No Content-Type header as it's set by the FormData
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.lengthComputable) {
            const uploadProgress = (progressEvent.loaded / progressEvent.total) * 100;
            setProgress(uploadProgress);
          }
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Upload failed with status ${response.status}`);
      }
      
      const result = await response.json();
      
      // Check if the file is queued
      if (result.status === 'queued') {
        setQueueInfo(result);
        setProcessingStage(`In queue (position ${result.position})`);
        
        // Set up polling to check queue status
        const intervalId = setInterval(() => {
          checkQueueStatus(result.id);
        }, 5000); // Check every 5 seconds
        
        setQueueCheckInterval(intervalId);
      } else {
        // File was processed immediately
        console.log('[FileUpload] Upload complete');
        
        // Clean up
        await audioProcessor.cleanup();
        
        // Notify parent component
        onUploadComplete(result);
        setIsProcessing(false);
      }
    } catch (err) {
      console.error('[FileUpload] Error:', err);
      setError(err.message || 'Failed to process file');
      setIsProcessing(false);
    }
  }, [onUploadComplete, checkQueueStatus]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/mp4': ['.mp4'],
      'video/quicktime': ['.mov'],
      'audio/mpeg': ['.mp3'],
      'audio/wav': ['.wav'],
      'audio/mp4': ['.m4a']
    },
    maxFiles: 1,
    disabled: isProcessing
  });

  return (
    <Box sx={{ width: '100%', maxWidth: 600, mx: 'auto', p: 3 }}>
      <Box
        {...getRootProps()}
        sx={{
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          borderRadius: 2,
          p: 3,
          textAlign: 'center',
          cursor: isProcessing ? 'default' : 'pointer',
          bgcolor: isDragActive ? 'action.hover' : 'background.paper',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'action.hover'
          }
        }}
      >
        <input {...getInputProps()} />
        <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {isProcessing ? processingStage : 'Drag & Drop or Click to Upload'}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {isProcessing 
            ? queueInfo 
              ? `Your file is in queue for processing (position ${queueInfo.position})`
              : fileInfo 
                ? `Processing ${fileInfo.name} (${fileInfo.originalSize}MB)...` 
                : 'Please wait while we process your file...'
            : 'Supported formats: MP4, MOV, MP3, WAV, M4A (Max 1GB)'}
        </Typography>
        
        {isProcessing && (
          <Box sx={{ mt: 2, width: '100%' }}>
            <LinearProgress 
              variant={queueInfo ? "indeterminate" : "determinate"} 
              value={progress} 
            />
            {!queueInfo && (
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                {Math.round(progress)}%
              </Typography>
            )}
          </Box>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default FileUpload; 