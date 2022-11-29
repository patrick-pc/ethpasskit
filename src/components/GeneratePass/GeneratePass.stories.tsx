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
      '0x60576a64851c5b42e8c57e3e4a5cf3cf4eeb2ed6',
    ],
    chainId: 1,
  },
}
