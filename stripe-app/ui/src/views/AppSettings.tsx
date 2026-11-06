import React from 'react';
import type { ExtensionContextValue } from '@stripe/ui-extension-sdk/context';
import { Box, Button, Icon, Inline, SettingsView } from '@stripe/ui-extension-sdk/ui';
import { useDeclineKit } from '../api';
import { Loading, LoadError, NotLinked, Stat } from '../components/Shared';

const AppSettings = (context: ExtensionContextValue) => {
  const { data, error } = useDeclineKit(context, 'settings');
  return (
    <SettingsView>
      <Box css={{ stack: 'y', gap: 'large' }}>
        <Box css={{ stack: 'y', gap: 'xsmall' }}>
          <Inline css={{ font: 'heading' }}>DeclineKit</Inline>
          <Inline css={{ color: 'secondary' }}>
            When a subscription renewal is declined, DeclineKit emails your customer in your name with a link to
            update their card, then retries the invoice the moment they do. Free until it recovers your first $100.
          </Inline>
        </Box>
        {error ? (
          <LoadError message={error} />
        ) : !data ? (
          <Loading />
        ) : !data.linked ? (
          <NotLinked data={data} />
        ) : (
          <Box css={{ stack: 'y', gap: 'medium' }}>
            <Box css={{ stack: 'x', gap: 'small' }}>
              <Stat label="Recovery emails" value={data.emails_enabled ? 'On' : 'Off'} />
              <Stat label="Plan" value={data.plan ?? 'Free'} />
              <Stat label="Recovered since connecting" value={data.recovered_all ?? '$0'} />
            </Box>
            {data.free_status && <Inline css={{ color: 'secondary' }}>{data.free_status}</Inline>}
            <Box css={{ stack: 'x', gap: 'small' }}>
              <Button type="primary" href={data.dashboard_url} target="_blank">
                Open DeclineKit <Icon name="external" />
              </Button>
              <Button href="https://declinekit.com/app/settings" target="_blank">
                Sender name, reply-to and billing <Icon name="external" />
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </SettingsView>
  );
};

export default AppSettings;
