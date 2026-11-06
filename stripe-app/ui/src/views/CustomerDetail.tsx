import React from 'react';
import type { ExtensionContextValue } from '@stripe/ui-extension-sdk/context';
import { Badge, Box, ContextView, Inline, List, ListItem } from '@stripe/ui-extension-sdk/ui';
import { statusBadge, useDeclineKit } from '../api';
import { Loading, LoadError, NotLinked } from '../components/Shared';

const CustomerDetail = (context: ExtensionContextValue) => {
  const customerId = context.environment.objectContext?.id;
  const { data, error } = useDeclineKit(context, 'customer', customerId);
  return (
    <ContextView title="Failed payment recovery" description="DeclineKit's history with this customer">
      {error ? (
        <LoadError message={error} />
      ) : !data ? (
        <Loading />
      ) : !data.linked ? (
        <NotLinked data={data} />
      ) : !data.cases?.length ? (
        <Inline css={{ font: 'body', color: 'secondary' }}>
          No failed payments for this customer. If a renewal is declined, it shows up here within seconds.
        </Inline>
      ) : (
        <Box css={{ stack: 'y', gap: 'small' }}>
          <List>
            {data.cases.map((c) => {
              const b = statusBadge(c);
              return (
                <ListItem
                  key={c.invoice_id}
                  id={c.invoice_id}
                  title={<Inline>{`${c.amount} · failed ${c.failed_at}`}</Inline>}
                  secondaryTitle={<Badge type={b.type}>{b.label}</Badge>}
                />
              );
            })}
          </List>
        </Box>
      )}
    </ContextView>
  );
};

export default CustomerDetail;
