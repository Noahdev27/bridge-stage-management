import { Html, Body, Container, Heading, Text, Section, Hr } from '@react-email/components';
import * as React from 'react';

const colors = {
  primary: '#0088C1',
  background: '#D6F2FE',
  white: '#ffffff',
  text: '#000000',
};

export default function StatusChangedEmail({ 
  candidateName, 
  status, 
  trackingCode 
}: { 
  candidateName: string; 
  status: string; 
  trackingCode: string; 
}) {
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

          <Text style={{ fontSize: '14px', marginTop: '20px' }}>
            Code de suivi : <strong>{trackingCode}</strong>
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