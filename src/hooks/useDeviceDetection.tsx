import { useState, useEffect } from 'react';
import { useIsMobile } from './use-mobile';

interface DeviceInfo {
  isIOS: boolean;
  isAndroid: boolean;
  isMobile: boolean;
  isTouch: boolean;
  supportsCamera: boolean;
  supportsMediaRecorder: boolean;
  preferredVideoFormat: string;
}

export function useDeviceDetection(): DeviceInfo {
  const isMobile = useIsMobile();
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isIOS: false,
    isAndroid: false,
    isMobile: false,
    isTouch: false,
    supportsCamera: false,
    supportsMediaRecorder: false,
    preferredVideoFormat: 'video/webm',
  });

  useEffect(() => {
    const detectDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const platform = navigator.platform?.toLowerCase() || '';
      
      // iOS Detection (including iPad on iOS 13+)
      const isIOS = /iphone|ipad|ipod/.test(userAgent) || 
                   (platform === 'macintel' && navigator.maxTouchPoints > 1);
      
      // Android Detection
      const isAndroid = /android/.test(userAgent);
      
      // Touch Support
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Camera Support
      const supportsCamera = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      
      // MediaRecorder Support
      const supportsMediaRecorder = typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported;
      
      // Preferred Video Format
      let preferredVideoFormat = 'video/webm';
      if (supportsMediaRecorder) {
        const formats = [
          'video/mp4; codecs="avc1.42E01E, mp4a.40.2"', // H.264 + AAC for iOS
          'video/webm; codecs="vp9, opus"',              // VP9 for modern browsers
          'video/webm; codecs="vp8, vorbis"',            // VP8 fallback
          'video/webm',                                   // Basic WebM
          'video/mp4'                                     // Basic MP4
        ];
        
        for (const format of formats) {
          if (MediaRecorder.isTypeSupported(format)) {
            preferredVideoFormat = format;
            break;
          }
        }
      }
      
      setDeviceInfo({
        isIOS,
        isAndroid,
        isMobile,
        isTouch,
        supportsCamera,
        supportsMediaRecorder: !!supportsMediaRecorder,
        preferredVideoFormat,
      });
    };

    detectDevice();
    
    // Re-detect on orientation change (mobile)
    const handleOrientationChange = () => {
      setTimeout(detectDevice, 100);
    };
    
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);
    
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, [isMobile]);

  return deviceInfo;
}

export default useDeviceDetection;