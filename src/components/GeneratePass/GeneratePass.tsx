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
    contracts: [
      {
        chain: {
          name: string
          network: number
        }
        address: string
        slug?: string
      }
    ]
  }
  className?: string
}

const GeneratePass: React.FC<GeneratePassProps> = ({
  settings: { apiUrl, contracts },
  className,
}) => {
  const [isActive, setIsActive] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [ownedNfts, setOwnedNfts] = useState([])
  const [nft, setNft] = useState({
    contractAddress: '',
    tokenId: '',
  })
  const [platform, setPlatform] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [qrCode, setQRCode] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [modal, setModal] = useState('')
  const [connectAttempt, setConnectAttempt] = useState(false)
  const [disableClose, setDisableClose] = useState(false)

  const { address, isConnected } = useAccount()
  const { data: signer } = useSigner()
  const { setOpen } = useModal() // ConnectKit modal

  useEffect(() => {
    if (!address) return
  }, [address])

  useEffect(() => {
    if (isConnected && connectAttempt) {
      validateHolder()
      setConnectAttempt(false)
    }
  }, [isConnected])

  const checkIsConnected = () => {
    if (isConnected) {
      validateHolder()
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
      // Get contract addresses from user input
      const contractAddresses = []
      contracts.map((contract) => {
        contractAddresses.push(contract.address)
      })

      // Get collections
      const { collection } = await fetch(
        `https:///www.ethpass.xyz/api/public/assets?address=${address}&contractAddresses=${contractAddresses}`,
        {
          method: 'GET',
          headers: new Headers({
            'content-type': 'application/json',
          }),
        }
      ).then((nfts) => nfts.json())

      // Merge collections from object to a single array
      const nfts = []
      Object.keys(collection).forEach((key) => {
        nfts.push(collection[key])
      })
      let ownedNfts = nfts.flat(1)

      // Check if OS storefront contract address and slug is equal from user input
      const osCollections = []
      const OS_STOREFRONT_ADDRESS = '0x495f947276749ce646f68ac8c248420045cb7b5e'
      for (let i = 0; i < ownedNfts.length; i++) {
        const nft = ownedNfts[i]
        if (nft.asset_contract.address.toLowerCase() === OS_STOREFRONT_ADDRESS.toLowerCase()) {
          contracts.map((contract) => {
            if (
              contract.slug &&
              contract.slug.toLowerCase() === nft.collection.slug.toLowerCase()
            ) {
              osCollections.push(nft)
            }
          })
        }
      }

      // Remove OS storefront contract addresses from main array and merge osCollections
      ownedNfts?.map((nft, i) => {
        if (nft.asset_contract.address.toLowerCase() === OS_STOREFRONT_ADDRESS.toLowerCase()) {
          ownedNfts.splice(i, 1)
        }
      })
      for (let i = 0; i < ownedNfts.length; i++) {
        const nft = ownedNfts[i]
        if (nft.asset_contract.address.toLowerCase() === OS_STOREFRONT_ADDRESS.toLowerCase()) {
          ownedNfts.splice(i, 1)
          i--
        }
      }
      ownedNfts = ownedNfts.concat(osCollections)

      setOwnedNfts(ownedNfts)
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage(`Unexpected error: ${error}`)
      }
      setIsActive(true)
      setDisableClose(false)
      setModal('Error')
    } finally {
      setIsLoading(false)
    }
  }

  const checkExistingPass = async (
    ownerAddress: string,
    contractAddress: string,
    tokenId?: string
  ) => {
    setNft({
      contractAddress,
      tokenId,
    })
    setIsActive(true)
    setModal('Verifying')

    try {
      const response = await fetch(
        `${apiUrl}?contractAddress=${contractAddress}&tokenId=${tokenId}&chainId=1&ownerAddress=${ownerAddress}`,
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
          setIsActive(true)
          setModal('Pass Generated')
          setPlatform(json.platform)
        } else {
          setModal('Select Platform')
        }
      } else {
        setErrorMessage(`${response.status}: ${response.statusText}`)
        setIsActive(true)
        setDisableClose(false)
        setModal('Error')
      }
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage(`Unexpected error: ${error}`)
      }
      setIsActive(true)
      setDisableClose(false)
      setModal('Error')
    }
  }

  const generatePass = async (platform: string) => {
    setPlatform(platform)
    setIsActive(true)
    setModal('Signature Request')

    // Get signature
    let signature = ''
    let signatureMessage = ''
    try {
      signatureMessage = `Sign this message to generate a pass with ethpass. \n${Date.now()}`
      signature = await signer?.signMessage(signatureMessage)
    } catch (error) {
      setIsActive(true)
      setModal('Select Platform')

      return
    }

    setIsActive(true)
    setDisableClose(true)
    setModal('Generating Pass')

    // Request body
    const payload = {
      contractAddress: nft.contractAddress,
      tokenId: nft.tokenId,
      chainId: 1,
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
        setIsActive(true)
        setDisableClose(false)
        setModal('Pass Generated')
      } else if (response.status === 401) {
        setErrorMessage(`Unable to verify ownership: ${response.statusText}`)
        setIsActive(true)
        setDisableClose(false)
        setModal('Error')
      } else {
        try {
          const { error, message } = await response.json()
          setErrorMessage(error || message)
        } catch {
          setErrorMessage(`${response.status}: ${response.statusText}`)
        }
        setIsActive(true)
        setDisableClose(false)
        setModal('Error')
      }
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage(`Unexpected error: ${error}`)
      }
      setIsActive(true)
      setDisableClose(false)
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

      <Modal
        title={modal}
        isActive={isActive}
        onClose={() => setIsActive(false)}
        disableClose={disableClose}
      >
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
                          checkExistingPass(address, nft.asset_contract.address, nft.token_id)
                        }}
                        key={nft.token_id}
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
                            <div className="absolute inset-0 flex items-end p-2">
                              <div className="py-1 px-2 rounded bg-black/60 text-xs font-medium text-white">
                                #
                                {nft.token_id.length <= 12
                                  ? nft.token_id
                                  : `${nft.token_id.slice(0, 4)}...${nft.token_id.slice(-4)}`}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="relative">
                            <img
                              className="w-40 h-40 bg-black border rounded-xl object-cover"
                              src={nft.image_url}
                            />
                            <div className="absolute inset-0 flex items-end p-2">
                              <div className="py-1 px-2 rounded bg-black/60 text-xs font-medium text-white">
                                #
                                {nft.token_id.length <= 12
                                  ? nft.token_id
                                  : `${nft.token_id.slice(0, 4)}...${nft.token_id.slice(-4)}`}
                              </div>
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
              className="flex items-center justify-center bg-white hover:bg-gray-50 text-gray-700 border rounded-xl cursor-pointer select-none transition duration-100 ease-in-out p-3 gap-4"
              onClick={() => generatePass('apple')}
            >
              <div className="flex items-center justify-center bg-zinc-100 rounded-lg h-10 w-10">
                <img className="h-5" src="https://nwpass.vercel.app/img/apple-wallet.png" />
              </div>
              <div className="w-[105px] text-left">Apple Wallet</div>
            </button>
            <button
              className="flex items-center justify-center bg-white hover:bg-gray-50 text-gray-700 border rounded-xl cursor-pointer select-none transition duration-100 ease-in-out p-3 gap-4"
              onClick={() => generatePass('google')}
            >
              <div className="flex items-center justify-center bg-zinc-100 rounded-lg h-10 w-10">
                <img className="h-6" src="https://nwpass.vercel.app/img/google-wallet.png" />
              </div>
              <div className="w-[105px] text-left">Google Wallet</div>
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
