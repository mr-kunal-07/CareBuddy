'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getCampaignById } from '@/utils/calculate';

export default function CampaignPage() {
    const params = useParams();
    const campaignId = params.id;

    const [campaign, setCampaign] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCampaign = async () => {
            try {
                setLoading(true);
                const result = await getCampaignById(campaignId);

                if (result.error) {
                    setError(result.error);
                    return;
                }

                setCampaign(result.campaign);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (campaignId) {
            fetchCampaign();
        }
    }, [campaignId]);

    const formatDate = (date) => {
        if (!date) return "N/A";
        return new Date(date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            ACTIVE: { bg: "bg-green-100", text: "text-green-700", label: "Active" },
            COMPLETED: { bg: "bg-gray-100", text: "text-gray-700", label: "Completed" },
            UPCOMING: { bg: "bg-amber-100", text: "text-amber-700", label: "Upcoming" },
        };
        return statusConfig[status] || { bg: "bg-gray-100", text: "text-gray-700", label: "Unknown" };
    };

    if (loading) {
        return (
            <div className='min-h-screen w-full bg-white'>
                <header className='bg-gray-50 shadow-sm px-3 py-4'>
                    <Link href='/dashboard' className='text-blue-600 hover:underline flex items-center'>
                        <ArrowLeft className='w-4 h-4 mr-1' />
                        Back to Dashboard
                    </Link>
                </header>
                <main className='text-black font-[Poppins] flex items-center justify-center h-screen'>
                    <div className='text-center'>
                        <Loader className='w-12 h-12 animate-spin text-gray-500 mx-auto mb-4' />
                        <p className='text-gray-600 text-lg'>Loading campaign details...</p>
                    </div>
                </main>
            </div>
        );
    }

    if (error) {
        return (
            <div className='min-h-screen w-full bg-white'>
                <header className='bg-gray-50 shadow-sm px-3 py-4'>
                    <Link href='/dashboard' className='text-blue-600 hover:underline flex items-center'>
                        <ArrowLeft className='w-4 h-4 mr-1' />
                        Back to Dashboard
                    </Link>
                </header>
                <main className='text-black font-[Poppins] flex items-center justify-center h-screen'>
                    <div className='text-center'>
                        <p className='text-red-600 text-lg mb-4'>Error: {error}</p>
                        <Link href='/dashboard'>
                            <button className='px-6 py-2 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition'>
                                Go Back
                            </button>
                        </Link>
                    </div>
                </main>
            </div>
        );
    }

    const statusConfig = getStatusBadge(campaign?.status);
    const totalProducts = campaign?.targetSamplings || 0;
    const totalDistributed = campaign?.targetScans || 0;
    const totalRemaining = Math.max(totalProducts - totalDistributed);

    return (
        <div className='min-h-screen w-full bg-white'>
            <header className='bg-gray-50 shadow-sm px-3 py-4'>
                <Link href='/dashboard' className='text-blue-600 hover:underline flex items-center'>
                    <ArrowLeft className='w-4 h-4 mr-1' />
                    Back to Dashboard
                </Link>
            </header>
            <main className='text-black font-[Poppins]'>
                {/* Campaign Header */}
                <div className='bg-gradient-to-r from-blue-50 to-indigo-50 px-6  border-b border-gray-200'>
                    <div className='flex justify-between items-start py-3'>
                        <div>
                            <h1 className='text-xl font-bold text-gray-900 '>
                                {campaign?.name}
                            </h1>
                        </div>
                        <span className={`${statusConfig.bg} ${statusConfig.text} px-4 py-2 rounded-full text-sm font-semibold`}>
                            {statusConfig.label}
                        </span>
                    </div>
                </div>

                {/* Key Stats Cards */}
                <div className='px-6 py-8'>
                    <div className='grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
                        {/* Total Products */}
                        <div className='bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition'>
                            <p className='text-gray-600 text-sm font-semibold mb-2'>Total Products</p>
                            <p className='text-4xl font-bold text-gray-900'>{totalProducts}</p>
                            <p className='text-xs text-gray-500 mt-2'>Target Samplings</p>
                        </div>

                        {/* Total Distributed */}
                        <div className='bg-white border-2 border-green-200 rounded-xl p-6 hover:shadow-lg transition bg-green-50'>
                            <p className='text-green-600 text-sm font-semibold mb-2'>Total Distributed</p>
                            <p className='text-4xl font-bold text-green-700'>{totalDistributed}</p>
                            <p className='text-xs text-green-600 mt-2'>Scans Completed</p>
                        </div>

                        {/* Total Remaining */}
                        <div className='bg-white border-2 border-amber-200 rounded-xl p-6 hover:shadow-lg transition bg-amber-50'>
                            <p className='text-amber-600 text-sm font-semibold mb-2'>Total Remaining</p>
                            <p className='text-4xl font-bold text-amber-700'>{totalRemaining}</p>
                            <p className='text-xs text-amber-600 mt-2'>Pending Distribution</p>
                        </div>

                        {/* Progress Percentage */}
                        <div className='bg-white border-2 border-blue-200 rounded-xl p-6 hover:shadow-lg transition bg-blue-50'>
                            <p className='text-blue-600 text-sm font-semibold mb-2'>Completion Rate</p>
                            <p className='text-4xl font-bold text-blue-700'>
                                {totalProducts > 0 ? Math.round((totalDistributed / totalProducts) * 100) : 0}%
                            </p>
                            <p className='text-xs text-blue-600 mt-2'>Progress</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}