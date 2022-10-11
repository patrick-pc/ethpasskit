import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import GeneratePass from './GeneratePass'

export default {
  title: 'ethpasskit/GeneratePass',
  component: GeneratePass,
} as ComponentMeta<typeof GeneratePass>

const Template: ComponentStory<typeof GeneratePass> = (args) => <GeneratePass {...args} />

export const Button = Template.bind({})
Button.args = {
  apiUrl: '/api/ethpass/create',
  contractAddress: '0x3cd266509d127d0eac42f4474f57d0526804b44e',
  chainId: 137,
}
