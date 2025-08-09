"use client";

export default function SocialAuth() {
  const onCustomGoogleLoginClick = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const redirectUri = window.location.origin + "/api/auth/google-callback";
    const scope = "openid email profile";
    const responseType = "code";
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=${responseType}&scope=${scope}`;

    window.open(url, "google-login", "width=500,height=600");
  };

  return (
    <button
      style={{
        backgroundColor: "#4285f4",
        color: "white",
        borderRadius: "4px",
        padding: "10px 20px",
        fontSize: "16px",
        border: "none",
        cursor: "pointer",
        marginTop: "1rem",
      }}
      onClick={onCustomGoogleLoginClick}
    >
      Влез с Google
    </button>
  );
}
