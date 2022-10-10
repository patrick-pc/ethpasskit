import React, { useState } from 'react'
import '../../styles/tailwind.css'

import Modal from '../Modal'

export interface GeneratePassProps {
  contractAddress: string
}

const GeneratePass = (props: GeneratePassProps) => {
  const [isActive, setIsActive] = useState(false)

  const handleClick = () => {
    console.log(props.contractAddress)
    setIsActive(true)
  }

  return (
    <>
      <button
        className='bg-white text-gray-700 border boder-gray-700 rounded-lg hover:bg-gray-50 transition duration-100 ease-in-out px-3 py-1.5'
        onClick={handleClick}
      >
        Generate Pass
      </button>

      <Modal
        title='Select NFT'
        isActive={isActive}
        onClose={() => setIsActive(false)}
      >
        <div className='text-center text-sm opacity-50'>
          Oops! Looks like you have no eligible NFTs.
        </div>
      </Modal>
    </>
  )
}

export default GeneratePass
