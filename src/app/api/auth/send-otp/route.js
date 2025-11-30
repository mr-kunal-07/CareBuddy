import { db } from "../../../../../firebase";
import { collection, getDocs, query, where, addDoc, serverTimestamp } from "firebase/firestore";

export async function POST(req) {
  try {
    const { phoneNumber, userId } = await req.json();

    // ----------- VALIDATION -----------
    if (!phoneNumber || !userId) {
      return Response.json(
        {
          success: false,
          error: "Phone number and User ID are required",
        },
        { status: 400 }
      );
    }

    if (phoneNumber.length !== 10) {
      return Response.json(
        { success: false, error: "Invalid phone number format" },
        { status: 400 }
      );
    }

    console.log("📱 Processing OTP request for:", phoneNumber);

    // ----------- CHECK USER EXISTS -----------
    const q = query(collection(db, "users"), where("phone", "==", phoneNumber));
    const querySnapshot = await getDocs(q);

    let userDoc = null;

    // If user doesn't exist, create new user
    if (querySnapshot.empty) {
      console.log("👤 User not found. Creating new user...");

      try {
        const newUser = await addDoc(collection(db, "users"), {
          phone: phoneNumber,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
        });

        userDoc = {
          docId: newUser.id,
          phone: phoneNumber,
          isNewUser: true,
        };

        console.log("✅ New user created:", newUser.id);
      } catch (dbError) {
        console.error("❌ Error creating user:", dbError);
        return Response.json(
          {
            success: false,
            error: "Failed to create user account",
          },
          { status: 500 }
        );
      }
    } else {
      // User exists
      const existingUser = querySnapshot.docs[0];
      userDoc = {
        docId: existingUser.id,
        phone: phoneNumber,
        isNewUser: false,
      };

      console.log("✅ User found:", existingUser.id);
    }

    // ----------- SEND OTP USING 2FACTOR API -----------
    console.log("📧 Sending OTP via 2Factor API...");

    const apiKey = process.env.TWO_FACTOR_API_KEY;

    if (!apiKey) {
      console.error("❌ 2Factor API key not configured");
      return Response.json(
        {
          success: false,
          error: "OTP service not configured",
        },
        { status: 500 }
      );
    }

    const apiUrl = `https://2factor.in/API/V1/${apiKey}/SMS/+91${phoneNumber}/AUTOGEN`;

    let otpResponse;
    try {
      otpResponse = await fetch(apiUrl, {
        method: "GET",
        timeout: 10000,
      });
    } catch (fetchError) {
      console.error("❌ OTP API connection error:", fetchError);
      return Response.json(
        {
          success: false,
          error: "OTP service temporarily unavailable. Please try again.",
        },
        { status: 503 }
      );
    }

    const data = await otpResponse.json();

    console.log("📊 2Factor API Response Status:", data.Status);

    // Check if OTP sent successfully
    if (data.Status !== "Success") {
      console.error("❌ OTP send failed:", data.Details);
      return Response.json(
        {
          success: false,
          error: data.Details || "Failed to send OTP. Please try again.",
        },
        { status: 400 }
      );
    }

    console.log("✅ OTP sent successfully");

    // ----------- SUCCESS RESPONSE -----------
    return Response.json({
      success: true,
      message: `OTP sent to +91${phoneNumber}`,
      sessionId: data.Details,
      isNewUser: userDoc.isNewUser,
    });

  } catch (error) {
    console.error("❌ Send OTP Error:", error);

    return Response.json(
      {
        success: false,
        error: "Internal server error. Please try again.",
      },
      { status: 500 }
    );
  }
}