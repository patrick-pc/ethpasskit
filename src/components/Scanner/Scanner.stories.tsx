import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import Scanner from './Scanner'

export default {
  title: 'ethpasskit/Scanner',
  component: Scanner,
} as ComponentMeta<typeof Scanner>

const Template: ComponentStory<typeof Scanner> = (args) => <Scanner {...args} />

export const BarcodeScanner = Template.bind({})
BarcodeScanner.args = {
  ethpassApiKey: '',
}
