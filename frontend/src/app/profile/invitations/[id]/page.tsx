'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Spinner } from '@/ui-components/Spinner/Spinner';
import { Button } from '@/ui-components/Button/Button';
import ConfirmModal from '@/ui-components/ConfirmModal/ConfirmModal';
import { ShareBlock } from '@/ui-components/ShareBlock/ShareBlock';
import type { components } from '@/shared/types';
import styles from './invitation-detail.module.css';

type Invitation = components['schemas']['InvitationRead'];

const statusLabels: Record<string, string> = {
  draft: 'Чернова',
  active: 'Активна',
  expired: 'Изтекла',
};

export default function InvitationDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPurchaseConfirm, setShowPurchaseConfirm] = useState(false);

  useEffect(() => {
    const fetchInvitation = async () => {
      try {
        const res = await fetch(`/api/invitations/${id}`);
        if (!res.ok) throw new Error('Failed to fetch invitation');

        const data: Invitation = await res.json();
        setInvitation(data);
      } catch (err) {
        console.error(err);
        setInvitation(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchInvitation();
  }, [id]);

  const handleDelete = async () => {
    if (!invitation) return;

    try {
      const res = await fetch(`/api/invitations/delete/${invitation.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        alert(data?.error || 'Failed to delete invitation');
        return;
      }

      router.push('/profile/invitations');
    } catch (err) {
      console.error(err);
      alert('Server error while deleting invitation.');
    }
  };

  if (loading) return <Spinner />;
  if (!invitation) return <p>Поканата не беше намерена.</p>;

  const shareUrl = `${process.env.NEXT_PUBLIC_CLIENT_URL}/invitations/preview/${invitation.slug}/`;

  return (
    <div className="container fullHeight steps">
      <div className={styles.invitation}>
        <div className={styles.actions}>
          <Button
            variant="ghost"
            size="middle"
            onClick={() => router.push("/profile/invitations")}
            width="47%"
            icon="arrow_back"
            iconPosition="left"
          >
            Назад
          </Button>

          {!invitation.is_active && (
            <Button
              variant="secondary"
              size="middle"
              width="47%"
              href={`/invitations/edit/${invitation.id}/settings/`}
              icon="edit"
              iconPosition="right"
            >
              Редактирай
            </Button>
          )}
        </div>

        <h1 className={styles.heading}>{invitation.title || 'Без заглавие'}</h1>

        <div className={styles.imageWrapper}>
          {invitation.wallpaper ? (
            <Image
              src={invitation.wallpaper}
              alt="Преглед на поканата"
              fill
              unoptimized
              className={styles.thumbnail}
            />
          ) : (
            <div className={styles.placeholder}>
              <span className="material-symbols-outlined">wallpaper</span>
            </div>
          )}
        </div>

        <div className={styles.invitationInfo}>
          {[
            {
              label: 'Създадена на',
              value: invitation.created_at
                ? new Date(invitation.created_at).toLocaleDateString('bg-BG')
                : '—',
            },
            { label: 'Игра', value: invitation.selected_game_obj?.name ?? 'Без' },
            { label: 'Слайдшоу', value: invitation.selected_slideshow_obj?.name ?? 'Без' },
            { label: 'Шрифт', value: invitation.font ?? 'Без' },
            { label: 'Тема', value: invitation.theme ?? 'Без' },
            {
              label: 'Статус',
              value: statusLabels[invitation.status] ?? invitation.status,
            },
            { label: 'Онлайн', value: invitation.is_active ? 'Да' : 'Не' },
          ].map((item) => (
            <div key={item.label} className={styles.infoPair}>
              <h5>{item.label}</h5>
              <p>{item.value}</p>
            </div>
          ))}
        </div>

        <div className={styles.secondary_actions}>
          <Button
            variant="secondary"
            size="large"
            width="100%"
            href={`/invitations/edit/${invitation.id}/settings/step1`}
            icon="visibility"
            iconPosition="right"
          >
            Визуализирация
          </Button>

          {invitation.status === 'active' && (
            <Button
              variant="primary"
              size="middle"
              width="100%"
              href={`/profile/invitations/${invitation.id}/guests`}
              icon="group"
              iconPosition="right"
            >
              Гости
            </Button>
          )}

          {invitation.status === 'draft' && (
            <Button
              variant="primary"
              size="middle"
              width="100%"
              icon="shopping_cart"
              iconPosition="right"
              onClick={() => setShowPurchaseConfirm(true)}
            >
              Купи
            </Button>
          )}
        </div>

        {!invitation.is_active && (
          <div className={styles.deleteActions}>
            <Button
              type="button"
              variant="danger"
              size="middle"
              width="100%"
              icon="delete"
              iconPosition="left"
              onClick={() => setShowConfirm(true)}
            >
              Изтрий
            </Button>
          </div>
        )}

        {showConfirm && (
          <ConfirmModal
            title="Изтриване на поканата"
            description="Наистина ли искате да изтриете тази покана? Това действие е необратимо."
            confirmText="Изтрий"
            cancelText="Отказ"
            danger
            onConfirm={() => {
              setShowConfirm(false);
              handleDelete();
            }}
            onCancel={() => setShowConfirm(false)}
          />
        )}

        {invitation.is_active && (
          <div className={styles.share}>
            <ShareBlock shareUrl={shareUrl} invitationId={invitation.id} />
          </div>
        )}

        {showConfirm && (
          <ConfirmModal
            title="Изтриване на поканата"
            description="Наистина ли искате да изтриете тази покана? Това действие е необратимо."
            confirmText="Изтрий"
            cancelText="Отказ"
            danger
            onConfirm={() => {
              setShowConfirm(false);
              handleDelete();
            }}
            onCancel={() => setShowConfirm(false)}
          />
        )}

        {showPurchaseConfirm && (
          <ConfirmModal
            title="Сигурни ли сте?"
            description={[
              "След активиране, тази покана не може да бъде редактирана. Моля, прегледайте внимателно съдържанието, преди да продължите.",
              "Ако все пак откриете грешка след активиране, пишете ни на support@moyatapokana.com.",
            ]}
            confirmText="Продължи"
            cancelText="Назад"
            onConfirm={() => {
              setShowPurchaseConfirm(false);
              router.push(`/checkout/${invitation.id}`);
            }}
            onCancel={() => setShowPurchaseConfirm(false)}
          />
        )}
      </div>
    </div>
  );
}
