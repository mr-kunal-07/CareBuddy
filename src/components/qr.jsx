"use client";
import React, { useRef, useState, useEffect } from 'react';
import { QrCode, X, Loader, Camera } from 'lucide-react';
import jsQR from 'jsqr';

export default function QRScannerPayment() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [isScanning, setIsScanning] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const [status, setStatus] = useState('');
    const streamRef = useRef(null);
    const animationFrameRef = useRef(null);

    const stopCamera = () => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setIsScanning(false);
        setStatus('');
    };

    const startCamera = async () => {
        try {
            setError('');
            setStatus('Requesting camera access...');

            // Check if running on HTTPS or localhost
            const isSecure = window.location.protocol === 'https:' ||
                window.location.hostname === 'localhost' ||
                window.location.hostname === '127.0.0.1';

            if (!isSecure) {
                setError('Camera requires HTTPS or localhost. Please use a secure connection.');
                setStatus('');
                return;
            }

            // Check if mediaDevices is available
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setError('Your browser does not support camera access. Please use Chrome, Firefox, or Safari.');
                setStatus('');
                return;
            }

            // Request camera permission with environment (back) camera
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { ideal: 'environment' },
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });

            streamRef.current = stream;
            setStatus('Camera ready...');

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.setAttribute('playsinline', 'true');

                // Wait for video to be ready
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current.play().then(() => {
                        setStatus('Scanning for QR code...');
                        setIsScanning(true);
                        scanQRCode();
                    }).catch(err => {
                        console.error('Play error:', err);
                        setError('Failed to start video playback');
                        stopCamera();
                    });
                };
            }
        } catch (err) {
            console.error('Camera error:', err);

            let errorMessage = 'Failed to access camera. ';

            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                errorMessage += 'Please allow camera permissions in your browser settings.';
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                errorMessage += 'No camera found on this device.';
            } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                errorMessage += 'Camera is already in use by another application.';
            } else if (err.name === 'OverconstrainedError') {
                errorMessage += 'Camera does not meet requirements. Trying again...';
                // Fallback to any camera
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({
                        video: true,
                        audio: false
                    });
                    streamRef.current = stream;
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        videoRef.current.play();
                        setIsScanning(true);
                        scanQRCode();
                        return;
                    }
                } catch (fallbackErr) {
                    errorMessage += ' Fallback also failed.';
                }
            } else if (err.name === 'SecurityError') {
                errorMessage += 'Camera access blocked due to security settings.';
            } else {
                errorMessage += err.message || 'Unknown error occurred.';
            }

            setError(errorMessage);
            setStatus('');
            setIsScanning(false);
        }
    };

    const scanQRCode = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!video || !canvas) {
            console.error('Missing video or canvas element');
            return;
        }

        const context = canvas.getContext('2d', { willReadFrequently: true });

        const tick = () => {
            if (!isScanning || !streamRef.current) {
                return;
            }

            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                // Set canvas size to match video
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                // Draw current video frame to canvas
                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                // Get image data
                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

                // Scan for QR code using jsQR
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "dontInvert",
                });

                if (code && code.data) {
                    console.log('QR Code detected:', code.data);
                    handleQRScanned(code.data);
                    return;
                }
            }

            // Continue scanning
            animationFrameRef.current = requestAnimationFrame(tick);
        };

        tick();
    };

    const handleQRScanned = (qrData) => {
        stopCamera();
        setIsProcessing(true);
        setStatus('QR Code detected! Opening payment...');

        setTimeout(() => {
            initiatePayment(qrData);
        }, 500);
    };

    const initiatePayment = (qrData) => {
        try {
            let paymentUrl = qrData.trim();
            console.log('Processing QR data:', paymentUrl);

            // Handle different UPI QR code formats
            if (paymentUrl.startsWith('upi://pay')) {
                // Already in correct UPI format
                window.location.href = paymentUrl;
            } else if (paymentUrl.includes('pa=') && paymentUrl.includes('pn=')) {
                // UPI parameters without upi:// prefix
                window.location.href = 'upi://pay?' + paymentUrl;
            } else if (paymentUrl.includes('@')) {
                // UPI ID format (e.g., merchant@paytm)
                const upiId = paymentUrl.split('?')[0];
                window.location.href = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=Merchant&cu=INR`;
            } else if (paymentUrl.startsWith('http://') || paymentUrl.startsWith('https://')) {
                // HTTP URL - open directly
                window.location.href = paymentUrl;
            } else {
                // Try as UPI ID
                window.location.href = `upi://pay?pa=${encodeURIComponent(paymentUrl)}&pn=Merchant&cu=INR`;
            }

            // Reset after delay
            setTimeout(() => {
                setIsProcessing(false);
                setStatus('');
            }, 3000);

        } catch (err) {
            console.error('Payment error:', err);
            setError('Failed to open payment app. The QR code might be invalid.');
            setIsProcessing(false);
            setStatus('');
        }
    };

    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    // Main button when not scanning
    if (!isScanning) {
        return (
            <div className="flex flex-col items-center gap-4 p-8">
                <div className="text-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">UPI QR Scanner</h2>
                    <p className="text-gray-600 text-sm">Scan any UPI QR code to make payment</p>
                </div>

                <button
                    onClick={startCamera}
                    disabled={isProcessing}
                    className="flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Camera className="w-6 h-6" />
                    <span className="font-semibold text-lg">Scan QR Code</span>
                </button>

                {error && (
                    <div className="p-4 bg-red-100 border border-red-300 rounded-lg max-w-md">
                        <p className="text-red-700 text-sm font-medium">❌ {error}</p>
                        {error.includes('HTTPS') && (
                            <p className="text-red-600 text-xs mt-2">
                                💡 Make sure you're accessing via HTTPS or localhost
                            </p>
                        )}
                        {error.includes('permissions') && (
                            <p className="text-red-600 text-xs mt-2">
                                💡 Click the camera icon in your browser's address bar to allow access
                            </p>
                        )}
                    </div>
                )}

                <div className="text-center text-gray-500 text-xs mt-4 max-w-md">
                    <p>✓ Works with Google Pay, PhonePe, Paytm & all UPI apps</p>
                    <p className="mt-1">✓ Secure and instant payment</p>
                </div>
            </div>
        );
    }

    // Scanner overlay
    return (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
            <div className="relative w-full h-full max-w-2xl">
                {/* Video feed */}
                <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    autoPlay
                    muted
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Scanning overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {/* Darkened edges */}
                    <div className="absolute inset-0 bg-black opacity-50" />

                    {/* Scanning frame */}
                    <div className="relative z-10 w-72 h-72">
                        <div className="absolute inset-0 border-2 border-green-400 rounded-2xl bg-transparent"
                            style={{
                                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                                clipPath: 'inset(0 0 0 0 round 1rem)'
                            }}>
                            {/* Corner markers */}
                            <div className="absolute -top-1 -left-1 w-10 h-10 border-t-4 border-l-4 border-white rounded-tl-2xl" />
                            <div className="absolute -top-1 -right-1 w-10 h-10 border-t-4 border-r-4 border-white rounded-tr-2xl" />
                            <div className="absolute -bottom-1 -left-1 w-10 h-10 border-b-4 border-l-4 border-white rounded-bl-2xl" />
                            <div className="absolute -bottom-1 -right-1 w-10 h-10 border-b-4 border-r-4 border-white rounded-br-2xl" />

                            {/* Scanning line */}
                            <div className="absolute inset-x-0 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent animate-pulse" />
                        </div>
                    </div>

                    {/* Status text */}
                    <div className="relative z-10 mt-8 text-center">
                        <p className="text-white text-xl font-semibold">{status}</p>
                        <p className="text-gray-300 text-sm mt-2">
                            Position the QR code inside the frame
                        </p>
                    </div>

                    {/* Processing indicator */}
                    {isProcessing && (
                        <div className="relative z-10 mt-4 flex items-center gap-3 bg-green-500 text-white px-6 py-3 rounded-full">
                            <Loader className="w-5 h-5 animate-spin" />
                            <span className="font-medium">Opening payment app...</span>
                        </div>
                    )}
                </div>

                {/* Close button */}
                <button
                    onClick={stopCamera}
                    className="absolute top-6 right-6 z-20 bg-red-500 hover:bg-red-600 text-white rounded-full p-4 shadow-xl transition"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* QR icon indicator */}
                <div className="absolute top-6 left-6 z-20 bg-white bg-opacity-20 backdrop-blur-sm text-white rounded-full p-4">
                    <QrCode className="w-6 h-6" />
                </div>
            </div>
        </div>
    );
}