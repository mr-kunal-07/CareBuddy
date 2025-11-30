"use client";

import React, { useEffect, useState } from "react";

// ---------- Mock persistence (localStorage) ----------
const STORAGE_KEY = "familyDashboardData_v1";

const defaultSeed = {
    familyName: "Rajesh Kumar",
    senior: {
        id: 1,
        name: "Meena Sharma",
        relation: "Mother",
        phone: "9876543210",
        livingType: "home",
        createdAt: new Date().toISOString(),
    },
    medicines: [
        { id: 1, name: "Blood Pressure", dosage: "1 tablet", time: "07:00", time2: "21:00" },
        { id: 2, name: "Diabetes", dosage: "2 tablets", time: "09:00", time2: "13:00" },
    ],
    doctors: [
        { id: 1, name: "Dr. Sharma", specialty: "Cardiologist", phone: "9988776655", email: "dr.sharma@clinic.com" },
    ],
    bills: [
        { id: 1, name: "Electricity", amount: "1200", dueDate: "2024-12-20", status: "pending" },
    ],
    emergencyContacts: [
        { id: 1, name: "Rajesh (Son)", phone: "9876543210", relation: "Son" },
        { id: 2, name: "Hospital", phone: "1234567890", relation: "Emergency" },
    ],
    activities: [],
    messages: [],
};

const mockFirebase = {
    init() {
        if (!localStorage.getItem(STORAGE_KEY)) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSeed));
        }
    },
    getAll() {
        this.init();
        return JSON.parse(localStorage.getItem(STORAGE_KEY));
    },
    setAll(payload) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    },
    push(listKey, item) {
        const data = this.getAll();
        const arr = data[listKey] || [];
        const newId = arr.length ? Math.max(...arr.map((i) => i.id || 0)) + 1 : 1;
        const newItem = { ...item, id: newId };
        data[listKey] = [...arr, newItem];
        this.setAll(data);
        return newItem;
    },
    remove(listKey, id) {
        const data = this.getAll();
        data[listKey] = (data[listKey] || []).filter((i) => i.id !== id);
        this.setAll(data);
    },
    updateList(listKey, newList) {
        const data = this.getAll();
        data[listKey] = newList;
        this.setAll(data);
    },
    set(path, value) {
        const data = this.getAll();
        data[path] = value;
        this.setAll(data);
    },
};

// ---------- Helper / UI primitives ----------
const Icon = ({ children, className = "" }) => (
    <span className={`inline-flex items-center justify-center ${className}`}>{children}</span>
);

function SectionCard({ title, children, actions }) {
    return (
        <div className="bg-white/95 border border-black/10 rounded-xl p-4 shadow-sm">
            <div className="flex items-start justify-between">
                <h3 className="text-lg font-semibold text-black">{title}</h3>
                {actions}
            </div>
            <div className="mt-3 space-y-3">{children}</div>
        </div>
    );
}

function BottomNav({ activeTab, setActiveTab }) {
    const items = [
        { key: "home", label: "Home", emoji: "🏠" },
        { key: "medicines", label: "Medicines", emoji: "💊" },
        { key: "bills", label: "Bills", emoji: "💳" },
        { key: "doctors", label: "Doctors", emoji: "🏥" },
        { key: "contacts", label: "Contacts", emoji: "📞" },
    ];
    return (
        <nav className="fixed bottom-4 left-0 right-0 flex justify-center">
            <div className="bg-black/95 text-white rounded-2xl shadow-lg px-3 py-2 flex gap-2">
                {items.map((it) => (
                    <button
                        key={it.key}
                        onClick={() => setActiveTab(it.key)}
                        className={`flex flex-col items-center px-3 py-1 rounded-lg ${activeTab === it.key ? "bg-white text-black" : "text-white/90"}`}
                        aria-pressed={activeTab === it.key}
                    >
                        <span className="text-xl">{it.emoji}</span>
                        <span className="text-xs mt-0.5">{it.label}</span>
                    </button>
                ))}
            </div>
        </nav>
    );
}

