import React, { useState, useEffect } from 'react'
import { Ring, RaceBy } from '@uiball/loaders'
import { useAccount, useSigner } from 'wagmi'
import { useModal } from 'connectkit'
import Modal from '../Modal'
import QRCode from 'qrcode'
import '../../styles/tailwind.css'

export type GeneratePassProps = {
  settings: {
    apiUrl: string
    contractAddresses: string[]
    chainId: number
  }
  className?: string
}

const GeneratePass: React.FC<GeneratePassProps> = ({
  settings: { apiUrl, contractAddresses, chainId },
  className,
}) => {
  const [isActive, setIsActive] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [ownedNfts, setOwnedNfts] = useState([])
  const [nft, setNft] = useState({
    contractAddress: '',
    tokenId: -1,
  })
  const [platform, setPlatform] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [qrCode, setQRCode] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [modal, setModal] = useState('')
  const [connectAttempt, setConnectAttempt] = useState(false)

  const { address, isConnected } = useAccount()
  const { data: signer } = useSigner()
  const { setOpen } = useModal() // ConnectKit modal

  useEffect(() => {
    if (!address) return
  }, [address])

  useEffect(() => {
    if (isConnected && connectAttempt) {
      checkExistingPass(contractAddresses[0], address)
      setConnectAttempt(false)
    }
  }, [isConnected])

  const checkIsConnected = () => {
    if (isConnected) {
      checkExistingPass(contractAddresses[0], address)
    } else {
      setOpen(true)
      setConnectAttempt(true)
    }
  }

  const validateHolder = async () => {
    setIsActive(true)
    setModal('Select NFT')

    setIsLoading(true)
    try {
      const { collection } = await fetch(
        `https:///www.ethpass.xyz/api/public/assets?address=${address}&contractAddresses=${contractAddresses}`,
        {
          method: 'GET',
          headers: new Headers({
            'content-type': 'application/json',
          }),
        }
      ).then((nfts) => nfts.json())

      const nfts = []
      Object.keys(collection).forEach((key) => {
        nfts.push(collection[key])
      })

      setOwnedNfts(nfts.flat(1))
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage(`Unexpected error: ${error}`)
      }
      setModal('Error')
    } finally {
      setIsLoading(false)
    }
  }

  const checkExistingPass = async (
    contractAddress: string,
    ownerAddress: string,
    tokenId?: number
  ) => {
    setIsActive(true)
    setModal('Verifying')

    try {
      const response = await fetch(
        `${apiUrl}?contractAddress=${contractAddress}&tokenId=${tokenId}&chainId=${chainId}&ownerAddress=${ownerAddress}`,
        {
          method: 'GET',
          headers: new Headers({
            'content-type': 'application/json',
          }),
        }
      )

      if (response.status === 200) {
        const json = await response.json()

        if (json?.fileURL) {
          setFileUrl(json.fileURL)
          QRCode.toDataURL(json.fileURL, {}, (error, url) => {
            if (error) throw error
            setQRCode(url)
          })
          setModal('Pass Generated')
          setPlatform(json.platform)
        } else {
          validateHolder()
        }
      } else {
        setErrorMessage(`${response.status}: ${response.statusText}`)
        setModal('Error')
      }
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage(`Unexpected error: ${error}`)
      }
      setModal('Error')
    }
  }

  const generatePass = async (platform: string) => {
    setPlatform(platform)
    setModal('Signature Request')

    // Get signature
    let signature = ''
    let signatureMessage = ''
    try {
      signatureMessage = `Sign this message to generate a pass with ethpass. \n${Date.now()}`
      signature = await signer?.signMessage(signatureMessage)
    } catch (error) {
      setModal('Select Platform')

      return
    }

    setModal('Generating Pass')

    // Request body
    const payload = {
      contractAddress: nft.contractAddress,
      tokenId: nft.tokenId,
      chainId: chainId,
      platform: platform,
      signature,
      signatureMessage,
    }

    // Send request
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: new Headers({
          'content-type': 'application/json',
        }),
      })

      if (response.status === 200) {
        const json = await response.json()
        setFileUrl(json.fileURL)

        QRCode.toDataURL(json.fileURL, {}, (error, url) => {
          if (error) throw error
          setQRCode(url)
        })
        setModal('Pass Generated')
      } else if (response.status === 401) {
        setErrorMessage(`Unable to verify ownership: ${response.statusText}`)
        setModal('Error')
      } else {
        try {
          const { error, message } = await response.json()
          setErrorMessage(error || message)
        } catch {
          setErrorMessage(`${response.status}: ${response.statusText}`)
        }
        setModal('Error')
      }
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage(`Unexpected error: ${error}`)
      }
      setModal('Error')
    }
  }

  return (
    <>
      <button
        className={
          className
            ? className
            : 'bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition duration-100 ease-in-out px-3 py-1.5'
        }
        onClick={checkIsConnected}
      >
        Generate Pass
      </button>

      <Modal title={modal} isActive={isActive} onClose={() => setIsActive(false)}>
        {modal === 'Select NFT' && (
          <div className="flex overflow-x-auto overflow-y-hidden w-full">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center w-full">
                <Ring size={60} color="#4F46E5" />
              </div>
            ) : ownedNfts.length === 0 ? (
              <span className="flex items-center justify-center text-sm opacity-50 w-full">
                Oops! Looks like you have no eligible NFTs.
              </span>
            ) : (
              <div
                className={`flex flex-shrink-0 items-center ${
                  ownedNfts.length === 1 ? 'justify-center w-full' : 'justify-start'
                } gap-4`}
              >
                {ownedNfts.map(
                  (nft: {
                    asset_contract: { address: string }
                    token_id: string
                    image_url: string
                    animation_url: string
                  }) => {
                    return (
                      <button
                        className="rounded-xl"
                        onClick={() => {
                          setNft({
                            contractAddress: nft.asset_contract.address,
                            tokenId: parseInt(nft.token_id),
                          })
                          setModal('Select Platform')
                        }}
                        key={parseInt(nft.token_id)}
                      >
                        {nft.animation_url ? (
                          <div className="relative">
                            <video
                              className="w-40 h-40 bg-black border rounded-xl"
                              autoPlay
                              loop
                              muted
                            >
                              <source src={nft.animation_url} type="video/mp4" />
                            </video>
                            <div
                              className="absolute inset-0 flex items-end justify-center rounded-xl h-full w-full text-white text-sm p-2"
                              style={{
                                background:
                                  'linear-gradient(to bottom, rgba(0,0,0,0) 70%, rgba(24,24,27,1))',
                              }}
                            >
                              #{nft.token_id}
                            </div>
                          </div>
                        ) : (
                          <div className="relative">
                            <img
                              className="w-40 h-40 bg-black border rounded-xl"
                              src={nft.image_url}
                            />
                            <div
                              className="absolute inset-0 flex items-end justify-center rounded-xl h-full w-full text-white text-sm p-2"
                              style={{
                                background:
                                  'linear-gradient(to bottom, rgba(0,0,0,0) 70%, rgba(24,24,27,1))',
                              }}
                            >
                              #{nft.token_id}
                            </div>
                          </div>
                        )}
                      </button>
                    )
                  }
                )}
              </div>
            )}
          </div>
        )}

        {modal === 'Verifying' && (
          <div className="flex flex-col items-center justify-center w-full gap-4">
            <Ring size={60} color="#4F46E5" />
          </div>
        )}

        {modal === 'Select Platform' && (
          <div className="flex flex-col w-full gap-4">
            <button
              className="flex items-center justify-between bg-white hover:bg-gray-50 text-gray-700 border rounded-xl cursor-pointer select-none transition duration-100 ease-in-out p-4 gap-2"
              onClick={() => generatePass('apple')}
            >
              Apple Wallet
              <div className="flex items-center justify-center bg-zinc-100 rounded-lg h-10 w-10">
                <img className="h-5" src="https://nwpass.vercel.app/img/apple-wallet.png" />
              </div>
            </button>
            <button
              className="flex items-center justify-between bg-white hover:bg-gray-50 text-gray-700 border rounded-xl cursor-pointer select-none transition duration-100 ease-in-out p-4 gap-2"
              onClick={() => generatePass('google')}
            >
              Google Wallet
              <div className="flex items-center justify-center bg-zinc-100 rounded-lg h-10 w-10">
                <img className="h-6" src="https://nwpass.vercel.app/img/google-wallet.png" />
              </div>
            </button>
          </div>
        )}

        {modal === 'Signature Request' && (
          <div className="flex flex-col items-center justify-center w-full gap-4">
            <Ring size={60} color="#4F46E5" />

            <div className="flex flex-col text-center gap-2">
              <p className="font-medium">Waiting for signature...</p>
              <p className="text-xs opacity-50">
                Signing is a safe, cost-less transaction that does not in any way give us permission
                to access your tokens or perform transactions with your wallet.
              </p>
            </div>
          </div>
        )}

        {modal === 'Generating Pass' && (
          <div className="flex flex-col items-center justify-center w-full">
            <img
              className="h-40 w-40 rounded-xl"
              src="https://github.com/Firemoon777/qrtetris/raw/master/res/qr.gif"
            />
            <RaceBy size={125} lineWeight={1} />
          </div>
        )}

        {modal === 'Pass Generated' && (
          <div className="flex flex-col text-center w-full">
            <div className="flex flex-col gap-4">
              <p className="text-sm opacity-50">{`Scan QR code using your ${
                platform.toLowerCase() === 'apple' ? 'Apple' : 'Android'
              } device.`}</p>
              <div className="flex justify-center w-250 h-250">
                <img className="max-h-[250px] max-w-[250px] rounded-lg" src={qrCode} />
              </div>

              <p className="text-sm opacity-50">
                Or tap below to download directly on your mobile device.
              </p>
              <a
                className="flex items-center justify-center"
                href={fileUrl}
                target="_blank"
                rel="noreferrer"
              >
                <img
                  className="h-12"
                  src={`https://nwpass.vercel.app/img/${
                    platform && platform.toLowerCase() === 'apple' ? 'apple' : 'google'
                  }-wallet-add.svg`}
                />
              </a>
            </div>
          </div>
        )}

        {modal === 'Error' && (
          <div className="flex flex-col items-center justify-center w-full">
            <p className="text-sm opacity-50">{errorMessage}</p>
          </div>
        )}
      </Modal>
    </>
  )
}

export default GeneratePass
