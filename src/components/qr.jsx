"use client";
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { QrCode, X, Loader } from 'lucide-react';

export default function QRScannerPayment() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [isScanning, setIsScanning] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const [cameraStatus, setCameraStatus] = useState('');
    const streamRef = useRef(null);
    const scanIntervalRef = useRef(null);

    // Load jsQR library dynamically from the installed npm package (client only)
    const jsqrRef = useRef(null);
    useEffect(() => {
        let cancelled = false;
        (async () => {
            if (typeof window === 'undefined') return; // only run on client
            try {
                const mod = await import('jsqr');
                if (!cancelled) {
                    // support both default export and named
                    jsqrRef.current = mod.default || mod;
                    // also set window.jsQR so older references still work
                    try { window.jsQR = jsqrRef.current; } catch (e) { /* noop */ }
                }
            } catch (err) {
                console.warn('Failed to dynamically import jsqr:', err);
            }
        })();

        return () => { cancelled = true; jsqrRef.current = null; };
    }, []);

    const stopCamera = useCallback(() => {
        setIsScanning(false);
        setCameraStatus('');

        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
            scanIntervalRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                try {
                    track.stop();
                } catch (err) {
                    console.error('Error stopping track:', err);
                }
            });
            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }, []);

    const startCamera = useCallback(async () => {
        try {
            setError('');
            setCameraStatus('Requesting camera access...');

            // Check if getUserMedia is supported
            const getUserMedia =
                navigator.mediaDevices?.getUserMedia ||
                navigator.getUserMedia ||
                navigator.webkitGetUserMedia ||
                navigator.mozGetUserMedia;

            if (!getUserMedia) {
                setError('Camera API not supported on this device');
                setCameraStatus('');
                return;
            }

            setIsScanning(true);

            // Try with simplified constraints first
            let stream = null;
            const constraintsList = [
                // Primary constraint - basic
                {
                    video: {
                        facingMode: 'environment'
                    },
                    audio: false
                },
                // Fallback - with dimensions
                {
                    video: {
                        facingMode: 'environment',
                        width: { ideal: 640 },
                        height: { ideal: 480 }
                    },
                    audio: false
                },
                // Last resort - any camera
                {
                    video: true,
                    audio: false
                }
            ];

            for (let constraints of constraintsList) {
                try {
                    if (navigator.mediaDevices?.getUserMedia) {
                        stream = await navigator.mediaDevices.getUserMedia(constraints);
                    } else if (navigator.getUserMedia) {
                        stream = await new Promise((resolve, reject) => {
                            navigator.getUserMedia(constraints, resolve, reject);
                        });
                    }
                    if (stream) break;
                } catch (err) {
                    console.log('Constraint failed, trying next...', err.message);
                }
            }

            if (!stream) {
                setError('Failed to access camera. Check permissions.');
                setIsScanning(false);
                setCameraStatus('');
                return;
            }

            streamRef.current = stream;
            setCameraStatus('Camera ready. Loading video...');

            if (videoRef.current) {
                videoRef.current.srcObject = stream;

                // iOS fix - force video element to render
                videoRef.current.setAttribute('playsinline', 'true');
                videoRef.current.setAttribute('webkit-playsinline', 'true');
                videoRef.current.muted = true;

                // Wait for metadata
                const metadataHandler = () => {
                    setCameraStatus('Starting scan...');
                    videoRef.current.removeEventListener('loadedmetadata', metadataHandler);

                    videoRef.current.play().then(() => {
                        setCameraStatus('');
                        scanQRCode();
                    }).catch(err => {
                        console.error('Play error:', err);
                        setError('Failed to play video stream');
                        stopCamera();
                    });
                };

                videoRef.current.addEventListener('loadedmetadata', metadataHandler);

                // Timeout if metadata doesn't load
                const timeout = setTimeout(() => {
                    if (videoRef.current?.readyState !== 2) {
                        setError('Camera feed timeout. Please try again.');
                        stopCamera();
                    }
                }, 8000);

                return () => clearTimeout(timeout);
            }
        } catch (err) {
            console.error('Camera error:', err);

            if (err.name === 'NotAllowedError' || err.code === 'PERMISSION_DENIED') {
                setError('❌ Camera permission denied. Please allow camera in settings.');
            } else if (err.name === 'NotFoundError' || err.code === 'DEVICE_NOT_FOUND') {
                setError('❌ No camera found on this device.');
            } else if (err.name === 'SecurityError') {
                setError('❌ Please use HTTPS to access the camera.');
            } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                setError('❌ Camera is in use by another app. Close it and try again.');
            } else {
                setError(`❌ Camera error: ${err.message || 'Unknown error'}`);
            }

            setIsScanning(false);
            setCameraStatus('');
        }
    }, []);

    const scanQRCode = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const video = videoRef.current;
        const context = canvas.getContext('2d');

        const updateCanvasSize = () => {
            if (video.videoWidth > 0 && video.videoHeight > 0) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                return true;
            }
            return false;
        };

        if (!updateCanvasSize()) {
            setTimeout(() => scanQRCode(), 500);
            return;
        }

        const scanInterval = setInterval(() => {
            if (!isScanning || !video.srcObject) {
                clearInterval(scanInterval);
                return;
            }

            try {
                if (video.readyState === video.HAVE_ENOUGH_DATA) {
                    context.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

                    // Use jsQR library if available
                    const scanLib = jsqrRef.current || window.jsQR;
                    if (scanLib) {
                        const code = scanLib(
                            imageData.data,
                            imageData.width,
                            imageData.height
                        );

                        if (code?.data) {
                            clearInterval(scanInterval);
                            handleQRScanned(code.data);
                        }
                    }
                }
            } catch (err) {
                console.error('Scan error:', err);
            }
        }, 300);

        scanIntervalRef.current = scanInterval;
    }, [isScanning]);

    const handleQRScanned = useCallback((qrData) => {
        stopCamera();
        setIsProcessing(true);
        setCameraStatus('QR Detected! Opening payment...');

        setTimeout(() => {
            initiateGooglePay(qrData);
        }, 500);
    }, [stopCamera]);

    // Run cleanup on unmount
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, [stopCamera]);

    const initiateGooglePay = (qrData) => {
        try {
            let paymentUrl = qrData.trim();

            // Handle different QR formats
            if (paymentUrl.startsWith('upi://')) {
                paymentUrl = paymentUrl;
            } else if (paymentUrl.startsWith('http://') || paymentUrl.startsWith('https://')) {
                paymentUrl = paymentUrl;
            } else if (paymentUrl.includes('@')) {
                paymentUrl = `upi://pay?pa=${encodeURIComponent(paymentUrl)}`;
            } else {
                paymentUrl = `upi://pay?pa=${encodeURIComponent(paymentUrl)}`;
            }

            // Open payment app
            window.location.href = paymentUrl;
            setIsProcessing(false);
        } catch (err) {
            setError('Failed to initiate payment. Invalid QR code.');
            setIsProcessing(false);
            console.error('Payment error:', err);
        }
    };

    const handleClose = useCallback((e) => {
        e?.preventDefault();
        e?.stopPropagation();
        stopCamera();
        setError('');
        setIsProcessing(false);
        setCameraStatus('');
    }, []);

    const handleButtonClick = useCallback((e) => {
        e?.preventDefault();
        e?.stopPropagation();
        startCamera();
    }, []);

    const handleButtonTouch = useCallback((e) => {
        e?.preventDefault();
        e?.stopPropagation();
        startCamera();
    }, []);

    // Icon button - only shows when not scanning
    if (!isScanning) {
        return (
            <button
                onClick={handleButtonClick}
                onTouchStart={handleButtonTouch}
                onTouchEnd={(e) => e?.preventDefault()}
                onMouseDown={(e) => e?.preventDefault()}
                disabled={isProcessing}
                className="inline-flex items-center justify-center p-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition duration-200 disabled:opacity-50 cursor-pointer touch-none border border-gray-300 ml-80 z-50 "
                title="Scan QR Code for Payment"
            >
                <div className="flex flex-col items-center space-y-1">
                    <QrCode className="w-14 h-14 text-gray-700" strokeWidth={1.5} />
                    <p className="text-sm font-semibold text-gray-700">Scan & Pay</p>
                </div>
            </button>
        );
    }

    // Scanner modal - shows when scanning
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="relative w-full max-w-sm">
                {/* Video Container */}
                <div className="relative w-full aspect-square bg-black rounded-2xl overflow-hidden shadow-2xl">
                    <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        playsInline
                        autoPlay
                        muted
                        webkit-playsinline="true"
                        style={{ WebkitPlaysinline: 'true' }}
                    />
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Scanning Frame Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-4/5 h-4/5 border-2 border-green-400 rounded-xl">
                            {/* Corner indicators */}
                            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-green-400" />
                            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-green-400" />
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-green-400" />
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-green-400" />
                        </div>
                    </div>

                    {/* Scanning indicator */}
                    <div className="absolute inset-x-0 top-1/2 h-0.5 bg-linear-to-r from-transparent via-green-400 to-transparent animate-pulse pointer-events-none" />

                    {/* Close button */}
                    <button
                        onClick={handleClose}
                        onTouchEnd={handleClose}
                        className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition duration-200 z-10 touch-none"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Instructions */}
                <div className="mt-4 text-center text-white">
                    <p className="text-sm font-medium">Position QR code within the frame</p>
                    <p className="text-xs text-gray-300 mt-1">Scanning will start automatically</p>
                    {cameraStatus && (
                        <p className="text-xs text-blue-300 mt-2 animate-pulse">{cameraStatus}</p>
                    )}
                </div>

                {/* Error message */}
                {error && (
                    <div className="mt-4 p-3 bg-red-500 bg-opacity-20 border border-red-400 rounded-lg">
                        <p className="text-red-200 text-sm">{error}</p>
                        {error.includes('HTTPS') && (
                            <p className="text-red-200 text-xs mt-2">Your site must be served over HTTPS or be localhost</p>
                        )}
                    </div>
                )}

                {/* Processing state */}
                {isProcessing && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-white">
                        <Loader className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Opening payment app...</span>
                    </div>
                )}
            </div>
        </div>
    );
}