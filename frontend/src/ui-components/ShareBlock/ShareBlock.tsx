'use client';

import { useState } from 'react';
import { FaFacebookF, FaWhatsapp, FaViber } from 'react-icons/fa';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Textarea } from '@/components/ui/Input/Textarea';
import styles from './ShareBlock.module.css';

interface ShareBlockProps {
  shareUrl: string;
  invitationId: number;
}

export const ShareBlock = ({ shareUrl, invitationId }: ShareBlockProps) => {
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("Здравей, натисни линка очаква те изненада!");

  const combinedText = `${message ? message + '\n\n' : ''}${shareUrl}`;
  const encodedMessageWithLink = encodeURIComponent(combinedText);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(combinedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className={styles.share}>
      <h3>Сподели поканата</h3>

      <Input
        id={`invitation-link-${invitationId}`}
        name={`invitation-link-${invitationId}`}
        value={shareUrl}
        onChange={() => {}}
        onFocus={(e) => e.target.select()}
        disabled
        icon="link"
        label="Линк за гостите"
        size="large"
      />

      <Textarea
        id="share-message"
        name="share-message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        label="Съобщение за споделяне"
        size="large"
      />

      <div className={styles.copy}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Button variant="secondary" size="middle" onClick={handleCopy}>
            Копирай
            <span className="material-symbols-outlined">content_copy</span>
          </Button>
          {copied && (
            <div className={styles.copy_feedback}>
              <p>Копирано</p>
              <span className="material-symbols-outlined" style={{ color: 'green' }}>
                done_all
              </span>
            </div>
          )}
        </div>
      </div>

      <div className={styles.socials}>
        <h5>Сподели с</h5>
        <div className={styles.socials_inner}>
          <a
            className={styles.viber}
            href={`viber://forward?text=${encodedMessageWithLink}`}
            target="_blank"
          >
            <FaViber />
          </a>
          <a
            className={styles.whatsapp}
            href={`https://api.whatsapp.com/send?text=${encodedMessageWithLink}`}
            target="_blank"
          >
            <FaWhatsapp />
          </a>
          <a
            className={styles.facebook}
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
              shareUrl
            )}&quote=${encodeURIComponent(message)}`}
            target="_blank"
          >
            <FaFacebookF />
          </a>
        </div>
      </div>
    </div>
  );
};
