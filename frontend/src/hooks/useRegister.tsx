import { useState } from "react";
import { components } from "@/shared/types";

type RegisterFormValues = components["schemas"]["UserCreate"];

type RegisterFormErrors = {
  [K in keyof RegisterFormValues]?: string;
} & {
  confirmPassword?: string;
  apiError?: string;
};

export function useRegister() {
  const [values, setValues] = useState<RegisterFormValues>({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fbReady, setFbReady] = useState(true);

  const validate = () => {
    const newErrors: RegisterFormErrors = {};

    if (!values.first_name || values.first_name.length < 2) {
      newErrors.first_name = "Името трябва да е поне 2 символа";
    }

    if (!values.last_name || values.last_name.length < 2) {
      newErrors.last_name = "Фамилията трябва да е поне 2 символа";
    }

    if (!values.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      newErrors.email = "Имейлът трябва да е валиден";
    }

    if (!values.password || values.password.length < 7) {
      newErrors.password = "Паролата трябва да е поне 7 символа";
    }

    if (values.password !== confirmPassword) {
      newErrors.confirmPassword = "Паролите не съвпадат";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues({ ...values, [name]: value } as RegisterFormValues);
  };

  const handleConfirmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
  };

  const handleFocus = (field: keyof RegisterFormErrors) => () => {
    setErrors({ ...errors, [field]: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrors({ apiError: data.error || "Регистрацията неуспешна" });
        return;
      }

      setSuccess(true);
      window.location.href = "/profile";
    } catch (error) {
      setErrors({
        apiError: error instanceof Error ? error.message : "Сървърна грешка",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const redirectUri = `${window.location.origin}/api/auth/google-callback`;
    const scope = "openid email profile";
    const responseType = "code";

    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=${responseType}&scope=${scope}`;
    window.open(url, "google-register", "width=500,height=600");
  };

  const handleFacebookRegister = () => {
    const clientId = process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID;
    const redirectUri = `${window.location.origin}/api/auth/facebook-callback`;
    const scope = "email,public_profile";
    const responseType = "code";
    const authType = "rerequest";

    const url = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=${responseType}&scope=${scope}&auth_type=${authType}`;
    window.open(url, "facebook-register", "width=500,height=600");
  };

  return {
    values,
    confirmPassword,
    errors,
    loading,
    success,
    fbReady,
    handleChange,
    handleConfirmChange,
    handleFocus,
    handleSubmit,
    handleGoogleRegister,
    handleFacebookRegister,
  };
}
