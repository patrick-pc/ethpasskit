import React from 'react'
import { ConnectKitProvider, getDefaultClient } from 'connectkit'
import { createClient, WagmiConfig } from 'wagmi'
import GeneratePassButton from './GeneratePass'

const client = createClient(
  getDefaultClient({
    appName: 'ETHPassKit',
    alchemyId: 'LlSnxPm7PUKykMfIwJUYnsMUoV9Cc7dX',
  })
)

export const GeneratePass = ({ settings, className }) => {
  return (
    <WagmiConfig client={client}>
      <ConnectKitProvider theme="soft">
        <GeneratePassButton settings={settings} className={className} />
      </ConnectKitProvider>
    </WagmiConfig>
  )
}

export { default as Scanner } from './Scanner'
