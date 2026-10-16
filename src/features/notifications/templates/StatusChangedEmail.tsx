import { Html, Body, Container, Heading, Text, Section, Hr } from '@react-email/components';
import * as React from 'react';
import { formatTrackingCode } from '@/shared/tracking/tracking-code';

const colors = {
  primary: '#0088C1',
  background: '#D6F2FE',
  white: '#ffffff',
  text: '#000000',
  danger: '#B91C1C',
  border: '#E5E7EB',
};

export default function StatusChangedEmail({
  candidateName,
  status,
  trackingCode,
  comment,
  isRejection = false,
}: {
  candidateName: string;
  status: string;
  trackingCode: string;
  /** Message facultatif de la RH : motif du refus ou consignes d'intégration. */
  comment?: string | null;
  isRejection?: boolean;
}) {
  const trimmedComment = comment?.trim();

  return (
    <Html>
      <Body style={{ fontFamily: 'Montserrat, sans-serif', backgroundColor: colors.background, padding: '20px' }}>
        <Container style={{ backgroundColor: colors.white, padding: '30px', borderRadius: '8px', border: `1px solid ${colors.primary}` }}>
          <Heading style={{ color: colors.primary, fontSize: '24px' }}>
            Mise à jour de votre candidature
          </Heading>
          
          <Text style={{ fontSize: '16px', color: colors.text }}>
            Bonjour {candidateName},
          </Text>
          
          <Text style={{ fontSize: '16px', color: colors.text }}>
            Le statut de votre demande de stage chez <strong>Bridge Technologies Solutions</strong> a été mis à jour.
          </Text>

          <Section style={{ backgroundColor: colors.background, padding: '15px', borderRadius: '5px', textAlign: 'center' }}>
            <Text style={{ margin: '0', fontSize: '14px' }}>Nouveau statut :</Text>
            <Text style={{ margin: '5px 0 0 0', fontSize: '20px', fontWeight: 'bold', color: colors.primary }}>
              {status}
            </Text>
          </Section>

          {trimmedComment && (
            <Section
              style={{
                marginTop: '20px',
                padding: '15px',
                borderRadius: '5px',
                backgroundColor: colors.white,
                borderLeft: `4px solid ${isRejection ? colors.danger : colors.primary}`,
                border: `1px solid ${colors.border}`,
              }}
            >
              <Text
                style={{
                  margin: '0 0 8px 0',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: isRejection ? colors.danger : colors.primary,
                }}
              >
                {isRejection ? 'Motif' : 'Message de notre équipe'}
              </Text>
              {/* whiteSpace: pre-line — la RH saisit un texte libre multi-lignes. */}
              <Text
                style={{
                  margin: '0',
                  fontSize: '15px',
                  color: colors.text,
                  whiteSpace: 'pre-line',
                }}
              >
                {trimmedComment}
              </Text>
            </Section>
          )}

          <Text style={{ fontSize: '14px', marginTop: '20px' }}>
            Code de suivi : <strong>{formatTrackingCode(trackingCode)}</strong>
          </Text>

          <Hr style={{ margin: '20px 0', border: `1px solid ${colors.background}` }} />
          
          <Text style={{ fontSize: '12px', color: '#878786', textAlign: 'center' }}>
            Ceci est une notification automatique. Merci de ne pas répondre à cet email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}