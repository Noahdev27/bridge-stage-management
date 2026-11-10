import { Html, Body, Container, Heading, Text, Section, Hr } from '@react-email/components';
import * as React from 'react';

const colors = {
  primary: '#0088C1',
  background: '#D6F2FE',
  white: '#ffffff',
  text: '#000000',
};

export default function StaffPasswordResetCodeEmail({
  name,
  code,
  validityMinutes,
}: {
  name: string;
  code: string;
  validityMinutes: number;
}) {
  return (
    <Html>
      <Body style={{ fontFamily: 'Montserrat, sans-serif', backgroundColor: colors.background, padding: '20px' }}>
        <Container style={{ backgroundColor: colors.white, padding: '30px', borderRadius: '8px', border: `1px solid ${colors.primary}` }}>
          <Heading style={{ color: colors.primary, fontSize: '24px' }}>
            Votre code de réinitialisation
          </Heading>

          <Text style={{ fontSize: '16px', color: colors.text }}>
            Bonjour {name},
          </Text>

          <Text style={{ fontSize: '16px', color: colors.text }}>
            Une réinitialisation du mot de passe a été demandée pour votre compte
            de l&apos;espace RH de <strong>Bridge Technologies Solutions</strong>.
            Saisissez ce code sur la page où vous avez fait la demande :
          </Text>

          <Section style={{ textAlign: 'center', margin: '28px 0' }}>
            <Text
              style={{
                display: 'inline-block',
                fontFamily: 'Consolas, Menlo, monospace',
                fontSize: '34px',
                fontWeight: 'bold',
                letterSpacing: '10px',
                color: colors.primary,
                backgroundColor: colors.background,
                padding: '14px 24px',
                borderRadius: '8px',
                margin: 0,
              }}
            >
              {code}
            </Text>
          </Section>

          <Text style={{ fontSize: '13px', color: '#555' }}>
            Ce code est valable {validityMinutes} minutes et ne sert qu&apos;une
            fois. Ne le communiquez à personne : l&apos;équipe Bridge ne vous le
            demandera jamais.
          </Text>

          <Hr style={{ margin: '20px 0', border: `1px solid ${colors.background}` }} />

          <Text style={{ fontSize: '12px', color: '#878786', textAlign: 'center' }}>
            Vous n&apos;êtes pas à l&apos;origine de cette demande ? Ignorez cet
            email : votre mot de passe actuel reste valable. Si cela se répète,
            prévenez un administrateur.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
