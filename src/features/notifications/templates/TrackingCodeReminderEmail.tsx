import { Html, Body, Container, Heading, Text, Section, Button, Hr } from '@react-email/components';
import * as React from 'react';
import { formatTrackingCode } from '@/shared/tracking/tracking-code';

const colors = {
  primary: '#0088C1',
  background: '#D6F2FE',
  white: '#ffffff',
  text: '#000000',
};

export type TrackingCodeReminderItem = {
  trackingCode: string;
  typeLabel: string;
  statusLabel: string;
  submittedOn: string;
};

/**
 * Rappel du ou des codes de suivi rattachés à une adresse.
 *
 * Une même adresse peut porter plusieurs candidatures (`Profile.email` n'est
 * pas unique) : elles sont toutes listées, sinon le candidat ne recevrait le
 * code que d'un seul de ses dossiers sans savoir lequel.
 */
export default function TrackingCodeReminderEmail({
  candidateName,
  items,
  suiviUrl,
}: {
  candidateName: string;
  items: TrackingCodeReminderItem[];
  suiviUrl: string;
}) {
  const isPlural = items.length > 1;

  return (
    <Html>
      <Body style={{ fontFamily: 'Montserrat, sans-serif', backgroundColor: colors.background, padding: '20px' }}>
        <Container style={{ backgroundColor: colors.white, padding: '30px', borderRadius: '8px', border: `1px solid ${colors.primary}` }}>
          <Heading style={{ color: colors.primary, fontSize: '24px' }}>
            {isPlural ? 'Vos codes de suivi' : 'Votre code de suivi'}
          </Heading>

          <Text style={{ fontSize: '16px', color: colors.text }}>
            Bonjour {candidateName},
          </Text>

          <Text style={{ fontSize: '16px', color: colors.text }}>
            Vous avez demandé à recevoir {isPlural ? 'les codes de suivi' : 'le code de suivi'} de{' '}
            {isPlural ? 'vos candidatures' : 'votre candidature'} chez{' '}
            <strong>Bridge Technologies Solutions</strong>.
          </Text>

          {items.map((item) => (
            <Section
              key={item.trackingCode}
              style={{ backgroundColor: '#f0f0f0', padding: '15px', borderRadius: '5px', textAlign: 'center', margin: '16px 0' }}
            >
              <Text style={{ margin: '0', fontSize: '13px', color: '#555' }}>
                Stage {item.typeLabel} — déposée le {item.submittedOn}
              </Text>
              <Text style={{ margin: '5px 0 0 0', fontSize: '20px', fontWeight: 'bold', color: colors.primary, letterSpacing: '1px' }}>
                {formatTrackingCode(item.trackingCode)}
              </Text>
              <Text style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#555' }}>
                Statut actuel : {item.statusLabel}
              </Text>
            </Section>
          ))}

          <Section style={{ textAlign: 'center', margin: '28px 0' }}>
            <Button
              href={suiviUrl}
              style={{
                backgroundColor: colors.primary,
                color: colors.white,
                padding: '12px 24px',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: 'bold',
                textDecoration: 'none',
              }}
            >
              Suivre ma candidature
            </Button>
          </Section>

          <Hr style={{ margin: '20px 0', border: `1px solid ${colors.background}` }} />

          <Text style={{ fontSize: '12px', color: '#878786', textAlign: 'center' }}>
            Vous n&apos;êtes pas à l&apos;origine de cette demande ? Ignorez cet
            email. {isPlural ? 'Ces codes restent inchangés' : 'Ce code reste inchangé'} et
            n&apos;{isPlural ? 'ont' : 'a'} été envoyé{isPlural ? 's' : ''} qu&apos;à
            l&apos;adresse de {isPlural ? 'vos dossiers' : 'votre dossier'}.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
