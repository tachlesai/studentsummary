import React, { useState, useCallback } from 'react';
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
      const xhr = new XMLHttpRequest();
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const uploadProgress = (event.loaded / event.total) * 100;
          setProgress(uploadProgress);
        }
      };

      const uploadPromise = new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              reject(new Error(errorResponse.error || 'Upload failed'));
            } catch (e) {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        };
        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.open('POST', '/api/process-audio');
        xhr.send(formData);
      });

      const result = await uploadPromise;
      console.log('[FileUpload] Upload complete');
      
      // Clean up
      await audioProcessor.cleanup();
      
      // Notify parent component
      onUploadComplete(result);
    } catch (err) {
      console.error('[FileUpload] Error:', err);
      setError(err.message || 'Failed to process file');
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setProcessingStage('');
    }
  }, [onUploadComplete]);

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
            ? fileInfo ? `Processing ${fileInfo.name} (${fileInfo.originalSize}MB)...` 
            : 'Please wait while we process your file...'
            : 'Supported formats: MP4, MOV, MP3, WAV, M4A (Max 1GB)'}
        </Typography>
        
        {isProcessing && (
          <Box sx={{ mt: 2, width: '100%' }}>
            <LinearProgress variant="determinate" value={progress} />
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              {Math.round(progress)}%
            </Typography>
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