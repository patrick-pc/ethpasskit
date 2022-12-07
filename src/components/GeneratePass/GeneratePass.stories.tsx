import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import { GeneratePass } from '../'

export default {
  title: 'ethpasskit/GeneratePass',
  component: GeneratePass,
} as ComponentMeta<typeof GeneratePass>

const Template: ComponentStory<typeof GeneratePass> = (args) => <GeneratePass {...args} />

export const Button = Template.bind({})
Button.args = {
  settings: {
    apiUrl: '',
    passName: 'Test',
    chainId: 1,
    contracts: [
      {
        chain: {
          name: 'evm',
          network: 1,
        },
        address: '0x495f947276749ce646f68ac8c248420045cb7b5e',
        slug: 'untitled-collection-624687',
      },
    ],
  },
}
