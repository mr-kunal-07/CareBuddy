"use client";

import QRScannerPayment from "@/components/qr";
import { Scan, ScanQrCode, Share, ShareIcon } from "lucide-react";
import { useState, useEffect } from "react";

export default function ElderDashboard() {
    const [userName] = useState("Manasvi Ji");
    const [selectedTab, setSelectedTab] = useState("home");
    const [showSOSConfirm, setShowSOSConfirm] = useState(false);
    const [sosCountdown, setSosCountdown] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    const [medicines, setMedicines] = useState([
        { id: 1, name: "Blood Pressure", time: "07:00", taken: true },
        { id: 2, name: "Diabetes", time: "09:00", taken: false },
        { id: 3, name: "Calcium", time: "13:00", taken: true },
        { id: 4, name: "Sleep Medicine", time: "21:00", taken: false },
    ]);

    const bills = [
        { id: 1, name: "Electricity", amount: 1200, dueDate: "Today", urgent: true },
        { id: 2, name: "Water", amount: 300, dueDate: "2 days", urgent: false },
        { id: 3, name: "Phone", amount: 500, dueDate: "5 days", urgent: false },
    ];

    const contacts = [
        { id: 1, name: "Rajesh", type: "Son", emoji: "👨‍💼", phone: "+91 98765 43210" },
        { id: 2, name: "Priya", type: "Daughter", emoji: "👩‍💼", phone: "+91 98765 43211" },
        { id: 3, name: "Dr. Sharma", type: "Doctor", emoji: "🏥", phone: "+91 98765 43212" },
    ];

    // Update time every minute
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 17) return "Good Afternoon";
        return "Good Evening";
    };

    const handleSOS = () => {
        if (showSOSConfirm) return;

        setShowSOSConfirm(true);
        let count = 3;
        setSosCountdown(count);

        const interval = setInterval(() => {
            count -= 1;
            setSosCountdown(count);
            if (count === 0) {
                clearInterval(interval);
                alert("🚨 Emergency alert sent!\nCalling: Rajesh\nLocation shared with family");
                setShowSOSConfirm(false);
                setSosCountdown(null);
            }
        }, 1000);
    };

    const cancelSOS = () => {
        setShowSOSConfirm(false);
        setSosCountdown(null);
    };

    const toggleMedicine = (id) => {
        setMedicines(medicines.map((med) =>
            med.id === id ? { ...med, taken: !med.taken } : med
        ));
    };

    const getNextMedicine = () => {
        const now = currentTime.getHours() * 60 + currentTime.getMinutes();
        return medicines
            .filter(m => !m.taken)
            .map(m => {
                const [hours, minutes] = m.time.split(':').map(Number);
                const medTime = hours * 60 + minutes;
                return { ...m, medTime };
            })
            .sort((a, b) => a.medTime - b.medTime)[0];
    };

    const medicinesTaken = medicines.filter(m => m.taken).length;
    const nextMedicine = getNextMedicine();

    // Component: Navigation Bar
    const BottomNav = () => (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 px-2 pb-safe pt-2 shadow-2xl z-50">
            <div className="flex justify-around max-w-2xl mx-auto">
                {[
                    { id: "home", label: "Home", icon: "🏠" },
                    { id: "medicines", label: "Medicines", icon: "💊" },
                    { id: "bills", label: "Bills", icon: "💳" },
                    { id: "calls", label: "Calls", icon: "📞" },
                    { id: "settings", label: "Settings", icon: "⚙️" },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setSelectedTab(tab.id)}
                        className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl min-w-[60px] transition-all ${selectedTab === tab.id
                            ? "bg-blue-500 text-white scale-105"
                            : "text-gray-600 hover:bg-gray-100 active:scale-95"
                            }`}
                    >
                        <span className="text-2xl">{tab.icon}</span>
                        <span className="text-xs font-bold">{tab.label}</span>
                    </button>
                ))}
            </div>
        </nav>
    );

    // Component: SOS Button
    const SOSButton = ({ size = "default" }) => (
        <div className={size === "large" ? "px-4" : ""}>
            {!showSOSConfirm ? (
                <button
                    onClick={handleSOS}
                    className={`w-full bg-gradient-to-br from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 active:scale-95 text-white rounded-2xl font-black shadow-xl transition-all border-4 border-red-800 flex items-center justify-center gap-3 ${size === "large" ? "py-6 text-xl" : "py-4 text-lg"
                        }`}
                >
                    <span className="text-3xl">🚨</span>
                    EMERGENCY SOS
                </button>
            ) : (
                <div className="bg-red-100 border-4 border-red-600 text-red-700 p-6 rounded-2xl shadow-lg">
                    <p className="font-bold text-lg text-center mb-3">Sending Alert In...</p>
                    <p className="text-6xl font-black text-center animate-pulse">{sosCountdown}</p>
                    <button
                        onClick={cancelSOS}
                        className="w-full mt-4 bg-gray-700 hover:bg-gray-800 text-white py-3 rounded-xl font-bold"
                    >
                        Cancel
                    </button>
                </div>
            )}
        </div>
    );

    // HOME TAB
    if (selectedTab === "home") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pb-24">
                {/* Header */}
                <header className="bg-gradient-to-r from-emerald-500 to-emerald-500 p-6 rounded-b-3xl shadow-lg">
                    <p className="text-md text-blue-100 font-semibold">{getGreeting()}</p>
                    <h1 className="text-4xl font-black text-white">{userName}</h1>
                    <p className="text-sm text-blue-100 mt-2 flex items-center gap-2">
                        <span>📅</span>
                        {currentTime.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                </header>

                {/* SOS Button */}
                <div className="mt-6">
                    <SOSButton size="large" />
                </div>

                {/* Quick Stats */}
                <section className="px-4 mt-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-5 rounded-2xl shadow-lg border-l-4 border-emerald-500">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-3xl">💊</span>
                                <p className="text-xs text-gray-600 font-bold">Today's Medicines</p>
                            </div>
                            <p className="text-4xl font-black text-emerald-600">
                                {medicinesTaken}<span className="text-2xl text-gray-400">/{medicines.length}</span>
                            </p>
                        </div>
                        <div className="bg-white p-5 rounded-2xl shadow-lg border-l-4 border-cyan-500">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-3xl">💧</span>
                                <p className="text-xs text-gray-600 font-bold">Water Glasses</p>
                            </div>
                            <p className="text-4xl font-black text-cyan-600">
                                6<span className="text-2xl text-gray-400">/8</span>
                            </p>
                        </div>
                    </div>
                </section>

                {/* Next Medicine Card */}
                {nextMedicine && (
                    <section className="px-4 mt-6">
                        <div className="bg-gradient-to-br from-emerald-400 to-teal-500 p-6 rounded-2xl shadow-xl text-white">
                            <div className="flex items-start gap-4">
                                <span className="text-5xl">⏰</span>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold opacity-90">Next Medicine</p>
                                    <p className="text-2xl font-black mt-1">{nextMedicine.name}</p>
                                    <p className="text-lg font-bold mt-2">
                                        {nextMedicine.time.replace(':', ':')} {parseInt(nextMedicine.time) < 12 ? 'AM' : 'PM'}
                                    </p>
                                    <button
                                        onClick={() => toggleMedicine(nextMedicine.id)}
                                        className="mt-4 w-full bg-white text-emerald-700 py-3 rounded-xl font-black text-base shadow-md hover:bg-emerald-50 active:scale-95 transition-all"
                                    >
                                        ✓ Mark as Taken
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Quick Actions */}
                <section className="px-4 mt-6">
                    <h2 className="text-xl font-black text-gray-800 mb-4">Quick Access</h2>
                    <div className="bg-gradient-to-r from-red-800 to-red-700 p-5 rounded-2xl shadow-xl mb-4 text-center font-extrabold text-white tracking-wide hover:opacity-90 transition cursor-pointer flex items-center justify-center gap-2 flex-col">
                        <ShareIcon className="inline-block mr-2" size={24} />
                        Share Screen
                    </div>



                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { tab: "medicines", icon: "💊", label: "Medicines", color: "emerald" },
                            { tab: "calls", icon: "📞", label: "Call Family", color: "blue" },
                            { tab: "bills", icon: "💳", label: "Pay Bills", color: "orange" },
                            { tab: "settings", icon: "⚙️", label: "Settings", color: "gray" },
                        ].map((item) => (
                            <button
                                key={item.tab}
                                onClick={() => setSelectedTab(item.tab)}
                                className={`p-6 rounded-2xl bg-${item.color}-50 hover:bg-${item.color}-100 active:scale-95 shadow-md border-2 border-${item.color}-200 transition-all`}
                            >
                                <span className="text-5xl block mb-2">{item.icon}</span>
                                <span className="font-black text-gray-800">{item.label}</span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Upcoming Appointment */}
                <section className="px-4 mt-6 mb-4">
                    <div className="bg-white p-5 rounded-2xl shadow-lg border-l-4 border-purple-500">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <span className="text-4xl">🏥</span>
                                <div>
                                    <p className="text-xs text-gray-600 font-semibold">Next Appointment</p>
                                    <p className="font-black text-gray-900 text-lg">Dr. Sharma</p>
                                    <p className="text-sm text-purple-700 font-bold mt-1">Tomorrow, 2:00 PM</p>
                                </div>
                            </div>
                            <button
                                onClick={() => alert('📞 Calling Dr. Sharma...')}
                                className="bg-purple-500 hover:bg-purple-600 text-white p-4 rounded-xl text-2xl active:scale-95 transition-all shadow-md"
                            >
                                📞
                            </button>
                        </div>
                    </div>
                </section>

                <BottomNav />
            </div>
        );
    }

    // MEDICINES TAB
    if (selectedTab === "medicines") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 pb-24">

                {/* Progress */}
                <section className="px-4 pt-3 ">
                    <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <div className="flex items-center justify-between mb-3">
                            <p className="font-black text-gray-800 text-lg">Daily Progress</p>
                            <p className="font-black text-emerald-600 text-2xl">
                                {medicinesTaken}/{medicines.length}
                            </p>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden shadow-inner">
                            <div
                                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full transition-all duration-700 flex items-center justify-end pr-2"
                                style={{ width: `${(medicinesTaken / medicines.length) * 100}%` }}
                            >
                                {medicinesTaken > 0 && (
                                    <span className="text-white text-xs font-bold">
                                        {Math.round((medicinesTaken / medicines.length) * 100)}%
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Medicines List */}
                <section className="px-4 pt-3 space-y-3 mb-4">
                    {medicines.map((med) => {
                        const [hours, minutes] = med.time.split(':');
                        const displayTime = `${hours}:${minutes} ${parseInt(hours) < 12 ? 'AM' : 'PM'}`;

                        return (
                            <button
                                key={med.id}
                                onClick={() => toggleMedicine(med.id)}
                                className={`w-full p-5 rounded-2xl shadow-lg transition-all active:scale-95 ${med.taken
                                    ? "bg-emerald-100 border-2 border-emerald-400"
                                    : "bg-white border-2 border-amber-300 hover:border-amber-400"
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 flex-1 text-left">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${med.taken ? 'bg-emerald-200' : 'bg-amber-100'
                                            }`}>
                                            {med.taken ? "✅" : "⏳"}
                                        </div>
                                        <div>
                                            <p className="font-black text-gray-900 text-lg">{med.name}</p>
                                            <p className="text-gray-600 font-semibold mt-1 flex items-center gap-2">
                                                <span>⏰</span> {displayTime}
                                            </p>
                                        </div>
                                    </div>
                                    {!med.taken && (
                                        <span className="text-amber-600 font-bold text-sm bg-amber-50 px-3 py-1 rounded-full">
                                            Pending
                                        </span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </section>

                <BottomNav />
            </div>
        );
    }

    // BILLS TAB
    if (selectedTab === "bills") {
        const totalAmount = bills.reduce((sum, bill) => sum + bill.amount, 0);

        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 pb-24">
                {/* Total Summary */}
                <section className="px-4 pt-3 ">
                    <div className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-orange-500">
                        <p className="text-sm text-gray-600 font-semibold">Total Due</p>
                        <p className="text-4xl font-black text-orange-600 mt-1">₹{totalAmount.toLocaleString('en-IN')}</p>
                        <p className="text-xs text-gray-500 mt-2">{bills.length} bills pending</p>
                    </div>
                </section>

                {/* Bills List */}
                <section className="px-4 pt-2 space-y-3 mb-4">
                    {bills.map((bill) => (
                        <div
                            key={bill.id}
                            className={`bg-white p-5 rounded-2xl shadow-lg border-l-4 ${bill.urgent ? 'border-red-500' : 'border-orange-300'
                                }`}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-black text-gray-900 text-lg">{bill.name}</p>
                                        {bill.urgent && (
                                            <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">
                                                Urgent
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600 font-semibold">
                                        Due: {bill.dueDate}
                                    </p>
                                </div>
                                <p className="text-3xl font-black text-orange-600">
                                    ₹{bill.amount.toLocaleString('en-IN')}
                                </p>
                            </div>
                            <button
                                onClick={() => alert(`Processing payment for ${bill.name}...`)}
                                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white py-4 rounded-xl font-black shadow-md active:scale-95 transition-all"
                            >
                                Pay Now
                            </button>
                        </div>
                    ))}
                </section>

                <section>
                    <div >
                        <QRScannerPayment className="mx-auto mb-2 text-gray-400" size={48} />
                    </div>
                </section>

                <BottomNav />
            </div>
        );
    }

    // CALLS TAB
    if (selectedTab === "calls") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 pb-24">

                {/* Contacts */}
                <section className="px-4 pt-2  space-y-3 mb-4">
                    {contacts.map((contact) => (
                        <button
                            key={contact.id}
                            onClick={() => alert(`📞 Calling ${contact.name}...\n${contact.phone}`)}
                            className="w-full bg-white p-6 rounded-2xl shadow-lg border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 active:scale-95 transition-all"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center text-4xl flex-shrink-0 shadow-md">
                                    {contact.emoji}
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-black text-gray-900 text-xl">{contact.name}</p>
                                    <p className="text-sm text-gray-600 font-semibold">{contact.type}</p>
                                    <p className="text-xs text-gray-500 mt-1">{contact.phone}</p>
                                </div>
                                <div className="text-3xl text-blue-500">📞</div>
                            </div>
                        </button>
                    ))}
                </section>

                {/* Emergency */}
                <section className="px-4 mb-4">
                    <SOSButton />
                </section>

                <BottomNav />
            </div>
        );
    }

    // SETTINGS TAB
    if (selectedTab === "settings") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-50 pb-24">

                <section className="px-4 pt-2 space-y-4 mb-4">
                    {/* Profile */}
                    <div className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-blue-500">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-4xl shadow-md">
                                👤
                            </div>
                            <div>
                                <p className="font-black text-gray-900 text-xl">{userName}</p>
                                <p className="text-sm text-gray-600">Mumbai, India</p>
                            </div>
                        </div>
                        <button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-bold active:scale-95 transition-all">
                            Edit Profile
                        </button>
                    </div>

                    {/* Text Size */}
                    <div className="bg-white p-5 rounded-2xl shadow-lg">
                        <p className="font-black text-gray-900 mb-3 flex items-center gap-2">
                            <span className="text-xl">📝</span> Text Size
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { label: "Small", size: "text-sm" },
                                { label: "Normal", size: "text-base" },
                                { label: "Large", size: "text-lg" }
                            ].map((option) => (
                                <button
                                    key={option.label}
                                    className="py-3 rounded-xl bg-gray-100 text-gray-900 font-bold hover:bg-blue-500 hover:text-white active:scale-95 border-2 border-gray-300 hover:border-blue-500 transition-all"
                                >
                                    <span className={option.size}>{option.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Theme */}
                    <div className="bg-white p-5 rounded-2xl shadow-lg">
                        <p className="font-black text-gray-900 mb-3 flex items-center gap-2">
                            <span className="text-xl">🎨</span> Display Theme
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            {["Light Mode", "High Contrast"].map((theme) => (
                                <button
                                    key={theme}
                                    className="py-3 rounded-xl bg-gray-100 text-gray-900 font-bold hover:bg-blue-500 hover:text-white active:scale-95 border-2 border-gray-300 hover:border-blue-500 transition-all"
                                >
                                    {theme}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Notifications */}
                    <div className="bg-white p-5 rounded-2xl shadow-lg">
                        <p className="font-black text-gray-900 mb-3 flex items-center gap-2">
                            <span className="text-xl">🔔</span> Notifications
                        </p>
                        <button className="w-full py-3 rounded-xl bg-gray-100 text-gray-900 font-bold border-2 border-gray-300 hover:bg-gray-200 active:scale-95 transition-all text-left px-4">
                            Medicine Reminders: ON
                        </button>
                    </div>

                    {/* Emergency Contact */}
                    <div className="bg-white p-5 rounded-2xl shadow-lg">
                        <p className="font-black text-gray-900 mb-3 flex items-center gap-2">
                            <span className="text-xl">🚨</span> Emergency Contact
                        </p>
                        <button className="w-full py-3 rounded-xl bg-gray-100 text-gray-900 font-bold border-2 border-gray-300 hover:bg-gray-200 active:scale-95 transition-all">
                            Manage Emergency Contacts
                        </button>
                    </div>

                    {/* Help */}
                    <div className="bg-white p-5 rounded-2xl shadow-lg">
                        <p className="font-black text-gray-900 mb-3 flex items-center gap-2">
                            <span className="text-xl">❓</span> Help & Support
                        </p>
                        <div className="space-y-2">
                            <button className="w-full py-3 rounded-xl bg-gray-100 text-gray-900 font-bold border-2 border-gray-300 hover:bg-gray-200 active:scale-95 transition-all">
                                Tutorial
                            </button>
                            <button className="w-full py-3 rounded-xl bg-gray-100 text-gray-900 font-bold border-2 border-gray-300 hover:bg-gray-200 active:scale-95 transition-all">
                                Contact Support
                            </button>
                        </div>
                    </div>

                    {/* Logout */}
                    <button className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-4 rounded-2xl font-black shadow-lg active:scale-95 transition-all border-2 border-red-700">
                        🚪 Logout
                    </button>
                </section>

                <BottomNav />
            </div>
        );
    }

    return null;
}