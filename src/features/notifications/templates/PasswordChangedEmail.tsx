import { Html, Body, Container, Heading, Text, Section, Button, Hr } from '@react-email/components';
import * as React from 'react';

const colors = {
  primary: '#0088C1',
  background: '#D6F2FE',
  white: '#ffffff',
  text: '#000000',
  danger: '#B42318',
};

export default function PasswordChangedEmail({
  name,
  changedAt,
  method,
  isStaff,
  recoveryUrl,
}: {
  name: string;
  /** Date et heure lisibles, déjà formatées dans le fuseau de l'entreprise. */
  changedAt: string;
  method: 'change' | 'reset';
  isStaff: boolean;
  /** Page « Mot de passe oublié » adaptée au compte. */
  recoveryUrl: string;
}) {
  return (
    <Html>
      <Body style={{ fontFamily: 'Montserrat, sans-serif', backgroundColor: colors.background, padding: '20px' }}>
        <Container style={{ backgroundColor: colors.white, padding: '30px', borderRadius: '8px', border: `1px solid ${colors.primary}` }}>
          <Heading style={{ color: colors.primary, fontSize: '24px' }}>
            Votre mot de passe a été modifié
          </Heading>

          <Text style={{ fontSize: '16px', color: colors.text }}>
            Bonjour {name},
          </Text>

          <Text style={{ fontSize: '16px', color: colors.text }}>
            Le mot de passe de votre compte {isStaff ? "de l'espace RH" : 'candidat'} sur
            la plateforme de <strong>Bridge Technologies Solutions</strong> a été{' '}
            {method === 'reset'
              ? 'réinitialisé à l’aide d’un code ou d’un lien reçu par email'
              : 'changé depuis votre compte'}
            , le <strong>{changedAt}</strong>.
          </Text>

          <Text style={{ fontSize: '16px', color: colors.text }}>
            Par sécurité, tous les appareils connectés à votre compte ont été
            déconnectés{method === 'change' ? ', sauf celui qui a fait la modification' : ''}.
          </Text>

          <Hr style={{ margin: '20px 0', border: `1px solid ${colors.background}` }} />

          <Text style={{ fontSize: '15px', color: colors.danger, fontWeight: 'bold' }}>
            Ce n&apos;est pas vous ?
          </Text>
          <Text style={{ fontSize: '14px', color: colors.text }}>
            Quelqu&apos;un connaît peut-être votre mot de passe ou accède à votre
            boîte mail. Choisissez tout de suite un nouveau mot de passe
            {isStaff ? ' et prévenez un administrateur de la plateforme' : ''}.
          </Text>

          <Section style={{ textAlign: 'center', margin: '24px 0 8px' }}>
            <Button
              href={recoveryUrl}
              style={{
                backgroundColor: colors.primary,
                color: colors.white,
                padding: '12px 24px',
                borderRadius: '6px',
                fontSize: '15px',
                fontWeight: 'bold',
                textDecoration: 'none',
              }}
            >
              Sécuriser mon compte
            </Button>
          </Section>

          <Text style={{ fontSize: '12px', color: '#878786', textAlign: 'center' }}>
            Si vous êtes bien à l&apos;origine de cette modification, vous
            n&apos;avez rien à faire.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
