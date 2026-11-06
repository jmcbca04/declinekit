import React from 'react';
import type { ExtensionContextValue } from '@stripe/ui-extension-sdk/context';
import { Box, ContextView, Inline } from '@stripe/ui-extension-sdk/ui';
import { useDeclineKit } from '../api';
import { Loading, LoadError, NotLinked, Stat } from '../components/Shared';

const HomeOverview = (context: ExtensionContextValue) => {
  const { data, error } = useDeclineKit(context, 'home');
  return (
    <ContextView
      title="Failed payment recovery"
      description="What DeclineKit is recovering for you"
      externalLink={{ href: 'https://declinekit.com/app', label: 'Open DeclineKit' }}
    >
      {error ? (
        <LoadError message={error} />
      ) : !data ? (
        <Loading />
      ) : !data.linked ? (
        <NotLinked data={data} />
      ) : (
        <Box css={{ stack: 'y', gap: 'medium' }}>
          <Box css={{ stack: 'x', gap: 'small' }}>
            <Stat label="Recovered this month" value={data.recovered_month ?? '$0'} />
            <Stat
              label="In recovery"
              value={`${data.open_amount ?? '$0'} across ${data.open_count ?? 0} invoice${data.open_count === 1 ? '' : 's'}`}
            />
          </Box>
          <Box css={{ stack: 'x', gap: 'small' }}>
            <Stat label="Recovered since connecting" value={data.recovered_all ?? '$0'} />
            <Stat
              label="Cards expiring before renewal"
              value={String(data.expiring_soon ?? 0)}
            />
          </Box>
          <Inline css={{ font: 'caption', color: 'secondary' }}>
            {data.emails_enabled
              ? 'Recovery emails are on.'
              : 'Recovery emails are off. Turn them on at declinekit.com.'}
            {data.free_status ? ` ${data.free_status}` : ''}
          </Inline>
        </Box>
      )}
    </ContextView>
  );
};

export default HomeOverview;
