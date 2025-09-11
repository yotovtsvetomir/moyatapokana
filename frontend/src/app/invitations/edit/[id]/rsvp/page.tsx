"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/ui-components/Button/Button";
import RadioButton from "@/ui-components/RadioButton/RadioButton";
import { Spinner } from "@/ui-components/Spinner/Spinner";
import { useInvitation } from "@/context/InvitationContext";
import styles from "./rsvp.module.css";

export default function RSVPPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter()
  const { invitation, setInvitation, loading, setLoading } = useInvitation();

  const [menuEnabled, setMenuEnabled] = useState<"yes" | "no" | null>(null);
  const [wasSubmitted, setWasSubmitted] = useState(false);

  useEffect(() => {
    if (invitation?.rsvp) {
      setMenuEnabled(invitation.rsvp.ask_menu ? "yes" : "no");
    }
  }, [invitation]);

  if (loading) return <Spinner size={60} />;
  if (!invitation) return <p>Не е намерена покана</p>;

  const handleContinue = async () => {
    setWasSubmitted(true);

    if (menuEnabled === null) return;

    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invitations/update/${invitation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          rsvp: { ask_menu: menuEnabled === "yes" }
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        console.error("Грешка при запис на меню опцията", error);
        return;
      }

      const updated = await res.json();
      setInvitation(updated);
      router.push(`/invitations/edit/${id}/preview`)
    } catch (err) {
      console.error("Грешка при запис на меню опцията", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container fullHeight centerWrapper steps">
      <div className={styles.rsvp}>
        <h1>Покана #{invitation.id} - Присъствие</h1>

        <p>
          След активиране на поканата ще получите линк, който да споделите с вашите гости.
          Чрез него те ще могат да потвърдят присъствието си (RSVP).
        </p>

        <p>
          Можете да включите възможност за избор на меню, който гостите ще попълнят при потвърждението си.
        </p>

        <div className={styles.menu}>
          <h5>Предлагани менюта:</h5>
          <ul>
            <li>Вегетарианско</li>
            <li>Месо</li>
            <li>Риба</li>
            <li>Детско меню</li>
          </ul>
        </div>

        <div className={styles.choice}>
          <h4>Искате ли да включите избор на меню в поканата?</h4>

          <div>
            <RadioButton
              name="menuOption"
              label="Да"
              value="yes"
              selected={menuEnabled === "yes"}
              onSelect={() => setMenuEnabled("yes")}
            />
            <RadioButton
              name="menuOption"
              label="Не"
              value="no"
              selected={menuEnabled === "no"}
              onSelect={() => setMenuEnabled("no")}
            />
          </div>

          {wasSubmitted && menuEnabled === null && (
            <p className={styles.validationMessage}>
              Моля, изберете дали да включите избор на меню.
            </p>
          )}
        </div>

        <p>
          Ще виждате кой ще присъства, кой е отказал, както и — ако активирате тази опция — информация за избора на меню на всеки гост, заедно с обобщена бройка на избраните менюта.
        </p>

        <div className={styles.buttons}>
          <Button
            href={`/invitations/edit/${invitation.id}/events/`}
            variant="ghost"
            size="large"
            width="100%"
            icon="arrow_back"
            iconPosition="left"
          >
            Назад
          </Button>

          <Button
            variant="primary"
            size="large"
            width="100%"
            onClick={handleContinue}
            icon="arrow_forward"
            iconPosition="right"
          >
            Продължи
          </Button>
        </div>
      </div>
    </div>
  );
}