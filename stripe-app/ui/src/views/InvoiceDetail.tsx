import React from 'react';
import type { ExtensionContextValue } from '@stripe/ui-extension-sdk/context';
import { Badge, Box, ContextView, Inline } from '@stripe/ui-extension-sdk/ui';
import { statusBadge, useDeclineKit } from '../api';
import { Loading, LoadError, NotLinked } from '../components/Shared';

const InvoiceDetail = (context: ExtensionContextValue) => {
  const invoiceId = context.environment.objectContext?.id;
  const { data, error } = useDeclineKit(context, 'invoice', invoiceId);
  const c = data?.cases?.[0];
  return (
    <ContextView title="Failed payment recovery" description="DeclineKit's status for this invoice">
      {error ? (
        <LoadError message={error} />
      ) : !data ? (
        <Loading />
      ) : !data.linked ? (
        <NotLinked data={data} />
      ) : !c ? (
        <Inline css={{ font: 'body', color: 'secondary' }}>
          DeclineKit isn&apos;t recovering this invoice. It steps in when an automatic subscription payment fails.
        </Inline>
      ) : (
        <Box css={{ stack: 'y', gap: 'medium' }}>
          <Badge type={statusBadge(c).type}>{statusBadge(c).label}</Badge>
          <Box css={{ stack: 'y', gap: 'xxsmall' }}>
            <Inline css={{ font: 'caption', color: 'secondary' }}>Amount</Inline>
            <Inline css={{ fontWeight: 'semibold' }}>{c.amount}</Inline>
          </Box>
          <Box css={{ stack: 'y', gap: 'xxsmall' }}>
            <Inline css={{ font: 'caption', color: 'secondary' }}>Customer</Inline>
            <Inline>{c.customer ?? 'Unknown'}</Inline>
          </Box>
          <Box css={{ stack: 'y', gap: 'xxsmall' }}>
            <Inline css={{ font: 'caption', color: 'secondary' }}>Recovery emails sent</Inline>
            <Inline>{`${c.emails_sent} of 4, since ${c.failed_at}`}</Inline>
          </Box>
        </Box>
      )}
    </ContextView>
  );
};

export default InvoiceDetail;
