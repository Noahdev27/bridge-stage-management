import { Html, Body, Container, Heading, Text, Section, Hr, Button } from '@react-email/components';
import * as React from 'react';

const colors = {
  primary: '#0088C1',
  background: '#D6F2FE',
  white: '#ffffff',
  text: '#000000',
};

export default function NewApplicationEmail({
  candidateName,
  internshipTypeLabel,
  offerTitle,
  dossierUrl,
}: {
  candidateName: string;
  internshipTypeLabel: string;
  offerTitle: string | null;
  dossierUrl: string;
}) {
  return (
    <Html>
      <Body style={{ fontFamily: 'Montserrat, sans-serif', backgroundColor: colors.background, padding: '20px' }}>
        <Container style={{ backgroundColor: colors.white, padding: '30px', borderRadius: '8px', border: `1px solid ${colors.primary}` }}>
          <Heading style={{ color: colors.primary, fontSize: '24px' }}>
            Nouvelle candidature reçue
          </Heading>

          <Section style={{ backgroundColor: colors.background, padding: '15px', borderRadius: '5px' }}>
            <Text style={{ margin: '0', fontSize: '14px' }}>
              Candidat : <strong>{candidateName}</strong>
            </Text>
            <Text style={{ margin: '5px 0 0 0', fontSize: '14px' }}>
              Type de stage : <strong>{internshipTypeLabel}</strong>
            </Text>
            <Text style={{ margin: '5px 0 0 0', fontSize: '14px' }}>
              Offre : <strong>{offerTitle ?? 'Candidature spontanée'}</strong>
            </Text>
          </Section>

          <Button
            href={dossierUrl}
            style={{ backgroundColor: colors.primary, color: colors.white, padding: '12px 20px', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold', marginTop: '20px', display: 'inline-block' }}
          >
            Ouvrir le dossier
          </Button>

          <Hr style={{ margin: '20px 0', border: `1px solid ${colors.background}` }} />

          <Text style={{ fontSize: '12px', color: '#878786', textAlign: 'center' }}>
            Notification automatique de la plateforme de gestion des stages Bridge.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
