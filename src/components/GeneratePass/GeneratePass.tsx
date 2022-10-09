import React from 'react'
import '../../styles/tailwind.css'

export interface GeneratePassProps {
  contractAddress: string
}

const GeneratePass = (props: GeneratePassProps) => {
  const handleClick = () => {
    console.log(props.contractAddress)
  }

  return (
    <button
      className='bg-black text-white rounded-lg px-4 py-2'
      onClick={handleClick}
    >
      Generate Pass
    </button>
  )
}

export default GeneratePass
