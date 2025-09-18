"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function GoogleCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    if (window.opener) {
      window.opener.location = "/профил";
      window.close();
    } else {
      router.push("/");
    }
  }, [router]);

  return <div>Closing...</div>;
}
