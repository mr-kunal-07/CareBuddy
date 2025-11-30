// app/api/verify-otp/route.js

export async function POST(req) {
    try {
        const { sessionId, otp } = await req.json();

        if (!sessionId || !otp) {
            return Response.json(
                {
                    success: false,
                    error: "Session ID and OTP are required",
                },
                { status: 400 }
            );
        }

        // Verify OTP with 2Factor API
        const verifyUrl = `https://2factor.in/API/V1/cf40c254-e385-11ef-8b17-0200cd936042/SMS/VERIFY/${sessionId}/${otp}`;

        const response = await fetch(verifyUrl);
        const data = await response.json();

        // Success
        if (data.Status === "Success") {
            return Response.json({
                success: true,
                message: "OTP verified successfully",
            });
        }

        // Invalid OTP
        return Response.json(
            {
                success: false,
                error: "Invalid OTP. Please try again.",
            },
            { status: 400 }
        );

    } catch (error) {
        console.error("Verify OTP Error:", error);

        return Response.json(
            {
                success: false,
                error: "Failed to verify OTP. Please try again.",
            },
            { status: 500 }
        );
    }
}
