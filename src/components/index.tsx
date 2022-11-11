import React from 'react'
import { ConnectKitProvider, getDefaultClient } from 'connectkit'
import { createClient, WagmiConfig } from 'wagmi'
import GeneratePassButton from './GeneratePass/GeneratePass'

const client = createClient(
  getDefaultClient({
    appName: 'ETHPassKit',
    alchemyId: 'LlSnxPm7PUKykMfIwJUYnsMUoV9Cc7dX',
  })
)

export const GeneratePass = ({ passName, ethpassApiKey, contractAddresses, chainId }) => {
  return (
    <WagmiConfig client={client}>
      <ConnectKitProvider theme="soft">
        <GeneratePassButton
          passName={passName}
          ethpassApiKey={ethpassApiKey}
          contractAddresses={contractAddresses}
          chainId={chainId}
        />
      </ConnectKitProvider>
    </WagmiConfig>
  )
}

export { default as Scanner } from './Scanner'
