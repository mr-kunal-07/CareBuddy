"use client";

import { useState, useEffect, useRef } from "react";
import { db } from "../../../../firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { ArrowLeftIcon } from "lucide-react";

export default function UserLogin() {
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [timer, setTimer] = useState(0);
    const [sessionId, setSessionId] = useState("");
    const [userData, setUserData] = useState(null);
    const otpInputs = useRef([]);

    // Auto OTP read via SMS OTP API
    useEffect(() => {
        if (!otpSent) return;

        const abortController = new AbortController();

        if (navigator.credentials && navigator.credentials.get) {
            navigator.credentials
                .get({
                    otp: { transport: ["sms"] },
                    signal: abortController.signal,
                })
                .then((credential) => {
                    if (credential && credential.code) {
                        const otpCode = credential.code.replace(/\D/g, "").slice(0, 6);
                        const otpArray = otpCode.split("");
                        setOtp(otpArray);

                        setTimeout(() => verifyOTPAuto(otpCode), 200);
                    }
                })
                .catch(() => { });
        }

        return () => abortController.abort();
    }, [otpSent, sessionId]);

    // Timer
    useEffect(() => {
        if (timer > 0) {
            const interval = setTimeout(() => setTimer(timer - 1), 1000);
            return () => clearTimeout(interval);
        }
    }, [timer]);


    // ⭐ UPDATED FLOW — Create user if not exists (NO name/email)
    const sendOTP = async () => {
        setError("");

        if (phone.length !== 10) {
            setError("Enter valid 10-digit phone number");
            return;
        }

        try {
            setLoading(true);

            // Check if user exists
            const q = query(collection(db, "users"), where("phone", "==", phone));
            const querySnapshot = await getDocs(q);

            let userDoc = null;

            if (querySnapshot.empty) {
                // Create new user with ONLY phone
                const newDoc = await addDoc(collection(db, "users"), {
                    phone: phone,
                    createdAt: serverTimestamp(),
                });

                userDoc = { docId: newDoc.id, phone };
                setUserData(userDoc);

            } else {
                const data = querySnapshot.docs[0].data();
                const docId = querySnapshot.docs[0].id;
                userDoc = { ...data, docId };
                setUserData(userDoc);
            }

            // Send OTP (only phone + userId)
            const response = await fetch("/api/auth/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phoneNumber: phone,
                    userId: userDoc.docId,
                }),
            });

            const result = await response.json();

            if (!result.success) {
                setError(result.error || "Failed to send OTP");
                setLoading(false);
                return;
            }

            setSessionId(result.sessionId);
            setOtpSent(true);
            setTimer(60);
            setOtp(["", "", "", "", "", ""]);
            setTimeout(() => otpInputs.current[0]?.focus(), 100);

        } catch (err) {
            setError(err.message || "Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };


    // OTP input
    const handleOtpChange = (e, index) => {
        const value = e.target.value.replace(/\D/g, "").slice(0, 1);

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 5) otpInputs.current[index + 1]?.focus();

        if (index === 5 && newOtp.every(o => o)) {
            setTimeout(() => verifyOTPAuto(newOtp.join("")), 100);
        }
    };

    const handleOtpKeyDown = (e, index) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            otpInputs.current[index - 1]?.focus();
        }
    };


    // Verify OTP
    const verifyOTPAuto = async (otpCode) => {
        setError("");

        try {
            setLoading(true);

            const response = await fetch("/api/auth/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId, otp: otpCode }),
            });

            const result = await response.json();

            if (!result.success) {
                setError(result.error || "Invalid OTP");
                setLoading(false);
                return;
            }

            // Save minimal cookie
            document.cookie = `userPhone=${phone}; path=/; max-age=86400`;
            document.cookie = `userDocId=${userData.docId}; path=/; max-age=86400`;

            window.location.href = "/dashboard";

        } catch (err) {
            setError(err.message || "Verification failed");
        } finally {
            setLoading(false);
        }
    };

    const verifyOTP = async () => {
        const otpCode = otp.join("");
        if (otpCode.length < 4) {
            setError("Enter valid OTP");
            return;
        }
        await verifyOTPAuto(otpCode);
    };

    const handleBack = () => {
        setOtp(["", "", "", "", "", ""]);
        setOtpSent(false);
        setSessionId("");
        setUserData(null);
        setError("");
        setTimer(0);
    };

    // PHONE NUMBER SCREEN
    if (!otpSent) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iIzEwQjk4MSIgc3Ryb2tlLXdpZHRoPSIuNSIgb3BhY2l0eT0iLjEiLz48L2c+PC9zdmc+')] opacity-30"></div>

                <div className="relative w-full max-w-md">
                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-green-400 rounded-3xl blur-lg opacity-20"></div>

                    <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-emerald-100/50 overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-green-400"></div>

                        <div className="px-8 pt-10 pb-6">
                            <div className="flex justify-center mb-6">
                                <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                            </div>

                            <h1 className="text-3xl font-bold text-gray-900 text-center mb-2 tracking-tight">Welcome Back</h1>
                            <p className="text-center text-gray-500 text-sm font-medium">Sign in to continue to your account</p>
                        </div>

                        <div className="px-8 pb-10">
                            {error && (
                                <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-700 p-4 rounded-2xl mb-6 text-sm font-medium flex items-start gap-3 animate-in slide-in-from-top duration-300">
                                    <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-3">Phone Number</label>
                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        <div className="relative flex items-center border-2 border-gray-200 rounded-2xl overflow-hidden bg-white transition-all duration-300 focus-within:border-emerald-400 focus-within:shadow-lg focus-within:shadow-emerald-100">
                                            <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-50 to-teal-50 border-r-2 border-gray-200">
                                                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                </svg>
                                                <span className="text-gray-700 font-bold text-sm">+91</span>
                                            </div>
                                            <input
                                                type="tel"
                                                inputMode="numeric"
                                                maxLength="10"
                                                className="flex-1 px-4 py-4 outline-none bg-transparent text-gray-900 placeholder-gray-400 font-semibold text-base"
                                                placeholder="Enter 10 digit number"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between">
                                        <p className="text-xs text-gray-500 font-medium">
                                            <span className={phone.length === 10 ? "text-green-600 font-bold" : "text-gray-500"}>
                                                {phone.length}
                                            </span>
                                            <span className="text-gray-400">/10 digits</span>
                                        </p>
                                        {phone.length === 10 && (
                                            <div className="flex items-center gap-1 text-green-600 text-xs font-bold animate-in fade-in duration-300">
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                <span>Valid</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={sendOTP}
                                    disabled={loading || phone.length !== 10}
                                    className="relative w-full group overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-teal-500 to-green-500 rounded-2xl transition-all duration-300 group-hover:scale-105"></div>
                                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-600 to-green-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <div className="relative flex items-center justify-center gap-2 py-4 text-white font-bold text-base disabled:opacity-50 transition-opacity">
                                        {loading ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <span>Sending OTP...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Send OTP</span>
                                                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                </svg>
                                            </>
                                        )}
                                    </div>
                                </button>

                                <p className="text-center text-xs text-gray-500 mt-4">
                                    By continuing, you agree to our{' '}
                                    <a href="#" className="text-emerald-600 hover:text-emerald-700 font-semibold hover:underline">Terms of Service</a>
                                    {' '}and{' '}
                                    <a href="#" className="text-emerald-600 hover:text-emerald-700 font-semibold hover:underline">Privacy Policy</a>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // OTP SCREEN
    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iIzEwQjk4MSIgc3Ryb2tlLXdpZHRoPSIuNSIgb3BhY2l0eT0iLjEiLz48L2c+PC9zdmc+')] opacity-30"></div>

            <div className="relative w-full max-w-md">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-green-400 rounded-3xl blur-lg opacity-20"></div>

                <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-emerald-100/50 overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-green-400"></div>

                    <div className="px-6 sm:px-8 pt-10 pb-6">
                        <div className="flex justify-center mb-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                        </div>

                        <h1 className="text-3xl font-bold text-gray-900 text-center mb-2 tracking-tight">Verify OTP</h1>
                        <p className="text-center text-gray-500 text-sm font-medium">
                            Code sent to <span className="font-bold text-emerald-600">+91 {phone}</span>
                        </p>
                    </div>

                    <div className="px-6 sm:px-8 pb-10">
                        {error && (
                            <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-700 p-4 rounded-2xl mb-6 text-sm font-medium flex items-start gap-3 animate-in slide-in-from-top duration-300">
                                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-black mb-4 text-center">Enter 6-Digit Code</label>
                                <div className="flex gap-2 justify-center">
                                    {otp.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={(el) => otpInputs.current[index] = el}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength="1"
                                            className="w-11 h-14 text-gray-900 sm:w-12 sm:h-16 text-center text-2xl sm:text-3xl font-bold border-2 border-gray-200 rounded-xl outline-none bg-white transition-all duration-300 focus:border-emerald-400 focus:shadow-lg focus:shadow-emerald-100 focus:scale-105 disabled:opacity-50"
                                            value={digit}
                                            onChange={(e) => handleOtpChange(e, index)}
                                            onKeyDown={(e) => handleOtpKeyDown(e, index)}
                                            disabled={loading}
                                        />
                                    ))}
                                </div>
                                <div className="mt-4 flex items-center justify-center gap-2">
                                    {otp.filter(d => d).length === 6 && (
                                        <div className="flex items-center gap-1 text-green-600 text-xs font-bold animate-in fade-in duration-300">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            <span>Complete</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={verifyOTP}
                                disabled={loading || otp.filter(d => d).length !== 6}
                                className="relative w-full group overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-teal-500 to-green-500 rounded-2xl transition-all duration-300 group-hover:scale-105"></div>
                                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-600 to-green-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <div className="relative flex items-center justify-center gap-2 py-4 text-white font-bold text-base disabled:opacity-50 transition-opacity">
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span>Verifying...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Verify OTP</span>
                                            <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        </>
                                    )}
                                </div>
                            </button>

                            <div className="text-center">
                                {timer > 0 ? (
                                    <div className="flex items-center justify-center gap-2 text-gray-600">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="text-sm font-medium">Resend code in <span className="font-bold text-emerald-600">{timer}s</span></p>
                                    </div>
                                ) : (
                                    <button
                                        onClick={sendOTP}
                                        className="text-emerald-600 font-bold text-sm hover:text-emerald-700 transition-colors hover:underline inline-flex items-center gap-1 group"
                                    >
                                        <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Resend OTP
                                    </button>
                                )}
                            </div>

                            <button
                                onClick={handleBack}
                                className="w-full border-2 border-gray-200 text-gray-700 font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all duration-300 group"
                            >
                                <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                <span>Back to Login</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
