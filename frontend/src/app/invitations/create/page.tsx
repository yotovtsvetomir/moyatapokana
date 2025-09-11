"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/ui-components/Spinner/Spinner";
import Modal from "@/ui-components/Modal/Modal";
import { useInvitation } from "@/context/InvitationContext";
import { useUser } from "@/context/UserContext";

export default function CreateInvitationPage() {
  const router = useRouter();
  const { setInvitation, loading, setLoading } = useInvitation();
  const { user } = useUser();

  // State
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [existingDraftId, setExistingDraftId] = useState<number | null>(null);

  // Determine modal content based on user
  const modalDescription = user
    ? `${errorMessage}. Моля, отидете във вашия профил, за да изтриете старата чернова.`
    : `${errorMessage}. Искате ли да изтриете старата и да създадете нова?`;

  const modalConfirmText = user ? "Отиди в профила" : "Да, създай нова";

  // Handlers
  const handleCancel = () => {
    if (user) {
      router.push("/profile/invitations");
    } else if (existingDraftId) {
      router.push(`/invitations/edit/${existingDraftId}`);
    } else {
      setShowModal(false);
    }
  };

  const handleConfirmReplace = async () => {
    if (!existingDraftId) return;

    setShowModal(false);
    setLoading(true);

    try {
      // Delete existing draft (anonymous user)
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invitations/delete/${existingDraftId}`, {
        method: "DELETE",
        credentials: "include",
      });

      // Create new draft
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invitations/create`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error?.error || "Failed to create new invitation");

      setInvitation(data);
      router.push(`/invitations/edit/${data.id}`);
    } catch (err: unknown) {
      if (err instanceof Error) setErrorMessage(err.message);
      else setErrorMessage("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Effect: create invitation on mount
  useEffect(() => {
    const createInvitation = async () => {
      setLoading(true);

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invitations/create`, {
          method: "POST",
          credentials: "include",
        });
        const data = await res.json();

        if (!res.ok) {
          // Draft limit reached
          if (data.detail?.existingDraftId != null) {
            setExistingDraftId(data.detail.existingDraftId);
            setErrorMessage(data.detail.error);
            setShowModal(true);
            return;
          }
          throw new Error(data.detail?.error || "Failed to create invitation");
        }

        // Successfully created
        setInvitation(data);
        router.push(`/invitations/edit/${data.id}`);
      } catch (err: unknown) {
        if (err instanceof Error) setErrorMessage(err.message);
        else setErrorMessage("Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    createInvitation();
  }, [router, setInvitation, setLoading]);

  return (
    <div className="container fullHeight flexCenter">
      {loading && <Spinner size={60} />}

      {showModal && (
        <Modal
          title="Вече имате чернова"
          description={modalDescription}
          confirmText={modalConfirmText}
          cancelText={user ? "Откажи" : "Отказ"}
          onConfirm={user ? handleCancel : handleConfirmReplace}
          onCancel={handleCancel}
          danger={!user}
        />
      )}
    </div>
  );
}
