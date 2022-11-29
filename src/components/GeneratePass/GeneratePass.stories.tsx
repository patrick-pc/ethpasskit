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
    contractAddresses: [
      '0xcd041f40d497038e2da65988b7d7e2c0d9244619',
      '0xefb4f583b2b6f0e8c658dd7675e356d8a30ac7ff',
    ],
    chainId: 1,
  },
}
