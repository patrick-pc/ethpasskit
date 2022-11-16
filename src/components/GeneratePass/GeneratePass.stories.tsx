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
    passName: '',
    contractAddresses: [],
    chainId: 1,
  },
}
