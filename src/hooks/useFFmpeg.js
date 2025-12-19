import { useState, useRef, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

/**
 * Custom hook for managing FFmpeg loading and instance
 * Handles lazy loading of FFmpeg WASM modules
 */
const useFFmpeg = () => {
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const ffmpegRef = useRef(new FFmpeg());

  const loadFFmpeg = useCallback(async (onProgress) => {
    const ffmpeg = ffmpegRef.current;

    if (ffmpegLoaded) {
      return ffmpeg;
    }

    if (loading) {
      // Wait for existing load to complete
      return new Promise((resolve) => {
        const checkLoaded = setInterval(() => {
          if (ffmpegLoaded) {
            clearInterval(checkLoaded);
            resolve(ffmpegRef.current);
          }
        }, 100);
      });
    }

    setLoading(true);

    try {
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

      if (onProgress) {
        onProgress(5);
      }

      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      setFfmpegLoaded(true);
      return ffmpeg;
    } catch (err) {
      console.error('FFmpeg load error:', err);
      throw new Error('FFmpeg 로딩에 실패했습니다. 페이지를 새로고침 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }, [ffmpegLoaded, loading]);

  const setProgressHandler = useCallback((handler) => {
    const ffmpeg = ffmpegRef.current;
    ffmpeg.on('progress', handler);
    return () => ffmpeg.off('progress', handler);
  }, []);

  return {
    ffmpeg: ffmpegRef.current,
    ffmpegLoaded,
    loading,
    loadFFmpeg,
    setProgressHandler
  };
};

export default useFFmpeg;
