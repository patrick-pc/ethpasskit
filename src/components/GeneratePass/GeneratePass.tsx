import React from 'react'

export interface GeneratePassProps {
  label: string
  contractAddress: string
}

const GeneratePass = (props: GeneratePassProps) => {
  const handleClick = () => {
    console.log(props.contractAddress)
  }

  return <button onClick={handleClick}>{props.label}</button>
}

export default GeneratePass
