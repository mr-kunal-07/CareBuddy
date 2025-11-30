"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit2, HelpCircle, FileText, LogOut, ChevronRight, Loader, Clock, CheckCircle, Hourglass, ShieldCheck } from 'lucide-react';
import { calculateDashboardStats } from '@/utils/calculate';


// Utility: Get cookie value
const getCookie = (name) => {
    return document.cookie
        .split("; ")
        .find(row => row.startsWith(`${name}=`))
        ?.split("=")[1];
};

// Utility: Clear auth cookies
const clearAuthCookies = () => {
    ["promoter", "promoterName", "promoterEmail", "promoterDocId"].forEach(key => {
        document.cookie = `${key}=; path=/; max-age=0`;
    });
};

// Reusable Stat Card Component
function StatCard({ icon, label, value, color }) {
    const colorClasses = {
        blue: "from-blue-50 to-blue-100 text-blue-600 border-blue-200",
        green: "from-green-50 to-green-100 text-green-600 border-green-200",
        purple: "from-purple-50 to-purple-100 text-purple-600 border-purple-200",
        amber: "from-amber-50 to-amber-100 text-amber-600 border-amber-200",
    };

    return (
        <div className={`bg-gradient-to-br ${colorClasses[color]} border rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow duration-200`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1 sm:mb-2">{label}</p>
                    <p className="text-2xl sm:text-3xl font-bold">{value}</p>
                </div>
                <div className="opacity-80">{icon}</div>
            </div>
        </div>
    );
}

// Reusable Menu Item Component
const MenuItem = ({ icon: Icon, label, onClick, variant = 'default' }) => {
    const variants = {
        default: "hover:bg-slate-50 text-slate-900",
        primary: "hover:bg-blue-50 text-slate-900",
        danger: "hover:bg-red-50 text-red-600",
        disabled: "opacity-50 cursor-not-allowed text-slate-400"
    };

    const iconColor = variant === 'danger' ? 'text-red-600' :
        variant === 'disabled' ? 'text-slate-400' : 'text-slate-600';

    return (
        <button
            onClick={onClick}
            disabled={variant === 'disabled'}
            className={`w-full flex items-center justify-between p-4 sm:p-6 transition ${variants[variant]}`}
        >
            <div className="flex items-center gap-3">
                <Icon size={20} className={iconColor} />
                <span className="text-sm sm:text-base font-medium">{label}</span>
            </div>
            <ChevronRight size={20} className={variant === 'danger' ? 'text-red-600' : 'text-slate-400'} />
        </button>
    );
};

// Reusable Header Component
const Header = ({ onBack, title }) => (
    <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center gap-2">
            <button onClick={onBack} className="text-slate-600 hover:text-slate-900 transition">
                <ArrowLeft size={24} />
            </button>
            <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
            <div className="w-6" />
        </div>
    </header>
);

const ProfilePage = () => {
    const router = useRouter();
    const [promoterInfo, setPromoterInfo] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch data from calculateDashboardStats
                const result = await calculateDashboardStats();

                if (result.error) {
                    setError("Failed to load profile data");
                    return;
                }

                setPromoterInfo(result.promoterInfo);
                setStats(result.stats);
            } catch (err) {
                console.error("Error fetching profile data:", err);
                setError("Failed to load profile");
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, []);

    const handleBack = () => {
        router.back();
    };

    const handleLogout = () => {
        localStorage.clear();
        clearAuthCookies();
        router.push("/login");
    };

    const handleHelpSupport = () => {
        router.push("/help-support");
    };

    const handleTermsConditions = () => {
        router.push("/terms-conditions");
    };

    // Loading State
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
                <div className="max-w-7xl mx-auto flex items-center justify-center h-96">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-500 mx-auto mb-4"></div>
                        <p className="text-gray-600 text-lg">Loading Pro...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Error State
    if (error || !promoterInfo || !stats) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
                <Header onBack={handleBack} title="Profile" />
                <div className="p-8 text-center flex items-center justify-center min-h-[calc(100vh-80px)]">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
                        <p className="text-red-700 font-semibold text-lg">⚠️ {error || 'Failed to load profile'}</p>
                        <p className="text-red-600 text-sm mt-2">Please login to view your profile</p>
                        <button
                            onClick={handleBack}
                            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Main Profile View
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
            <Header onBack={handleBack} title="Profile" />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {/* Profile Card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8 mb-8">
                    <div className="flex items-start gap-6 pb-6 border-b border-slate-100">
                        {promoterInfo.imageUrl ? (
                            <img
                                src={promoterInfo.imageUrl}
                                alt={promoterInfo.name}
                                className="w-20 h-20 rounded-lg object-cover ring-2 ring-blue-100"
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-3xl font-bold ring-2 ring-blue-100">
                                {promoterInfo.name.charAt(0)}
                            </div>
                        )}

                        <div className="flex-1">
                            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                                {promoterInfo.name}
                            </h2>
                            <p className="text-sm text-slate-500 mt-1">{promoterInfo.phone}</p>
                            <p className="text-xs text-slate-400 mt-1">ID: {promoterInfo.docId}</p>
                        </div>
                    </div>

                    {/* Email Section */}
                    <div className="pt-6">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Email</p>
                        <p className="text-slate-900 font-medium">{promoterInfo.email}</p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-8">
                    <StatCard
                        icon={<Clock className="w-6 h-6" />}
                        label="Active Campaigns"
                        value={stats.active}
                        color="blue"
                    />
                    <StatCard
                        icon={<CheckCircle className="w-6 h-6" />}
                        label="Completed"
                        value={stats.completed}
                        color="green"
                    />
                    <StatCard
                        icon={<Hourglass className="w-6 h-6" />}
                        label="Upcoming"
                        value={stats.upcoming}
                        color="amber"
                    />
                    <StatCard
                        icon={<ShieldCheck className="w-6 h-6" />}
                        label="Total Assigned"
                        value={stats.assigned}
                        color="purple"
                    />
                </div>

                {/* More Section */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200">
                        <h3 className="text-lg font-semibold text-slate-900">More</h3>
                    </div>

                    <div className="divide-y divide-slate-200">
                        <MenuItem
                            icon={HelpCircle}
                            label="Help and Support"
                            onClick={handleHelpSupport}
                            variant="primary"
                        />
                        <MenuItem
                            icon={FileText}
                            label="Terms & Conditions"
                            onClick={handleTermsConditions}
                            variant="default"
                        />
                        <MenuItem
                            icon={LogOut}
                            label="Logout"
                            onClick={handleLogout}
                            variant="danger"
                        />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ProfilePage;