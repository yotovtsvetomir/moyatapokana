import { useState } from "react";

type RegisterFormValues = components["schemas"]["UserCreate"];
type RegisterResponse = components["schemas"]["UserRead"];

type RegisterFormErrors = {
  [K in keyof RegisterFormValues]?: string;
} & {
  apiError?: string;
};

export function useRegister() {
  const [values, setValues] = useState<RegisterFormValues>({
    username: "",
    password: "",
  });
  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [loading, setLoading] = useState(false);

  const validate = (): RegisterFormErrors => {
    const errs: RegisterFormErrors = {};
    if (!values.username) {
      errs.username = "Моля, въведете имейл";
    } else if (!/\S+@\S+\.\S+/.test(values.username)) {
      errs.username = "Невалиден имейл формат";
    }
    if (!values.password) {
      errs.password = "Моля, въведете парола";
    } else if (values.password.length < 8) {
      errs.password = "Паролата трябва да е поне 8 символа";
    }
    return errs;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (onSuccess: (data: RegisterResponse) => void) => async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrors({ apiError: data.detail || "Регистрацията неуспешна" });
      } else {
        const data: RegisterResponse = await res.json();
        onSuccess(data);
      }
    } catch (error) {
      if (error instanceof Error) {
        setErrors({ apiError: error.message });
      } else {
        setErrors({ apiError: "Възникна грешка" });
      }
    } finally {
      setLoading(false);
    }
  };

  return { values, errors, loading, handleChange, handleSubmit };
}
