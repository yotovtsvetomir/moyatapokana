'use client';

import React, { useState } from 'react';
import { Input } from '@/ui-components/Input/Input';
import { Button } from '@/ui-components/Button/Button';
import RadioButton from '@/ui-components/RadioButton/RadioButton';
import ReactSelect, { Option } from '@/ui-components/Select/ReactSelect';
import ConfirmModal from '@/ui-components/ConfirmModal/ConfirmModal';
import { toast, Toaster } from 'react-hot-toast';
import type { components } from '@/shared/types';
import { useInvitation } from '@/context/InvitationContext';
import styles from './rsvp.module.css';

type GuestCreate = components["schemas"]["GuestCreate"];
type GuestRead = components["schemas"]["GuestRead"];
type Invitation = components['schemas']['InvitationRead'];

const guestTypes: Option[] = [
  { label: 'Възрастен', value: 'adult' },
  { label: 'Дете', value: 'kid' },
];

const menuOptions: Option[] = [
  { label: 'Вегетарианско', value: 'veg' },
  { label: 'Месо', value: 'meat' },
  { label: 'Риба', value: 'fish' },
  { label: 'Детско меню', value: 'kid' },
];

const isCyrillic = (text: string) => /^[\u0400-\u04FF\s\-]+$/.test(text.trim());

