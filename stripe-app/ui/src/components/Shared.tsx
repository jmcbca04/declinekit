import React from 'react';
import { Banner, Box, Button, Icon, Inline, Spinner } from '@stripe/ui-extension-sdk/ui';
import type { Summary } from '../api';

export function Loading() {
  return (
    <Box css={{ stack: 'x', alignX: 'center', padding: 'large' }}>
      <Spinner />
    </Box>
  );
}

export function LoadError({ message }: { message: string }) {
  return <Banner type="critical" title="Something went wrong" description={message} />;
}

// Installed in Stripe but not yet tied to a DeclineKit account: one clear next step.
export function NotLinked({ data }: { data: Summary }) {
  return (
    <Box css={{ stack: 'y', gap: 'medium' }}>
      <Banner
        type="caution"
        title="Finish setting up DeclineKit"
        description="Sign in to DeclineKit to connect this Stripe account and preview the recovery emails before anything is sent."
      />
      {data.link_url && (
        <Button type="primary" href={data.link_url} target="_blank" css={{ width: 'fill' }}>
          Finish setup at declinekit.com <Icon name="external" />
        </Button>
      )}
    </Box>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Box css={{ width: 'fill', stack: 'y', gap: 'xxsmall', padding: 'medium', borderRadius: 'medium', backgroundColor: 'surface' }}>
      <Inline css={{ font: 'caption', color: 'secondary' }}>{label}</Inline>
      <Inline css={{ font: 'subtitle', fontWeight: 'semibold' }}>{value}</Inline>
    </Box>
  );
}
