// utils/calculate.js

import { db } from "../../firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";

/**
 * Reads a cookie by name
 */
function getCookie(name) {
    const match = document.cookie
        .split("; ")
        .find(row => row.startsWith(name + "="));

    return match ? match.split("=")[1] : null;
}

/**
 * Convert Firestore timestamp to Date
 */
function convertTimestamp(timestamp) {
    if (!timestamp) return null;
    if (timestamp.seconds) {
        return new Date(timestamp.seconds * 1000);
    }
    return new Date(timestamp);
}

/**
 * Categorize campaign by status
 */
function getCampaignStatus(startDate, endDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = convertTimestamp(startDate);
    const end = convertTimestamp(endDate);

    if (!start || !end) return "UNKNOWN";

    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (today < start) {
        return "UPCOMING";
    } else if (today >= start && today <= end) {
        return "ACTIVE";
    } else if (today > end) {
        return "COMPLETED";
    }
    return "UNKNOWN";
}

/**
 * Fetch and organize campaigns by status
 */
export async function calculateDashboardStats() {
    try {
        // 1️⃣ Read promoterDocId from cookie
        const promoterDocId = getCookie("promoterDocId");

        if (!promoterDocId) {
            return { error: "NO_COOKIE" };
        }

        // 2️⃣ Fetch promoter info using docId
        const promotersRef = collection(db, "promoters");
        const promoterDoc = await getDocs(query(promotersRef, where("__name__", "==", promoterDocId)));

        if (promoterDoc.empty) {
            return { error: "NO_PROMOTER_FOUND" };
        }

        const promoterData = promoterDoc.docs[0].data();

        const promoterInfo = {
            name: promoterData.name || "",
            email: promoterData.email || "",
            phone: promoterData.phone || "",
            imageUrl: promoterData.imageUrl || "",
            docId: promoterDocId,
        };

        // 3️⃣ Fetch campaigns assigned to this promoter
        const campaignsRef = collection(db, "campaigns");
        const campaignsSnap = await getDocs(campaignsRef);

        const assignedCampaigns = campaignsSnap.docs.filter(doc => {
            const data = doc.data();
            return data.promoters?.some(p => p.promoterId === promoterDocId);
        });

        // 4️⃣ Categorize campaigns by status
        const campaigns = assignedCampaigns.map(doc => {
            const data = doc.data();
            const status = getCampaignStatus(data.startDate, data.endDate);

            return {
                id: doc.id,
                name: data.campaignName || "N/A",
                description: data.description || "",
                status: status,
                startDate: convertTimestamp(data.startDate),
                endDate: convertTimestamp(data.endDate),
                budget: data.campaignBudget || 0,
                targetSamplings: data.targetSamplings || 0,
                targetScans: data.targetScans || 0,
                category: data.campaignCategries?.[0] || "N/A",
                format: data.campaignFormat || "N/A",
                objective: data.campaignObjective || "N/A",
                reward: data.reward || "N/A",
                fullData: data
            };
        });

        // 5️⃣ Organize by status
        const stats = {
            ACTIVE: campaigns.filter(c => c.status === "ACTIVE"),
            COMPLETED: campaigns.filter(c => c.status === "COMPLETED"),
            UPCOMING: campaigns.filter(c => c.status === "UPCOMING"),
        };

        // 📋 Console output
        console.log("🎯 Promoter:", promoterInfo.name);
        console.log("📊 Campaign Summary:", {
            active: stats.ACTIVE.length,
            completed: stats.COMPLETED.length,
            upcoming: stats.UPCOMING.length,
        });

        console.log("\n✅ ACTIVE Campaigns:", stats.ACTIVE);
        console.log("\n✔️ COMPLETED Campaigns:", stats.COMPLETED);
        console.log("\n⏳ UPCOMING Campaigns:", stats.UPCOMING);

        return {
            promoterInfo,
            campaigns: {
                active: stats.ACTIVE,
                completed: stats.COMPLETED,
                upcoming: stats.UPCOMING,
            },
            stats: {
                assigned: campaigns.length,
                active: stats.ACTIVE.length,
                completed: stats.COMPLETED.length,
                upcoming: stats.UPCOMING.length,
            },
            error: null
        };

    } catch (err) {
        console.error("❌ Error in calculateDashboardStats:", err);
        return { error: "SERVER_ERROR" };
    }
}

/**
 * Fetch a single campaign by ID with all details
 */
export async function getCampaignById(campaignId) {
    try {
        if (!campaignId) {
            return { error: "NO_CAMPAIGN_ID" };
        }

        // Fetch campaign document by ID
        const campaignRef = doc(db, "campaigns", campaignId);
        const campaignSnap = await getDoc(campaignRef);

        if (!campaignSnap.exists()) {
            return { error: "CAMPAIGN_NOT_FOUND" };
        }

        const data = campaignSnap.data();
        const status = getCampaignStatus(data.startDate, data.endDate);

        const campaignDetails = {
            id: campaignSnap.id,
            name: data.campaignName || "N/A",
            description: data.description || "",
            status: status,
            startDate: convertTimestamp(data.startDate),
            endDate: convertTimestamp(data.endDate),
            budget: data.campaignBudget || 0,
            targetSamplings: data.targetSamplings || 0,
            targetScans: data.targetScans || 0,
            category: data.campaignCategries?.[0] || "N/A",
            format: data.campaignFormat || "N/A",
            objective: data.campaignObjective || "N/A",
            reward: data.reward || "N/A",

            // Additional fields that might be in fullData
            fullData: {
                ...data,
                startDate: convertTimestamp(data.startDate),
                endDate: convertTimestamp(data.endDate),
            }
        };

        console.log("📄 Campaign Details:", campaignDetails);

        return {
            campaign: campaignDetails,
            error: null
        };

    } catch (err) {
        console.error("❌ Error in getCampaignById:", err);
        return { error: "SERVER_ERROR" };
    }
}