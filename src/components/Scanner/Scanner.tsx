import React, { useRef, useState, useEffect } from 'react'
import { Ring } from '@uiball/loaders'
import QrScanner from 'qr-scanner'
import Modal from '../Modal'
import '../../styles/tailwind.css'

export type ScanResult = {
  id: string
  message: string
  ownerAddress: string
  barcodeSignature: string
  lastScannedAt: string
  expiredAt?: string
  expireAction?: string
  registrations: []
  nfts: {
    contractAddress: string
    contractInterface: string
    tokenId: string
    valid: boolean
  }[]
  chain: {
    name: string
    network: string
  }
}

export interface ScannerProps {
  ethpassApiKey: string
}

const Scanner: React.FC<ScannerProps> = ({ ethpassApiKey }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const scannerRef = useRef<QrScanner | null>(null)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [modal, setModal] = useState('')

  useEffect(() => {
    if (!videoRef.current) return

    const qrScanner = new QrScanner(
      videoRef.current,
      async (result) => {
        qrScanner.stop()
        await scanPass(result.data)
      },
      {
        preferredCamera: 'environment',
        highlightScanRegion: true,
        calculateScanRegion: (v) => {
          const smallestDimension = Math.min(v.videoWidth, v.videoHeight)
          const scanRegionSize = Math.round((1 / 3) * smallestDimension)

          let region: QrScanner.ScanRegion = {
            x: Math.round((v.videoWidth - scanRegionSize) / 2),
            y: Math.round((v.videoHeight - scanRegionSize) / 2),
            width: scanRegionSize,
            height: scanRegionSize,
          }
          return region
        },
      }
    )

    scannerRef.current = qrScanner
    if (!scanResult) qrScanner.start().catch((error) => console.error(error))
    return () => qrScanner.stop()
  }, [scanResult])

  const stop = () => {
    if (!scannerRef.current) return
    scannerRef.current.stop()
  }

  const start = () => {
    if (!scannerRef.current) return
    scannerRef.current.start()
  }

  const reset = () => {
    setIsActive(false)
    setTimeout(() => {
      setModal('')
      setScanResult(null)
      start()
    }, 300) // Transition animation duration
  }

  const scanPass = async (barcode: string) => {
    setIsActive(true)
    setModal('Verifying')

    try {
      const response = await fetch(`https://api.ethpass.xyz/api/v0/scan?data=${barcode}`, {
        method: 'GET',
        headers: new Headers({
          'content-type': 'application/json',
          'x-api-key': ethpassApiKey,
        }),
      })

      if (response.status === 200) {
        const json: ScanResult = await response.json()
        setScanResult(json)
        setModal('Pass Status')
      } else {
        setModal('Pass Invalid')
      }
    } catch (error) {
      setModal('Pass Invalid')
    }
  }

  const renderScanResult = () => {
    if (!scanResult) return

    const invalidNfts = scanResult.nfts.filter((nft: ScanResult['nfts'][0]) => {
      if (!nft.valid) return nft
    })
    if (invalidNfts.length) {
      return (
        <div className="flex flex-col items-center justify-center w-full gap-4">
          <div className="flex items-center justify-center rounded-full bg-red-100 text-red-400 h-16 w-16">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-8 h-8"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          <div className="flex flex-col text-center w-full gap-4">
            <h3 className="font-medium">Error: Pass is Invalid</h3>
            <div className="flex flex-col gap-2 text-sm opacity-50">
              <p>Owner no longer holds following NFTs:</p>
              <div className="flex flex-col gap-2">
                {invalidNfts.map((nft) => {
                  return (
                    <span>{`NFT: ${nft.contractAddress.slice(0, 6)}...${nft.contractAddress.slice(
                      -4
                    )}, Token ID: ${nft.tokenId}`}</span>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )
    }

    if (scanResult.expiredAt) {
      return (
        <div className="flex flex-col items-center justify-center w-full gap-4">
          <div className="flex items-center justify-center rounded-full bg-red-100 text-red-400 h-16 w-16">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-8 h-8"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          <div className="flex flex-col text-center w-full gap-4">
            <h3 className="font-medium">Error: Pass is Expired</h3>
            <p className="text-sm opacity-50">{`Ownership is valid, however this pass has expired due to: ${scanResult.expireAction}`}</p>
          </div>
        </div>
      )
    }

    if (scanResult.lastScannedAt) {
      return (
        <div className="flex flex-col items-center justify-center w-full gap-4">
          <div className="flex items-center justify-center rounded-full bg-yellow-100 text-yellow-400 h-16 w-16">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-8 h-8"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>

          <div className="flex flex-col text-center w-full gap-4">
            <h3 className="font-medium">Ownership Verified</h3>
            <p className="text-sm opacity-50">{`Ownership is valid, however this pass was scanned ${formatDate(
              scanResult?.lastScannedAt
            )}`}</p>
          </div>
        </div>
      )
    } else {
      return (
        <div className="flex flex-col items-center justify-center w-full gap-4">
          <div className="flex items-center justify-center rounded-full bg-green-100 text-green-400 h-16 w-16">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-8 h-8"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>

          <div className="flex flex-col text-center w-full gap-4">
            <h3 className="font-medium">Ownership Verified</h3>
          </div>
        </div>
      )
    }
  }

  const formatDate = (date: string) => {
    if (!date) return

    const d = new Date(date)
    return `${d.toLocaleString('default', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })} - ${d.toLocaleTimeString(navigator.language, {
      hour: '2-digit',
      minute: '2-digit',
    })}`
  }

  return (
    <>
      <div className="flex flex-col max-w-xs gap-4">
        <video className="h-80 w-full border rounded-xl object-cover" ref={videoRef} muted />

        <div className="flex justify-between gap-4">
          <button
            onClick={start}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition duration-100 ease-in-out px-3 py-1.5"
          >
            Start
          </button>
          <button
            onClick={stop}
            className="flex-1 bg-zinc-600 hover:bg-zinc-700 text-white rounded-lg transition duration-100 ease-in-out px-3 py-1.5"
          >
            Stop
          </button>
        </div>
      </div>

      <Modal title={modal} isActive={isActive} onClose={() => reset()}>
        {modal === 'Verifying' && (
          <div className="flex items-center justify-center">
            <Ring size={60} color="#4F46E5" />
          </div>
        )}

        {modal === 'Pass Status' && (
          <div className="flex flex-col items-center justify-center w-full gap-4">
            {renderScanResult()}

            <button
              className="w-full bg-zinc-200 hover:bg-zinc-300 text-zinc-500 rounded-lg transition duration-100 ease-in-out px-3 py-1.5"
              onClick={reset}
            >
              Scan Another Pass
            </button>
          </div>
        )}

        {modal === 'Pass Invalid' && (
          <div className="flex flex-col items-center justify-center w-full gap-4">
            <div className="flex items-center justify-center rounded-full bg-red-100 text-red-400 h-16 w-16">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-8 h-8"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>

            <button
              className="w-full bg-zinc-200 hover:bg-zinc-300 text-zinc-500 rounded-lg transition duration-100 ease-in-out px-3 py-1.5"
              onClick={reset}
            >
              Scan Another Pass
            </button>
          </div>
        )}
      </Modal>
    </>
  )
}

export default Scanner
