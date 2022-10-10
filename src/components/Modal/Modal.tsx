import React, { Fragment, ReactNode } from 'react'
import { Dialog, Transition } from '@headlessui/react'

export interface ModalProps {
  isActive: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

const Modal = ({ title, children, isActive, onClose }: ModalProps) => {
  return (
    <Transition.Root show={isActive} as={Fragment}>
      <Dialog
        as='div'
        className='fixed inset-0 overflow-y-auto z-50'
        onClose={onClose}
      >
        <div className='flex items-end sm:items-center justify-center h-screen w-screen'>
          {/* Overlay */}
          <Transition.Child
            as={Fragment}
            enter='ease-out duration-300'
            enterFrom='opacity-0'
            enterTo='opacity-100'
            leave='ease-in duration-200'
            leaveFrom='opacity-100'
            leaveTo='opacity-0'
          >
            <Dialog.Overlay className='fixed inset-0 bg-gray-700/20 transition-opacity' />
          </Transition.Child>

          {/* Content */}
          <Transition.Child
            as={Fragment}
            enter='ease-out duration-300'
            enterFrom='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
            enterTo='opacity-100 translate-y-0 sm:scale-100'
            leave='ease-in duration-200'
            leaveFrom='opacity-100 translate-y-0 sm:scale-100'
            leaveTo='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
          >
            <div className='bg-white text-gray-700 rounded-xl shadow-xl transform transition-all w-full sm:max-w-sm px-6 py-8'>
              <div className='flex items-center justify-between mb-6'>
                <button className='opacity-50 hover:opacity-100 transition duration-300 ease-in-out invisible'>
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                    strokeWidth={1.5}
                    stroke='currentColor'
                    className='w-7 h-7'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M11.25 9l-3 3m0 0l3 3m-3-3h7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                </button>
                <div className='text-lg font-medium'>{title && title}</div>
                <button
                  className='opacity-50 hover:opacity-100 transition duration-300 ease-in-out'
                  onClick={onClose}
                >
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                    strokeWidth={1.5}
                    stroke='currentColor'
                    className='w-7 h-7'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                </button>
              </div>
              {children}
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  )
}

export default Modal
