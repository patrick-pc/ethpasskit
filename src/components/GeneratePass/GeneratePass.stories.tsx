import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import GeneratePass from './GeneratePass'

export default {
  title: 'ethpasskit/GeneratePass',
  component: GeneratePass,
} as ComponentMeta<typeof GeneratePass>

const Template: ComponentStory<typeof GeneratePass> = (args) => (
  <GeneratePass {...args} />
)

export const Button = Template.bind({})
Button.args = {
  label: 'Generate Pass',
  contractAddress: '123123123123',
}
