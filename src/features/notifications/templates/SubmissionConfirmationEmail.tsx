import { Html, Body, Container, Heading, Text, Section, Hr, Img } from '@react-email/components';
import * as React from 'react';

// Palette Bridge extraite du MVP
const colors = {
  primary: '#0088C1',
  background: '#D6F2FE',
  white: '#ffffff',
  text: '#000000',
};

export default function SubmissionConfirmationEmail({ 
  candidateName, 
  trackingCode 
}: { 
  candidateName: string; 
  trackingCode: string; 
}) {
  return (
    <Html>
      <Body style={{ fontFamily: 'Montserrat, sans-serif', backgroundColor: colors.background, padding: '20px' }}>
        <Container style={{ backgroundColor: colors.white, padding: '30px', borderRadius: '8px', border: `1px solid ${colors.primary}` }}>
          <Heading style={{ color: colors.primary, fontSize: '24px' }}>
            Confirmation de candidature - Bridge
          </Heading>
          
          <Text style={{ fontSize: '16px', color: colors.text }}>
            Bonjour {candidateName},
          </Text>
          
          <Text style={{ fontSize: '16px', color: colors.text }}>
            Nous avons bien reçu ta candidature pour un stage chez <strong>Bridge Technologies Solutions</strong>. 
            Ton dossier est actuellement en cours d'enregistrement.
          </Text>

          <Section style={{ backgroundColor: '#f0f0f0', padding: '15px', borderRadius: '5px', textAlign: 'center' }}>
            <Text style={{ margin: '0', fontSize: '14px', color: '#555' }}>Ton code de suivi :</Text>
            <Text style={{ margin: '5px 0 0 0', fontSize: '22px', fontWeight: 'bold', color: colors.primary }}>
              {trackingCode}
            </Text>
          </Section>

          <Hr style={{ margin: '20px 0', border: `1px solid ${colors.background}` }} />
          
          <Text style={{ fontSize: '12px', color: '#878786', textAlign: 'center' }}>
            Conserve précieusement ce code pour suivre l'état de ton dossier sur notre plateforme.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}