function Modal({ open, onClose, title, children }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />
            <div className="relative bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
                <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold">{title}</h4>
                    <button onClick={onClose} aria-label="Close modal" className="text-sm font-medium">✕</button>
                </div>
                <div className="mt-4 space-y-3">{children}</div>
            </div>
        </div>
    );
}

// ---------- Main Component ----------
export default function FamilyDashboard() {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("home");

    // Data
    const [familyName, setFamilyName] = useState("");
    const [senior, setSenior] = useState(null);
    const [medicines, setMedicines] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [bills, setBills] = useState([]);
    const [emergencyContacts, setEmergencyContacts] = useState([]);
    const [messages, setMessages] = useState([]);

    // UI state
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState("");

    // Forms
    const emptyMedicine = { name: "", dosage: "", time: "", time2: "" };
    const emptyDoctor = { name: "", specialty: "", phone: "", email: "" };
    const emptyBill = { name: "", amount: "", dueDate: "", status: "pending" };
    const emptyContact = { name: "", phone: "", relation: "" };

    const [medicineForm, setMedicineForm] = useState(emptyMedicine);
    const [doctorForm, setDoctorForm] = useState(emptyDoctor);
    const [billForm, setBillForm] = useState(emptyBill);
    const [contactForm, setContactForm] = useState(emptyContact);
    const [messageText, setMessageText] = useState("");

    useEffect(() => {
        loadAll();
    }, []);

    function loadAll() {
        setLoading(true);
        try {
            const data = mockFirebase.getAll();
            setFamilyName(data.familyName || "");
            setSenior(data.senior || null);
            setMedicines(data.medicines || []);
            setDoctors(data.doctors || []);
            setBills(data.bills || []);
            setEmergencyContacts(data.emergencyContacts || []);
            setMessages((data.messages || []).slice().reverse());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    // Generic helpers that keep local state and localStorage in sync
    const pushItem = (key, item, setter, stateArr) => {
        const saved = mockFirebase.push(key, item);
        setter([...(stateArr || []), saved]);
    };

    const removeItem = (key, id, setter, stateArr) => {
        mockFirebase.remove(key, id);
        setter((stateArr || []).filter((i) => i.id !== id));
    };

    // Medicines
    const addMedicine = () => {
        if (!medicineForm.name || !medicineForm.time) return;
        pushItem("medicines", medicineForm, setMedicines, medicines);
        setMedicineForm(emptyMedicine);
        setModalOpen(false);
    };
    const deleteMedicine = (id) => removeItem("medicines", id, setMedicines, medicines);

    // Doctors
    const addDoctor = () => {
        if (!doctorForm.name || !doctorForm.phone) return;
        pushItem("doctors", doctorForm, setDoctors, doctors);
        setDoctorForm(emptyDoctor);
        setModalOpen(false);
    };
    const deleteDoctor = (id) => removeItem("doctors", id, setDoctors, doctors);

    // Bills
    const addBill = () => {
        if (!billForm.name || !billForm.amount) return;
        pushItem("bills", billForm, setBills, bills);
        setBillForm(emptyBill);
        setModalOpen(false);
    };
    const toggleBill = (id) => {
        const updated = bills.map((b) => (b.id === id ? { ...b, status: b.status === "paid" ? "pending" : "paid" } : b));
        setBills(updated);
        mockFirebase.updateList("bills", updated);
    };
    const deleteBill = (id) => removeItem("bills", id, setBills, bills);

    // Contacts
    const addContact = () => {
        if (!contactForm.name || !contactForm.phone) return;
        pushItem("emergencyContacts", contactForm, setEmergencyContacts, emergencyContacts);
        setContactForm(emptyContact);
        setModalOpen(false);
    };
    const deleteContact = (id) => removeItem("emergencyContacts", id, setEmergencyContacts, emergencyContacts);

    // Messages
    const sendMessage = () => {
        if (!messageText.trim()) return;
        const newMsg = { text: messageText.trim(), timestamp: new Date().toISOString() };
        const saved = mockFirebase.push("messages", newMsg);
        setMessages([saved, ...messages]);
        setMessageText("");
    };

    // UI helpers
    const openModal = (type) => {
        setModalType(type);
        setModalOpen(true);
    };
    const closeModal = () => {
        setModalOpen(false);
        setMedicineForm(emptyMedicine);
        setDoctorForm(emptyDoctor);
        setBillForm(emptyBill);
        setContactForm(emptyContact);
    };

    // Loading state
    if (loading)
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-100">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-black/20 border-t-black rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-sm text-black/70">Loading dashboard...</p>
                </div>
            </div>
        );

    // ---------- Render tabs -------
    return (
        <div className="min-h-screen pb-32 bg-white text-black">
            {/* Header */}
            <header className="bg-black text-white p-6 shadow-md">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Family Dashboard</h1>
                        <p className="text-sm opacity-80">Welcome back, {familyName}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm">{senior?.name}</p>
                        <p className="text-xs opacity-80">{senior?.relation}</p>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 mt-6">
                {activeTab === "home" && (
                    <div className="space-y-6">
                        <SectionCard
                            title={senior ? `${senior.name} • ${senior.relation}` : "No senior added"}
                            actions={
                                <div className="text-sm text-black/70">{senior?.livingType === "home" ? "At Home" : "Old Age Home"}</div>
                            }
                        >
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => setActiveTab("medicines")} className="p-3 rounded-lg border border-black/10 text-left">
                                    <div className="text-2xl">💊</div>
                                    <div className="mt-1 font-semibold">Medicines</div>
                                    <div className="text-sm opacity-75">{medicines.length} items</div>
                                </button>

                                <button onClick={() => setActiveTab("bills")} className="p-3 rounded-lg border border-black/10 text-left">
                                    <div className="text-2xl">💳</div>
                                    <div className="mt-1 font-semibold">Bills</div>
                                    <div className="text-sm opacity-75">{bills.filter((b) => b.status === "pending").length} pending</div>
                                </button>

                                <button onClick={() => setActiveTab("doctors")} className="p-3 rounded-lg border border-black/10 text-left">
                                    <div className="text-2xl">🏥</div>
                                    <div className="mt-1 font-semibold">Doctors</div>
                                    <div className="text-sm opacity-75">{doctors.length}</div>
                                </button>

                                <button onClick={() => setActiveTab("contacts")} className="p-3 rounded-lg border border-black/10 text-left">
                                    <div className="text-2xl">📞</div>
                                    <div className="mt-1 font-semibold">Contacts</div>
                                    <div className="text-sm opacity-75">{emergencyContacts.length}</div>
                                </button>
                            </div>

                            <div className="mt-4">
                                <SectionCard title="Send Reminder">
                                    <div className="flex gap-2">
                                        <input
                                            value={messageText}
                                            onChange={(e) => setMessageText(e.target.value)}
                                            placeholder="Type reminder..."
                                            className="flex-1 border border-black/10 rounded-lg px-3 py-2"
                                            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                                        />
                                        <button onClick={sendMessage} className="px-4 py-2 rounded-lg border border-black/10">
                                            Send
                                        </button>
                                    </div>

                                    {messages.length > 0 && (
                                        <div className="mt-3 space-y-2">
                                            {messages.slice(0, 4).map((m) => (
                                                <div key={m.id} className="p-2 rounded-md border border-black/5 text-sm">
                                                    <div>{m.text}</div>
                                                    <div className="text-xs opacity-60 mt-1">{new Date(m.timestamp).toLocaleString()}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </SectionCard>
                            </div>
                        </SectionCard>

                        {/* Activities or quick actions could go here */}
                    </div>
                )}

                {activeTab === "medicines" && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold">Medicine Management</h2>
                            <div className="flex gap-2">
                                <button onClick={() => openModal("medicine")} className="px-3 py-2 rounded-lg border border-black/10">➕ Add</button>
                                <button onClick={() => setActiveTab("home")} className="px-3 py-2 rounded-lg border border-black/10">Back</button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {medicines.length === 0 && <div className="text-sm text-black/60">No medicines added.</div>}
                            {medicines.map((m) => (
                                <div key={m.id} className="p-3 rounded-lg border border-black/10 flex justify-between items-center">
                                    <div>
                                        <div className="font-semibold">{m.name}</div>
                                        <div className="text-sm opacity-75">{m.dosage} • {m.time}{m.time2 ? `, ${m.time2}` : ""}</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => deleteMedicine(m.id)} className="text-sm text-red-600">Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === "doctors" && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold">Doctor Contacts</h2>
                            <div className="flex gap-2">
                                <button onClick={() => openModal("doctor")} className="px-3 py-2 rounded-lg border border-black/10">➕ Add</button>
                                <button onClick={() => setActiveTab("home")} className="px-3 py-2 rounded-lg border border-black/10">Back</button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {doctors.length === 0 && <div className="text-sm text-black/60">No doctors saved.</div>}
                            {doctors.map((d) => (
                                <div key={d.id} className="p-3 rounded-lg border border-black/10 flex justify-between items-center">
                                    <div>
                                        <div className="font-semibold">{d.name}</div>
                                        <div className="text-sm opacity-75">{d.specialty} • {d.phone}</div>
                                        {d.email && <div className="text-xs opacity-60">{d.email}</div>}
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => deleteDoctor(d.id)} className="text-sm text-red-600">Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === "bills" && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold">Bills</h2>
                            <div className="flex gap-2">
                                <button onClick={() => openModal("bill")} className="px-3 py-2 rounded-lg border border-black/10">➕ Add</button>
                                <button onClick={() => setActiveTab("home")} className="px-3 py-2 rounded-lg border border-black/10">Back</button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {bills.length === 0 && <div className="text-sm text-black/60">No bills yet.</div>}
                            {bills.map((b) => (
                                <div key={b.id} className="p-3 rounded-lg border border-black/10 flex justify-between items-center">
                                    <div>
                                        <div className="font-semibold">{b.name} • ₹{b.amount}</div>
                                        <div className="text-xs opacity-70">Due: {new Date(b.dueDate).toLocaleDateString()}</div>
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <button onClick={() => toggleBill(b.id)} className={`px-2 py-1 rounded-full text-xs ${b.status === "paid" ? "bg-white text-black border" : "border border-black/10"}`}>
                                            {b.status === "paid" ? "Paid" : "Pending"}
                                        </button>
                                        <button onClick={() => deleteBill(b.id)} className="text-sm text-red-600">Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === "contacts" && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold">Emergency Contacts</h2>
                            <div className="flex gap-2">
                                <button onClick={() => openModal("contact")} className="px-3 py-2 rounded-lg border border-black/10">➕ Add</button>
                                <button onClick={() => setActiveTab("home")} className="px-3 py-2 rounded-lg border border-black/10">Back</button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {emergencyContacts.length === 0 && <div className="text-sm text-black/60">No contacts yet.</div>}
                            {emergencyContacts.map((c) => (
                                <div key={c.id} className="p-3 rounded-lg border border-black/10 flex justify-between items-center">
                                    <div>
                                        <div className="font-semibold">{c.name}</div>
                                        <div className="text-sm opacity-75">{c.relation} • {c.phone}</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => deleteContact(c.id)} className="text-sm text-red-600">Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

            {/* Modal content for add forms */}
            <Modal open={modalOpen} onClose={closeModal} title={modalType === "medicine" ? "Add Medicine" : modalType === "doctor" ? "Add Doctor" : modalType === "bill" ? "Add Bill" : modalType === "contact" ? "Add Contact" : ""}>
                {modalType === "medicine" && (
                    <div className="space-y-2">
                        <input value={medicineForm.name} onChange={(e) => setMedicineForm({ ...medicineForm, name: e.target.value })} placeholder="Name" className="w-full border px-3 py-2 rounded" />
                        <input value={medicineForm.dosage} onChange={(e) => setMedicineForm({ ...medicineForm, dosage: e.target.value })} placeholder="Dosage" className="w-full border px-3 py-2 rounded" />
                        <div className="flex gap-2">
                            <input type="time" value={medicineForm.time} onChange={(e) => setMedicineForm({ ...medicineForm, time: e.target.value })} className="flex-1 border px-3 py-2 rounded" />
                            <input type="time" value={medicineForm.time2} onChange={(e) => setMedicineForm({ ...medicineForm, time2: e.target.value })} className="flex-1 border px-3 py-2 rounded" />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button onClick={closeModal} className="px-3 py-2 rounded border">Cancel</button>
                            <button onClick={addMedicine} className="px-3 py-2 rounded border bg-black text-white">Add</button>
                        </div>
                    </div>
                )}

                {modalType === "doctor" && (
                    <div className="space-y-2">
                        <input value={doctorForm.name} onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })} placeholder="Name" className="w-full border px-3 py-2 rounded" />
                        <input value={doctorForm.specialty} onChange={(e) => setDoctorForm({ ...doctorForm, specialty: e.target.value })} placeholder="Specialty" className="w-full border px-3 py-2 rounded" />
                        <input value={doctorForm.phone} onChange={(e) => setDoctorForm({ ...doctorForm, phone: e.target.value })} placeholder="Phone" className="w-full border px-3 py-2 rounded" />
                        <input value={doctorForm.email} onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })} placeholder="Email (optional)" className="w-full border px-3 py-2 rounded" />
                        <div className="flex gap-2 justify-end">
                            <button onClick={closeModal} className="px-3 py-2 rounded border">Cancel</button>
                            <button onClick={addDoctor} className="px-3 py-2 rounded border bg-black text-white">Add</button>
                        </div>
                    </div>
                )}

                {modalType === "bill" && (
                    <div className="space-y-2">
                        <input value={billForm.name} onChange={(e) => setBillForm({ ...billForm, name: e.target.value })} placeholder="Bill Name" className="w-full border px-3 py-2 rounded" />
                        <input value={billForm.amount} onChange={(e) => setBillForm({ ...billForm, amount: e.target.value })} placeholder="Amount" className="w-full border px-3 py-2 rounded" />
                        <input type="date" value={billForm.dueDate} onChange={(e) => setBillForm({ ...billForm, dueDate: e.target.value })} className="w-full border px-3 py-2 rounded" />
                        <div className="flex gap-2 justify-end">
                            <button onClick={closeModal} className="px-3 py-2 rounded border">Cancel</button>
                            <button onClick={addBill} className="px-3 py-2 rounded border bg-black text-white">Add</button>
                        </div>
                    </div>
                )}

                {modalType === "contact" && (
                    <div className="space-y-2">
                        <input value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} placeholder="Name" className="w-full border px-3 py-2 rounded" />
                        <input value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} placeholder="Phone" className="w-full border px-3 py-2 rounded" />
                        <input value={contactForm.relation} onChange={(e) => setContactForm({ ...contactForm, relation: e.target.value })} placeholder="Relation" className="w-full border px-3 py-2 rounded" />
                        <div className="flex gap-2 justify-end">
                            <button onClick={closeModal} className="px-3 py-2 rounded border">Cancel</button>
                            <button onClick={addContact} className="px-3 py-2 rounded border bg-black text-white">Add</button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