export default function RSVPForm() {
  const { invitation } = useInvitation();
  const [mainGuest, setMainGuest] = useState<GuestCreate>({
    first_name: '',
    last_name: '',
    guest_type: 'adult',
    is_main_guest: true,
    attending: undefined,
    menu_choice: invitation?.rsvp.ask_menu ? 'meat' : undefined,
    sub_guests: [],
  });
  const [subGuests, setSubGuests] = useState<GuestCreate[]>([]);
  const [mainGuestErrors, setMainGuestErrors] = useState<{ first_name?: string; last_name?: string }>({});
  const [subGuestErrors, setSubGuestErrors] = useState<{ [key: number]: { first_name?: string; last_name?: string } }>({});
  const [submittedGuests, setSubmittedGuests] = useState<GuestRead[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [duplicatesList, setDuplicatesList] = useState<string[]>([]);

  const isCyrillic = (text: string) => /^[\u0400-\u04FF\s\-]+$/.test(text.trim());

  if (!invitation) return <div>Loading...</div>;

  const canSubmit =
    mainGuest.attending !== undefined &&
    mainGuest.first_name.trim() !== '' &&
    mainGuest.last_name.trim() !== '';

  const hasInvalidNames =
    !isCyrillic(mainGuest.first_name) ||
    !isCyrillic(mainGuest.last_name) ||
    subGuests.some(sg => !isCyrillic(sg.first_name) || !isCyrillic(sg.last_name));

  const handleMainGuestChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMainGuest(prev => ({ ...prev, [name]: value }));
    if (!isCyrillic(value)) {
      setMainGuestErrors(prev => ({ ...prev, [name]: 'Името трябва да е на кирилица' }));
    } else {
      setMainGuestErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubGuestChange = (index: number, field: string, value: string) => {
    setSubGuests(prev => prev.map((sg, i) => (i === index ? { ...sg, [field]: value } : sg)));
    if (!isCyrillic(value)) {
      setSubGuestErrors(prev => ({ ...prev, [index]: { ...(prev[index] || {}), [field]: 'Името трябва да е на кирилица' } }));
    } else {
      setSubGuestErrors(prev => ({ ...prev, [index]: { ...(prev[index] || {}), [field]: undefined } }));
    }
  };

  const handleRemoveSubGuest = (index: number) => {
    setSubGuests(prev => prev.filter((_, i) => i !== index));
    setSubGuestErrors(prev => {
      const copy = { ...prev };
      delete copy[index];
      return copy;
    });
  };

  const handleMenuChoiceChange = (option: Option | null) => {
    setMainGuest(prev => ({
      ...prev,
      menu_choice: option?.value || undefined,
    }));
  };

  const handleSubGuestMenuChange = (index: number, option: Option | null) => {
    setSubGuests(prev =>
      prev.map((sg, i) =>
        i === index ? { ...sg, menu_choice: option?.value || undefined } : sg
      )
    );
  };

  const handleGuestTypeChange = (value: string) => {
    setMainGuest(prev => ({
      ...prev,
      guest_type: value,
    }));
  };

  const handleSubGuestTypeChange = (index: number, value: string) => {
    setSubGuests(prev =>
      prev.map((sg, i) =>
        i === index ? { ...sg, guest_type: value } : sg
      )
    );
  };

  const handleSubmit = async (confirmAdd = false) => {
    setLoading(true);
    try {
      const payload = { ...mainGuest, sub_guests: subGuests };
      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/invitations/guest/${invitation.slug}`);
      if (confirmAdd) url.searchParams.append('confirm_add', 'true');

      const res = await fetch(url.toString(), {
        method: 'POST',
        credentials: "include",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        if (res.status === 409 && errData.detail?.includes('Гост с това име')) {
          // Backend returned duplicates
          setDuplicatesList(errData.detail.split(':')[1].split(',').map(s => s.trim()));
          setShowConfirmModal(true);
          return;
        }
        throw new Error(errData.detail || 'Failed to submit RSVP');
      }

      const data: GuestRead = await res.json();
      setSubmittedGuests([data, ...(data.sub_guests || [])]);
      toast.success('RSVP записан успешно!');
    } catch (err: any) {
      toast.error(`Грешка: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmModal = () => {
    setShowConfirmModal(false);
    handleSubmit(true); // send with confirm flag
  };

  const handleButtonClick = () => {
    if (!canSubmit) {
      toast.error('Моля, напишете имената си, селектирайте дали ще присъствате и изпратете.');
      return;
    }
    // Validate Cyrillic
    if (!isCyrillic(mainGuest.first_name) || !isCyrillic(mainGuest.last_name)) {
      toast.error('Името и фамилията трябва да са на кирилица.');
      return;
    }
    for (const sg of subGuests) {
      if (!isCyrillic(sg.first_name) || !isCyrillic(sg.last_name)) {
        toast.error('Имената на всички гости трябва да са на кирилица.');
        return;
      }
    }
    handleSubmit(false);
  };

  const handleAttendingYes = () => {
    setMainGuest(prev => ({ ...prev, attending: true }));
    toast.success('Ако сте група от семейство или приятели, моля само 1 човек потвърди за всички.');
  };

  const addSubGuest = () => {
    setSubGuests(prev => [
      ...prev,
      {
        first_name: '',
        last_name: '',
        guest_type: 'adult',
        menu_choice: invitation?.rsvp.ask_menu ? 'meat' : undefined,
        is_main_guest: false,
        attending: false,
      },
    ]);
  };

  // -------------------- Render --------------------
  if (submittedGuests) {
    return (
      <div className="container centerWrapper" style={{ '--primary-color': invitation.primary_color }}>
        <div className={styles.confirmation}>
          <h2>Потвърдихте</h2>
          <ul className={styles.confirmationList}>
            {submittedGuests.map((g, idx) => (
              <li key={idx} className={styles.confirmationGuest}>
                <span className={styles.guestName}>{g.first_name} {g.last_name}</span>
                <div className={styles.badge}>
                  <span>Възраст</span>
                  <span>{guestTypes.find(opt => opt.value === g.guest_type)?.label || g.guest_type}</span>
                </div>
                {g.menu_choice && (
                  <div className={styles.badge}>
                    <span>Меню</span>
                    <span>{menuOptions.find(opt => opt.value === g.menu_choice)?.label || g.menu_choice}</span>
                  </div>
                )}
              </li>
            ))}
          </ul>
          <h3>Благодарим ви</h3>
          <h3>за потвърждението! 😊</h3>
        </div>
      </div>
    );
  }

  // -------------------- RSVP Form --------------------
  return (
    <div className="container centerWrapper" style={{ '--primary-color': invitation.primary_color }}>
      <div className={styles.rsvp}>
        <Toaster
          position="top-center"
          reverseOrder={false}
          toastOptions={{
            duration: 7000,
            style: { padding: '1rem', borderRadius: '0.5rem', fontSize: '1rem', lineHeight: '1.3' },
          }}
        />

        {showConfirmModal && (
          <ConfirmModal
            title="Гост с това име вече е потвърден"
            description={duplicatesList}
            confirmText="Добави въпреки това"
            cancelText="Отказ"
            onConfirm={handleConfirmModal}
            onCancel={() => setShowConfirmModal(false)}
            danger
          />
        )}

        <h1>{invitation.title}</h1>
        <h2>Присъствие</h2>

        <Input
          id="first_name"
          name="first_name"
          label="Име"
          value={mainGuest.first_name}
          error={mainGuestErrors.first_name}
          color={invitation.primary_color}
          onChange={handleMainGuestChange}
        />

        <Input
          id="last_name"
          name="last_name"
          label="Фамилия"
          value={mainGuest.last_name}
          error={mainGuestErrors.last_name}
          color={invitation.primary_color}
          onChange={handleMainGuestChange}
        />

        <div className={styles.radioButtons}>
          <RadioButton
            label="Ще присъствам"
            name="attending"
            value="yes"
            color={invitation.primary_color}
            selected={mainGuest.attending === true}
            onSelect={handleAttendingYes}
          />
          <RadioButton
            label="Няма да присъствам"
            name="attending"
            value="no"
            color={invitation.primary_color}
            selected={mainGuest.attending === false}
            onSelect={() => setMainGuest(prev => ({ ...prev, attending: false }))}
          />
        </div>

        {mainGuest.attending && (
          <>
            <div className={styles.selects}>
              <ReactSelect
                options={guestTypes}
                color={invitation.primary_color}
                value={guestTypes.find(o => o.value === mainGuest.guest_type) || null}
                onChange={option => handleGuestTypeChange(option?.value || 'adult')}
                placeholder="Тип гост"
                isClearable={false}
              />
              {invitation.rsvp.ask_menu && (
                <ReactSelect
                  options={menuOptions}
                  color={invitation.primary_color}
                  value={menuOptions.find(o => o.value === mainGuest.menu_choice) || menuOptions.find(o => o.value === 'meat')}
                  onChange={handleMenuChoiceChange}
                  placeholder="Избери меню"
                  isClearable={false}
                />
              )}
            </div>

            <h2>Семейство и приятели</h2>
            <div className={styles.fandf}>
              {subGuests.map((sg, idx) => (
                <div key={idx} className={styles.subGuestBlock}>
                  <Input
                    id={`sub_first_name_${idx}`}
                    name="first_name"
                    label="Име"
                    value={sg.first_name}
                    error={subGuestErrors[idx]?.first_name}
                    color={invitation.primary_color}
                    onChange={e => handleSubGuestChange(idx, 'first_name', e.target.value)}
                  />
                  <Input
                    id={`sub_last_name_${idx}`}
                    name="last_name"
                    label="Фамилия"
                    value={sg.last_name}
                    error={subGuestErrors[idx]?.last_name}
                    color={invitation.primary_color}
                    onChange={e => handleSubGuestChange(idx, 'last_name', e.target.value)}
                  />

                  <ReactSelect
                    options={guestTypes}
                    value={guestTypes.find(o => o.value === sg.guest_type) || null}
                    onChange={option => handleSubGuestChange(idx, 'guest_type', option?.value || 'adult')}
                    color={invitation.primary_color}
                    placeholder="Тип гост"
                    isClearable={false}
                  />

                  <br />

                  {invitation.rsvp.ask_menu && (
                    <ReactSelect
                      options={menuOptions}
                      value={menuOptions.find(o => o.value === sg.menu_choice) || menuOptions.find(o => o.value === 'meat')}
                      onChange={option => handleSubGuestChange(idx, 'menu_choice', option?.value)}
                      placeholder="Избери меню"
                      color={invitation.primary_color}
                      isClearable={false}
                    />
                  )}

                  <div className={styles.subGuestActions}>
                    <Button
                      type="button"
                      variant="danger"
                      size="middle"
                      onClick={() => removeSubGuest(idx)}
                    >
                      Премахни
                    </Button>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="basic"
                size="large"
                width="100%"
                icon="add"
                iconPosition="left"
                color={invitation.primary_color}
                onClick={addSubGuest}
              >
                Добави
              </Button>
            </div>
          </>
        )}

        <div className={styles.main_actions}>
          <Button
            type="button"
            variant="basic"
            icon="mail"
            iconPosition="left"
            size="large"
            width="100%"
            color={invitation.primary_color}
            loading={loading}
            onClick={handleButtonClick}
            disabled={!canSubmit || hasInvalidNames}
          >
            Изпрати
          </Button>
        </div>
      </div>
    </div>
  );
}
