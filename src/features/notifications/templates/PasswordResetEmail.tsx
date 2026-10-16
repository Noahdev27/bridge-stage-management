import { Html, Body, Container, Heading, Text, Section, Button, Hr } from '@react-email/components';
import * as React from 'react';

const colors = {
  primary: '#0088C1',
  background: '#D6F2FE',
  white: '#ffffff',
  text: '#000000',
};

export default function PasswordResetEmail({
  candidateName,
  resetUrl,
}: {
  candidateName: string;
  resetUrl: string;
}) {
  return (
    <Html>
      <Body style={{ fontFamily: 'Montserrat, sans-serif', backgroundColor: colors.background, padding: '20px' }}>
        <Container style={{ backgroundColor: colors.white, padding: '30px', borderRadius: '8px', border: `1px solid ${colors.primary}` }}>
          <Heading style={{ color: colors.primary, fontSize: '24px' }}>
            Réinitialisez votre mot de passe
          </Heading>

          <Text style={{ fontSize: '16px', color: colors.text }}>
            Bonjour {candidateName},
          </Text>

          <Text style={{ fontSize: '16px', color: colors.text }}>
            Une réinitialisation du mot de passe a été demandée pour le compte
            candidat associé à cette adresse sur la plateforme de{' '}
            <strong>Bridge Technologies Solutions</strong>.
          </Text>

          <Section style={{ textAlign: 'center', margin: '28px 0' }}>
            <Button
              href={resetUrl}
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
              Choisir un nouveau mot de passe
            </Button>
          </Section>

          <Text style={{ fontSize: '13px', color: '#555' }}>
            Ce lien est valable 1 heure et ne peut servir qu&apos;une fois. Si le
            bouton ne fonctionne pas, copiez cette adresse dans votre navigateur :
          </Text>
          <Text style={{ fontSize: '12px', color: colors.primary, wordBreak: 'break-all' }}>
            {resetUrl}
          </Text>

          <Hr style={{ margin: '20px 0', border: `1px solid ${colors.background}` }} />

          <Text style={{ fontSize: '12px', color: '#878786', textAlign: 'center' }}>
            Vous n&apos;êtes pas à l&apos;origine de cette demande ? Ignorez cet
            email : votre mot de passe actuel reste valable tant que ce lien
            n&apos;a pas été utilisé.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
