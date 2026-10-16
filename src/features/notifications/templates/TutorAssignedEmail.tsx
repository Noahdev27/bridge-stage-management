import { Html, Body, Container, Heading, Text, Section, Hr } from '@react-email/components';
import * as React from 'react';

const colors = {
  primary: '#0088C1',
  background: '#D6F2FE',
  white: '#ffffff',
  text: '#000000',
};

export default function TutorAssignedEmail({
  tutorName,
  candidateName,
  internshipTypeLabel,
  startDateLabel,
}: {
  tutorName: string;
  candidateName: string;
  internshipTypeLabel: string;
  startDateLabel: string;
}) {
  return (
    <Html>
      <Body style={{ fontFamily: 'Montserrat, sans-serif', backgroundColor: colors.background, padding: '20px' }}>
        <Container style={{ backgroundColor: colors.white, padding: '30px', borderRadius: '8px', border: `1px solid ${colors.primary}` }}>
          <Heading style={{ color: colors.primary, fontSize: '24px' }}>
            Nouveau stagiaire à encadrer
          </Heading>

          <Text style={{ fontSize: '16px', color: colors.text }}>
            Bonjour {tutorName},
          </Text>

          <Text style={{ fontSize: '16px', color: colors.text }}>
            L&apos;équipe RH de <strong>Bridge Technologies Solutions</strong> vous a
            désigné comme tuteur pour la demande de stage ci-dessous.
          </Text>

          <Section style={{ backgroundColor: colors.background, padding: '15px', borderRadius: '5px' }}>
            <Text style={{ margin: '0', fontSize: '14px' }}>
              Candidat : <strong>{candidateName}</strong>
            </Text>
            <Text style={{ margin: '5px 0 0 0', fontSize: '14px' }}>
              Type de stage : <strong>{internshipTypeLabel}</strong>
            </Text>
            <Text style={{ margin: '5px 0 0 0', fontSize: '14px' }}>
              Début souhaité : <strong>{startDateLabel}</strong>
            </Text>
          </Section>

          <Text style={{ fontSize: '14px', marginTop: '20px' }}>
            Le dossier complet est consultable depuis l&apos;espace RH de la plateforme.
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
