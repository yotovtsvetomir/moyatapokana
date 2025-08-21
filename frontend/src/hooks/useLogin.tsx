import { useState } from "react";

export function useLogin() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fbReady, setFbReady] = useState(true); // or false if you want to lazy-load FB SDK

  const validate = () => {
    const errors: { [key: string]: string } = {};
    if (!formData.email) errors.email = "Email е задължителен";
    if (!formData.password) errors.password = "Паролата е задължителна";
    return errors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFocus = (field: string) => () => {
    setFormErrors({ ...formErrors, [field]: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        setFormErrors({ apiError: data.detail || "Входът неуспешен" });
        return;
      }

      setSuccess(true);
      window.location.href = "/profile";
    } catch (error) {
      setFormErrors({
        apiError: error instanceof Error ? error.message : "Сървърна грешка",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const redirectUri = `${window.location.origin}/api/auth/google-callback`;
    const scope = "openid email profile";
    const responseType = "code";

    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=${responseType}&scope=${scope}`;
    window.open(url, "google-login", "width=500,height=600");
  };

  const handleFacebookLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID;
    const redirectUri = `${window.location.origin}/api/auth/facebook-callback`;
    const scope = "email,public_profile";
    const responseType = "code";
    const authType = "rerequest";

    const url = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=${responseType}&scope=${scope}&auth_type=${authType}`;
    window.open(url, "facebook-login", "width=500,height=600");
  };

  return {
    formData,
    formErrors,
    loading,
    success,
    fbReady,
    handleChange,
    handleFocus,
    handleSubmit,
    handleGoogleLogin,
    handleFacebookLogin,
  };
}
