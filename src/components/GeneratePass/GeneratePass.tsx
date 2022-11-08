import React, { useState } from 'react'
import { ethers } from 'ethers'
import { Ring, RaceBy } from '@uiball/loaders'
import QRCode from 'qrcode'
import Modal from '../Modal'
import '../../styles/tailwind.css'

export interface GeneratePassProps {
  passName: string
  ethpassApiKey: string
  contractAddress: string
  chainId: number
}

const GeneratePass: React.FC<GeneratePassProps> = ({
  passName,
  ethpassApiKey,
  contractAddress,
  chainId,
}) => {
  const [isActive, setIsActive] = useState(false)
  const [ownedNfts, setOwnedNfts] = useState([])
  const [tokenId, setTokenId] = useState(-1)
  const [platform, setPlatform] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [qrCode, setQRCode] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [modal, setModal] = useState('')

  const validateHolder = async () => {
    const provider = new ethers.providers.Web3Provider((window as any).ethereum)
    const accounts = await provider.send('eth_requestAccounts', [])

    setIsActive(true)
    setModal('Select NFT')

    // Get owned NFTs
    const baseURL =
      chainId == 1
        ? 'https://eth-mainnet.g.alchemy.com/nft/v2/demo/getNFTs'
        : 'https://polygon-mainnet.g.alchemy.com/nft/v2/demo/getNFTs'
    const fetchURL = `${baseURL}?owner=${accounts[0]}&contractAddresses%5B%5D=${contractAddress}`
    const { ownedNfts } = await fetch(fetchURL).then((nfts) => nfts.json())

    setOwnedNfts(ownedNfts)
  }

  const getTokenId = (tokenId: number) => {
    setTokenId(tokenId)
    setModal('Select Platform')
  }

  const generatePass = async (platform: string) => {
    setPlatform(platform)
    setModal('Signature Request')

    // Get signature
    let signature = ''
    let signatureMessage = ''
    try {
      const provider = new ethers.providers.Web3Provider((window as any).ethereum)
      const signer = provider.getSigner()
      signatureMessage = `Sign this message to generate a pass with ethpass. \n${Date.now()}`
      signature = await signer.signMessage(signatureMessage)
    } catch (error) {
      console.log(error)
      setModal('Select Platform')

      return
    }

    setModal('Generating Pass')

    // Pass details
    let pass
    if (platform === 'apple') {
      pass = {
        labelColor: 'rgb(70,70,220)',
        backgroundColor: 'rgb(255,255,255)',
        foregroundColor: 'rgb(0,0,0)',
        description: passName,
        headerFields: [],
        primaryFields: [
          {
            key: 'primary1',
            label: 'Pass',
            value: passName,
            textAlignment: 'PKTextAlignmentNatural',
          },
        ],
        secondaryFields: [
          {
            key: 'secondary1',
            label: 'Contract Address',
            value: `${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}`,
            textAlignment: 'PKTextAlignmentLeft',
          },
          {
            key: 'secondary2',
            label: 'Token ID',
            value: tokenId,
            textAlignment: 'PKTextAlignmentLeft',
          },
          {
            key: 'secondary3',
            label: 'Chain ID',
            value: chainId,
            textAlignment: 'PKTextAlignmentLeft',
          },
        ],
        auxiliaryFields: [],
        backFields: [],
      }
    } else {
      pass = {
        messages: [],
      }
    }

    // Request body
    const payload = {
      pass,
      signature,
      signatureMessage,
      platform: platform,
      nft: {
        contractAddress: contractAddress,
        tokenId: tokenId,
      },
      chain: {
        name: 'evm',
        network: chainId,
      },
    }

    // Send request
    try {
      const response = await fetch('https://api.ethpass.xyz/api/v0/passes', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: new Headers({
          'content-type': 'application/json',
          'X-API-KEY': ethpassApiKey,
        }),
      })

      if (response.status === 200) {
        const json = await response.json()
        setFileUrl(json.fileURL)
        setModal('Pass Generated')

        console.log('## POST Result', json)
        QRCode.toDataURL(json.fileURL, {}, (error, url) => {
          if (error) throw error
          setQRCode(url)
        })
        setModal('Pass Generated')
      } else if (response.status === 401) {
        console.log(`Unable to verify ownership: ${response.statusText}`)
        setErrorMessage(`Unable to verify ownership: ${response.statusText}`)
        setModal('Error')
      } else {
        try {
          const { error, message } = await response.json()
          console.log(error || message)
          setErrorMessage(error || message)
        } catch {
          console.log(`${response.status}: ${response.statusText}`)
          setErrorMessage(`${response.status}: ${response.statusText}`)
        }
        setModal('Error')
      }
    } catch (error) {
      if (error instanceof Error) {
        console.log('## POST Error', error.message)
        setErrorMessage(error.message)
      } else {
        console.log(`Unexpected error: ${error}`)
        setErrorMessage(`Unexpected error: ${error}`)
      }
      setModal('Error')
    }
  }

  return (
    <>
      <button
        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition duration-100 ease-in-out px-3 py-1.5"
        onClick={validateHolder}
      >
        Generate Pass
      </button>

      <Modal title={modal} isActive={isActive} onClose={() => setIsActive(false)}>
        {modal === 'Select NFT' && (
          <div className="flex overflow-x-auto w-full">
            {ownedNfts.length === 0 ? (
              <span className="flex items-center justify-center text-sm opacity-50 w-full">
                Oops! Looks like you have no eligible NFTs.
              </span>
            ) : (
              <div
                className={`flex flex-shrink-0 items-center ${
                  ownedNfts.length === 1 ? 'justify-center w-full' : 'justify-start'
                } gap-4`}
              >
                {ownedNfts.map((nft: { id: { tokenId: string }; media: [{ gateway: string }] }) => {
                  return (
                    <button
                      className="rounded-xl"
                      onClick={() => getTokenId(parseInt(nft.id.tokenId))}
                      key={parseInt(nft.id.tokenId)}
                    >
                      {nft.media[0].gateway.slice(-4) === '.mp4' ? (
                        <video className="w-40 h-40 bg-black border rounded-xl" autoPlay loop muted>
                          <source src={nft.media[0].gateway} type="video/mp4" />
                        </video>
                      ) : (
                        <img
                          className="w-40 h-40 bg-black border rounded-xl"
                          src={nft.media[0].gateway}
                        />
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {modal === 'Select Platform' && (
          <div className="flex flex-col w-full gap-4">
            <button
              className="bg-white text-gray-700 border rounded-xl hover:bg-gray-50 transition duration-100 ease-in-out px-4 py-4"
              onClick={() => generatePass('apple')}
            >
              Apple Wallet
            </button>
            <button
              className="bg-white text-gray-700 border rounded-xl hover:bg-gray-50 transition duration-100 ease-in-out px-4 py-4"
              onClick={() => generatePass('google')}
            >
              Google Wallet
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
                className="flex items-center justify-center bg-white hover:bg-gray-50 text-gray-700 border rounded-xl cursor-pointer select-none transition duration-100 ease-in-out px-4 py-4 gap-2"
                href={fileUrl}
                download
              >
                <img
                  className="h-6"
                  src={`https://nwpass.vercel.app/img/${
                    platform && platform.toLowerCase() === 'apple' ? 'apple' : 'google'
                  }-wallet.png`}
                />
                <p>
                  Add to {platform && platform.toLowerCase() === 'apple' ? 'Apple' : 'Google'}{' '}
                  Wallet
                </p>
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
