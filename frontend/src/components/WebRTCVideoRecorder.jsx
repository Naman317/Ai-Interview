// frontend/src/components/WebRTCVideoRecorder.jsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

const WebRTCVideoRecorder = ({
    question,
    sessionId,
    onSubmit,
    maxDuration = 300 // 5 minutes default
}) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [hasPermission, setHasPermission] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [recordedVideoUrl, setRecordedVideoUrl] = useState(null);
    const [quality, setQuality] = useState('720p');

    const videoRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const streamRef = useRef(null);
    const chunksRef = useRef([]);
    const timerRef = useRef(null);

    // Quality presets
    const qualityPresets = {
        '480p': { width: 640, height: 480 },
        '720p': { width: 1280, height: 720 },
        '1080p': { width: 1920, height: 1080 }
    };

    useEffect(() => {
        return () => {
            // Cleanup on unmount
            stopCamera();
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    useEffect(() => {
        if (isRecording && !isPaused) {
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => {
                    if (prev >= maxDuration) {
                        handleStopRecording();
                        return prev;
                    }
                    return prev + 1;
                });
            }, 1000);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isRecording, isPaused]);

    const requestPermissions = async () => {
        try {
            const constraints = {
                video: qualityPresets[quality],
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }

            setHasPermission(true);
            toast.success('Camera and microphone ready!');
        } catch (error) {
            console.error('Permission error:', error);
            toast.error('Failed to access camera/microphone. Please grant permissions.');
            setHasPermission(false);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setHasPermission(false);
    };

    const startRecording = () => {
        if (!streamRef.current) {
            toast.error('Please enable camera first');
            return;
        }

        try {
            chunksRef.current = [];

            // Use appropriate codec
            const options = {
                mimeType: 'video/webm;codecs=vp9',
                videoBitsPerSecond: quality === '1080p' ? 2500000 : quality === '720p' ? 1500000 : 1000000
            };

            // Fallback to vp8 if vp9 not supported
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options.mimeType = 'video/webm;codecs=vp8';
            }

            mediaRecorderRef.current = new MediaRecorder(streamRef.current, options);

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = handleRecordingComplete;

            // Request data every 1 second for chunk-based recording
            mediaRecorderRef.current.start(1000);

            setIsRecording(true);
            setIsPaused(false);
            setRecordingTime(0);
            toast.success('Recording started 🎥');
        } catch (error) {
            console.error('Recording error:', error);
            toast.error('Failed to start recording');
        }
    };

    const pauseRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.pause();
            setIsPaused(true);
            toast.info('Recording paused');
        }
    };

    const resumeRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
            mediaRecorderRef.current.resume();
            setIsPaused(false);
            toast.info('Recording resumed');
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsPaused(false);
        }
    };

    const handleRecordingComplete = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
        toast.success('Recording complete! Review your video.');
    };

    const handleSubmit = async () => {
        if (!recordedVideoUrl) {
            toast.error('No recording to submit');
            return;
        }

        setIsUploading(true);

        try {
            const blob = new Blob(chunksRef.current, { type: 'video/webm' });
            const formData = new FormData();
            formData.append('video', blob, `video-${Date.now()}.webm`);
            formData.append('sessionId', sessionId);
            formData.append('question', question);
            formData.append('duration', recordingTime);

            // Upload with progress tracking
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const progress = Math.round((e.loaded / e.total) * 100);
                    setUploadProgress(progress);
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status === 200) {
                    toast.success('Video uploaded successfully!');
                    onSubmit({ videoUrl: recordedVideoUrl, duration: recordingTime });
                    handleReset();
                } else {
                    toast.error('Upload failed');
                }
                setIsUploading(false);
            });

            xhr.addEventListener('error', () => {
                toast.error('Upload failed');
                setIsUploading(false);
            });

            xhr.open('POST', `${import.meta.env.VITE_API_BASE_URL}/api/sessions/analyze-video`);

            const user = JSON.parse(localStorage.getItem('user'));
            if (user && user.token) {
                xhr.setRequestHeader('Authorization', `Bearer ${user.token}`);
            }

            xhr.send(formData);

        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to upload video');
            setIsUploading(false);
        }
    };

    const handleReset = () => {
        setRecordedVideoUrl(null);
        setRecordingTime(0);
        setUploadProgress(0);
        chunksRef.current = [];
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="space-y-6">
            {/* Video Preview */}
            <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
                {recordedVideoUrl ? (
                    <video
                        src={recordedVideoUrl}
                        controls
                        className="w-full h-full"
                    />
                ) : (
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full mirror"
                    />
                )}

                {/* Recording Indicator */}
                <AnimatePresence>
                    {isRecording && !isPaused && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute top-4 right-4 flex items-center gap-2 bg-red-600 px-4 py-2 rounded-full"
                        >
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                                className="w-3 h-3 bg-white rounded-full"
                            />
                            <span className="text-white font-bold">{formatTime(recordingTime)}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Paused Indicator */}
                {isPaused && (
                    <div className="absolute top-4 right-4 bg-yellow-600 px-4 py-2 rounded-full">
                        <span className="text-white font-bold">⏸ PAUSED</span>
                    </div>
                )}

                {/* No Permission Overlay */}
                {!hasPermission && !recordedVideoUrl && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-800/90">
                        <div className="text-center">
                            <p className="text-white text-lg mb-4">Camera access required</p>
                            <button
                                onClick={requestPermissions}
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold"
                            >
                                Enable Camera & Microphone
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Quality Selector */}
            {!isRecording && !recordedVideoUrl && hasPermission && (
                <div className="flex items-center gap-4">
                    <span className="text-slate-400">Quality:</span>
                    {Object.keys(qualityPresets).map((q) => (
                        <button
                            key={q}
                            onClick={() => setQuality(q)}
                            className={`px-4 py-2 rounded-lg font-medium transition ${quality === q
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                        >
                            {q}
                        </button>
                    ))}
                </div>
            )}

            {/* Controls */}
            <div className="flex gap-4">
                {!recordedVideoUrl ? (
                    <>
                        {!isRecording ? (
                            <button
                                onClick={startRecording}
                                disabled={!hasPermission}
                                className="flex-1 px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-black text-lg rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                🎥 Start Recording
                            </button>
                        ) : (
                            <>
                                {!isPaused ? (
                                    <button
                                        onClick={pauseRecording}
                                        className="flex-1 px-6 py-4 bg-yellow-600 hover:bg-yellow-700 text-white font-bold text-lg rounded-xl transition"
                                    >
                                        ⏸ Pause
                                    </button>
                                ) : (
                                    <button
                                        onClick={resumeRecording}
                                        className="flex-1 px-6 py-4 bg-green-600 hover:bg-green-700 text-white font-bold text-lg rounded-xl transition"
                                    >
                                        ▶ Resume
                                    </button>
                                )}
                                <button
                                    onClick={handleStopRecording}
                                    className="flex-1 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-xl transition"
                                >
                                    ⏹ Stop Recording
                                </button>
                            </>
                        )}
                    </>
                ) : (
                    <>
                        <button
                            onClick={handleReset}
                            disabled={isUploading}
                            className="flex-1 px-6 py-4 bg-slate-700 hover:bg-slate-600 text-white font-bold text-lg rounded-xl transition disabled:opacity-50"
                        >
                            🔄 Re-record
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isUploading}
                            className="flex-1 px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold text-lg rounded-xl transition disabled:opacity-50"
                        >
                            {isUploading ? `Uploading ${uploadProgress}%` : '✓ Submit Answer'}
                        </button>
                    </>
                )}
            </div>

            {/* Upload Progress */}
            {isUploading && (
                <div className="w-full bg-slate-700 rounded-full h-2">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        className="bg-green-600 h-2 rounded-full"
                    />
                </div>
            )}

            {/* Recording Info */}
            <div className="text-sm text-slate-400 text-center">
                {isRecording ? (
                    <p>Recording... Maximum duration: {formatTime(maxDuration)}</p>
                ) : recordedVideoUrl ? (
                    <p>Duration: {formatTime(recordingTime)} - Review your video before submitting</p>
                ) : (
                    <p>Click "Start Recording" when you're ready to answer</p>
                )}
            </div>
        </div>
    );
};

export default WebRTCVideoRecorder;
