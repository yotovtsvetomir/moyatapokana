"use client";

export default function SocialAuth({ user }: { user?: boolean }) {
  const onCustomGoogleLoginClick = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const redirectUri = window.location.origin + "/api/auth/google-callback";
    const scope = "openid email profile";
    const responseType = "code";
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=${responseType}&scope=${scope}`;

    window.open(url, "google-login", "width=500,height=600");
  };

  const onCustomFacebookLoginClick = () => {
    const clientId = process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID;
    const redirectUri = window.location.origin + "/api/auth/facebook-callback";
    const scope = "email,public_profile";
    const responseType = "code";
    const authType = "rerequest";

    const url = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=${responseType}&scope=${scope}&auth_type=${authType}`;

    window.open(url, "facebook-login", "width=500,height=600");
  };

  // Button style helper
  const buttonStyle = (bgColor: string, isDisabled?: boolean) => ({
    backgroundColor: bgColor,
    color: "white",
    borderRadius: "4px",
    padding: "10px 20px",
    fontSize: "16px",
    border: "none",
    cursor: isDisabled ? "not-allowed" : "pointer",
    opacity: isDisabled ? 0.5 : 1,
    transition: "opacity 0.2s",
  });

  return (
    <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
      <button
        style={buttonStyle("#4285f4", user)}
        disabled={user}
        onClick={onCustomGoogleLoginClick}
      >
        Влез с Google
      </button>

      <button
        style={buttonStyle("#1877f2", user)}
        disabled={user}
        onClick={onCustomFacebookLoginClick}
      >
        Влез с Facebook
      </button>
    </div>
  );
}
