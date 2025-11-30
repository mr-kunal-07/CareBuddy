// components/CampaignsList.jsx

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, ArrowRight } from "lucide-react";
import { calculateDashboardStats } from "@/utils/calculate";

export default function CampaignsList() {
    const router = useRouter();
    const [campaigns, setCampaigns] = useState({
        active: [],
        completed: [],
        upcoming: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("active");
    const [promoterInfo, setPromoterInfo] = useState(null);

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        try {
            setLoading(true);
            const result = await calculateDashboardStats();

            if (result.error) {
                setError(result.error);
                return;
            }

            setCampaigns(result.campaigns);
            setPromoterInfo(result.promoterInfo);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        if (!date) return "N/A";
        return new Date(date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    const getCampaignsList = () => {
        const map = {
            active: campaigns.active,
            completed: campaigns.completed,
            upcoming: campaigns.upcoming,
        };
        return map[activeTab] || [];
    };

    const getStatusConfig = (status) => {
        const config = {
            ACTIVE: {
                badge: "bg-green-100 text-green-700",
                label: "Active",
                icon: "✅",
            },
            COMPLETED: {
                badge: "bg-gray-100 text-gray-700",
                label: "Completed",
                icon: "✔️",
            },
            UPCOMING: {
                badge: "bg-amber-100 text-amber-700",
                label: "Upcoming",
                icon: "⏳",
            },
        };
        return config[status] || {};
    };

    const handleStartCampaign = (campaignId) => {
        router.push(`/campaign/${campaignId}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
                <div className="max-w-7xl mx-auto flex items-center justify-center h-96">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-500 mx-auto mb-4"></div>
                        <p className="text-gray-600 text-lg">Loading campaigns...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
                <div className="max-w-7xl mx-auto flex items-center justify-center h-96">
                    <div className="text-center">
                        <p className="text-red-600 text-lg mb-4">Error: {error}</p>
                        <button
                            onClick={fetchCampaigns}
                            className="px-6 py-2 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const currentCampaigns = getCampaignsList();

    return (
        <div className="h-fit bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-2">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Campaigns
                    </h1>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 border-b border-gray-200">
                    {[
                        {
                            id: "active",
                            label: "Active",
                            count: campaigns.active.length,
                            icon: "✅",
                        },
                        {
                            id: "completed",
                            label: "Completed",
                            count: campaigns.completed.length,
                            icon: "✔️",
                        },
                        {
                            id: "upcoming",
                            label: "Upcoming",
                            count: campaigns.upcoming.length,
                            icon: "⏳",
                        },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`pb-3 px-4 font-semibold text-sm transition ${activeTab === tab.id
                                ? "text-gray-600 border-b-2 border-gray-600"
                                : "text-gray-600 hover:text-gray-900"
                                }`}
                        >
                            {tab.icon} {tab.label} ({tab.count})
                        </button>
                    ))}
                </div>

                {/* Campaigns Grid */}
                <div>
                    {currentCampaigns.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
                            <p className="text-gray-500 text-lg">
                                No {activeTab} campaigns found
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {currentCampaigns.map((campaign) => (
                                <div
                                    key={campaign.id}
                                    className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col"
                                >
                                    {/* Card Header */}
                                    <div className="p-6 border-b border-gray-100">
                                        <div className="flex justify-between items-start gap-3 mb-3">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-bold text-gray-900 line-clamp-2">
                                                    {campaign.name}
                                                </h3>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {campaign.objective}
                                                </p>
                                            </div>
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusConfig(campaign.status).badge}`}
                                            >
                                                {
                                                    getStatusConfig(
                                                        campaign.status
                                                    ).label
                                                }
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 line-clamp-2">
                                            {campaign.description}
                                        </p>
                                    </div>

                                    {/* Info Grid */}
                                    <div className="p-6 space-y-4 flex-1">
                                        {/* Row 1 */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-gray-50 p-3 rounded-lg">
                                                <p className="text-xs text-gray-500 font-semibold mb-1">
                                                    Category
                                                </p>
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {campaign.category}
                                                </p>
                                            </div>
                                            <div className="bg-gray-50 p-3 rounded-lg">
                                                <p className="text-xs text-gray-500 font-semibold mb-1">
                                                    Format
                                                </p>
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {campaign.format}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Row 2 */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                <p className="text-xs text-gray-600 font-semibold mb-1">
                                                    Budget
                                                </p>
                                                <p className="text-sm font-bold text-gray-700">
                                                    ₹{campaign.budget}
                                                </p>
                                            </div>
                                            <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                                                <p className="text-xs text-green-600 font-semibold mb-1">
                                                    Reward
                                                </p>
                                                <p className="text-sm font-bold text-green-700">
                                                    {campaign.reward}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Targets */}
                                        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-xs text-indigo-600 font-semibold mb-2">
                                                        Target Samplings
                                                    </p>
                                                    <p className="text-xl font-bold text-indigo-700">
                                                        {campaign.targetSamplings}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-indigo-600 font-semibold mb-2">
                                                        Target Scans
                                                    </p>
                                                    <p className="text-xl font-bold text-indigo-700">
                                                        {campaign.targetScans}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Dates */}
                                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                                            <div>
                                                <p className="text-xs text-gray-500 font-semibold mb-1 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    Start
                                                </p>
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {formatDate(
                                                        campaign.startDate
                                                    )}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 font-semibold mb-1 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    End
                                                </p>
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {formatDate(
                                                        campaign.endDate
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer Button */}
                                    <div className="p-6 border-t border-gray-100 bg-gray-50">
                                        <button
                                            onClick={() => handleStartCampaign(campaign.id)}
                                            className="w-full px-4 py-2 bg-linear-to-r from-gray-500 to-gray-600 text-white font-semibold rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-200 flex items-center justify-center gap-1.5"
                                        >
                                            Start Campaign
                                            <ArrowRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}