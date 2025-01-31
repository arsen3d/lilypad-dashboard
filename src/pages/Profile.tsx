import { useCorbado, useCorbadoSession, PasskeyList } from "@corbado/react"
import { useNavigate } from "react-router-dom"
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK, IProvider, IBaseProvider, ADAPTER_STATUS, CONNECTED_EVENT_DATA } from "@web3auth/base";
import { Web3Auth } from "@web3auth/single-factor-auth";
import { PasskeysPlugin } from "@web3auth/passkeys-sfa-plugin";
import { shouldSupportPasskey } from "./utils";
import { useEffect, useState } from "react"
import { ethers, Provider } from "ethers"
import React from 'react';
// import './Profile.css';

export default function ProfilePage() {
    const { isAuthenticated, loading, logout, getPasskeys } = useCorbado()
    const { user, shortSession } = useCorbadoSession()
    const navigate = useNavigate()
    const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null)
    const [provider, setProvider] = useState<IProvider | null>(null)
    const [passkeysPlugin, setPasskeysPlugin] = useState<PasskeysPlugin | null>(null)
    const [isConnected, setIsConnected] = useState(false);
    const [numericWallet, setNumericWallet] = useState<ethers.Wallet | null>(null)
    const [showPrivateKey, setShowPrivateKey] = useState(false);
    const [ethBalance, setEthBalance] = useState<string>("0")
    const [lpBalance, setLpBalance] = useState<string>("0")
    const [activeTab, setActiveTab] = useState('javascript');

    const handleTabClick = (tab: string) => {
        setActiveTab(tab);
    };

    useEffect(() => {
        const init = async () => {
            if (isAuthenticated) {
                console.log("shortSession", shortSession)
                console.log("user", user)
                const keys = await getPasskeys()
                // const hashString = keys.val.passkeys[0].credentialHash
                // const numericHash = parseInt(hashString, 16)
                // console.log(numericHash)
                // console.log(keys.val.passkeys[0].id.substring(4))
                // console.log(user.sub.substring(4))
                // console.log(user.sub.substring(4)+keys.val.passkeys[0].id.substring(4))
                // const seed = ethers.BigNumber.from(user.sub.substring(4)).mul(ethers.BigNumber.from(keys.val.passkeys[0].id.substring(4))).toString()
                // ethers.toNumber(user.sub.substring(4))
                const seed = ethers.toBigInt(user.sub.substring(4) + keys.val.passkeys[0].id.substring(4)) * ethers.toBigInt(user.sub.substring(4) + keys.val.passkeys[0].id.substring(4))

                // console.log("num",seed)
                // console.log("seed", seed)
                // const wallet = ethers.Wallet.fromPhrase(seed)
                const intSeed = seed
                
                const hexSeed = ethers.zeroPadValue(ethers.toBeHex(intSeed).slice(0, 64), 32)
                // console.log("hexSeed", hexSeed)
                // const numericWallet = new ethers.Wallet(hexSeed)

                const numericWallet = new ethers.Wallet(hexSeed, new ethers.JsonRpcProvider("https://demonet-chain-http.lilypad.tech"))//("https://rpc.ankr.com/eth"))
                const balance =  await numericWallet.provider.getBalance(numericWallet.address)
                const erc20Abi = [
                    "function balanceOf(address owner) view returns (uint256)"
                ];

                const erc20ContractAddress = "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853"; // Replace with your ERC20 contract address
                const erc20Contract = new ethers.Contract(erc20ContractAddress, erc20Abi, numericWallet.provider);

                const lpBalance = await erc20Contract.balanceOf(numericWallet.address);
                setLpBalance(lpBalance.toString());
                setEthBalance(balance.toString())
                setNumericWallet(numericWallet)
                console.log(numericWallet.privateKey)

                console.log(numericWallet.address)
            }
            try {
                const chainConfig = {
                    chainId: "0x1", // Ethereum mainnet
                    chainNamespace: CHAIN_NAMESPACES.EIP155,
                    rpcTarget: "https://rpc.ankr.com/eth",
                    displayName: "Ethereum Mainnet",
                    blockExplorerUrl: "https://etherscan.io/",
                    ticker: "ETH",
                    tickerName: "Ethereum",
                };

                const privateKeyProvider: IBaseProvider<string> = {
                    provider: null,
                    currentChainConfig: chainConfig,
                    getPrivateKey: async () => Promise.resolve("0x"),
                    setupProvider: async (provider) => provider,
                    addChain: async () => { },
                    switchChain: async () => { },
                    init: async () => { },
                    disconnect: async () => { },
                    getUserInfo: async () => ({
                        email: "",
                        name: "",
                        profileImage: "",
                        aggregateVerifier: "",
                        verifier: "",
                        verifierId: "",
                        typeOfLogin: "",
                    }),
                    connect: async () => ({
                        provider: null,
                        status: ADAPTER_STATUS.CONNECTED
                    }),
                    authenticateUser: async () => ({
                        accessToken: "",
                        idToken: "",
                        state: {}
                    }),
                };

                const web3auth = new Web3Auth({
                    privateKeyProvider,
                    clientId: "BExhnjW_zvM2Ba8hi53UiHw82xUub9qR1RmDayutXjAUPgIA-hof5hBwv1XCok_qB6A_KfUtd1PvsioLk-Ltz5M",
                    chainConfig,
                    web3AuthNetwork: WEB3AUTH_NETWORK.MAINNET,
                });

                const passkeysPlugin = new PasskeysPlugin({
                    rpID: "localhost",
                    rpName: "Web3Auth Demo",
                });

                await web3auth.addPlugin(passkeysPlugin);
                await web3auth.init();

                setWeb3auth(web3auth);
                setPasskeysPlugin(passkeysPlugin);
            } catch (error) {
                console.error("Error initializing Web3Auth:", error);
            }
        };
        init();
    }, [isAuthenticated])

    const registerPasskey = async () => {
        if (!passkeysPlugin || !user || !isConnected) {
            console.log("Please connect Web3Auth first");
            return;
        }
        try {
            await passkeysPlugin.registerPasskey({
                username: user.email
            })
            console.log("Passkey registered successfully")
        } catch (error) {
            console.error("Error registering passkey:", error)
        }
    }

    const loginWithPasskey = async () => {
        if (!passkeysPlugin || !isConnected) {
            console.log("Please connect Web3Auth first");
            return;
        }
        try {
            await passkeysPlugin.loginWithPasskey()
            console.log("Logged in with passkey successfully")
        } catch (error) {
            console.error("Error logging in with passkey:", error)
        }
    }

    const listPasskeys = async () => {
        if (!passkeysPlugin) return
        try {
            const passkeys = await passkeysPlugin.listAllPasskeys()
            console.log("Registered passkeys:", passkeys)
            return passkeys
        } catch (error) {
            console.error("Error listing passkeys:", error)
            return []
        }
    }

    const connectWallet = async () => {
        if (!web3auth || !user) return;
        try {
            const result = shouldSupportPasskey();
            if (!result.isBrowserSupported) {
                console.log("Browser not supported");
                return;
            }

            await web3auth.connect({
                verifier: "corbado",
                verifierId: user.email,
                idToken: shortSession,
            });

            const provider = web3auth.provider;
            setProvider(provider);
        } catch (error) {
            console.error("Error connecting wallet:", error);
        }
    };

    const connectWeb3Auth = async () => {
        if (!web3auth || !user) return;
        try {
            const result = shouldSupportPasskey();
            if (!result.isBrowserSupported) {
                console.log("Browser not supported");
                return;
            }

            // Use session token from Corbado user object
            const token = shortSession;

            await web3auth.connect({
                verifier: "corbado",
                verifierId: user.email,
                idToken: token
            });

            const web3authProvider = web3auth.provider;
            setProvider(web3authProvider);
            setIsConnected(true);

        } catch (error) {
            console.error("Error connecting Web3Auth:", error);
            setIsConnected(false);
        }
    };

    if (!isAuthenticated && !loading) {
        navigate("/auth")
    }

    return (
        <div className='text-center max-w-7xl mx-auto my-5 break-words border rounded-xl p-5'>
             <button
                onClick={logout}
                className='bg-blue-300 px-3 py-2 rounded-full w-full'>
                Logout
                </button>
            {/* <h1 className='text-2xl'>Profile</h1> */}
            {user && (
                <>
                   

                    <div className="mt-4">
                        {/* <h2 className="text-xl">Ethereum Balance</h2> */}
                        <div className="bg-gray-100 p-4 rounded-lg shadow-md">
                            {numericWallet ? (
                                <div className="flex flex-row justify-between">
                                    <div>Email: {user.orig}</div>
                                    <div>Name: {user.name}</div>
                                    <div>{parseFloat(ethers.formatEther(lpBalance)).toFixed(4)} LP</div>
                                    <div>{parseFloat(ethers.formatEther(ethBalance)).toFixed(4)} ETH</div>
                                </div>
                            ) : (
                                <p>Please connect your wallet to see the balance.</p>
                            )}
<div className="text-left">
                        <div className="flex items-center justify-between">
                            <span>Address:<br/> {numericWallet?.address}</span>
                            <button
                                onClick={() => navigator.clipboard.writeText(numericWallet?.address || '')}
                                className="bg-gray-200 px-2 py-1 rounded">
                                Copy
                            </button>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                            <span  onClick={() => setShowPrivateKey(!showPrivateKey)}>Private Key:<br/>{showPrivateKey ? numericWallet?.privateKey : '********'}</span>
                            {/* <button
                                onClick={() => setShowPrivateKey(!showPrivateKey)}
                                className="bg-gray-200 px-2 py-1 rounded">
                                {showPrivateKey ? 'Hide' : 'Show'}
                            </button> */}
                            <button
                                onClick={() => navigator.clipboard.writeText(numericWallet?.privateKey || '')}
                                className="bg-gray-200 px-2 py-1 rounded ml-2">
                                Copy
                            </button>
                        </div>
                        {/* <PasskeyList /> */}
                    </div>

                        </div>
                    </div>

                    
                    {/* <button 
                onClick={connectWeb3Auth}
                disabled={isConnected}
                className='bg-purple-300 px-3 py-2 rounded-full mb-2 w-full'>
                {isConnected ? 'Connected' : 'Connect Web3Auth'}
                </button>
                <button
                onClick={registerPasskey}
                disabled={!isConnected}
                className='bg-green-300 px-3 py-2 rounded-full mb-2 w-full'>
                Register Passkey
                </button>
                <button
                onClick={loginWithPasskey}
                disabled={!isConnected}
                className='bg-blue-300 px-3 py-2 rounded-full mb-2 w-full'>
                Login with Passkey
                </button>
                <button
                onClick={listPasskeys}
                className='bg-purple-300 px-3 py-2 rounded-full mb-2 w-full'>
                List Passkeys
                </button>
                <button
                onClick={connectWallet}
                className='bg-green-300 px-3 py-2 rounded-full mb-2 w-full'>
                Connect Web3 Wallet
                </button>
                */}
                
                <div className="text-left">
                    {/* <code>
                        {`fetch('https://api.lilypad.tech/eth/transfer')`}
                    </code> */}
                <div className="mt-4">
                    
                    <div className="bg-gray-100 p-4 rounded-lg shadow-md">
                    <h2 className="text-xl">Examples:</h2>
                        <div className="tabs">
                            <button
                                className={`tab ${activeTab === 'javascript' ? 'active' : ''}`}
                                onClick={() => handleTabClick('javascript')}
                            >
                                Client JS API
                            </button>
                            <button
                                className={`tab ${activeTab === 'python' ? 'active' : ''}`}
                                onClick={() => handleTabClick('python')}
                            >
                                Client Python API
                            </button>
                            <button
                                className={`tab ${activeTab === 'python' ? 'active' : ''}`}
                                onClick={() => handleTabClick('python')}
                            >
                                Client Go API
                            </button>
                            <button
                                className={`tab ${activeTab === 'sdk' ? 'active' : ''}`}
                                onClick={() => handleTabClick('sdk')}
                            >
                                Client JS SDK
                            </button>
                            <button
                                className={`tab ${activeTab === 'sdk' ? 'active' : ''}`}
                                onClick={() => handleTabClick('sdk')}
                            >
                                Client Python SDK
                            </button>
                            <button
                                className={`tab ${activeTab === 'sdk' ? 'active' : ''}`}
                                onClick={() => handleTabClick('sdk')}
                            >
                                Client Go SDK
                            </button>
                            <button
                                className={`tab ${activeTab === 'sdk' ? 'active' : ''}`}
                                onClick={() => handleTabClick('sdk')}
                            >
                                Node Module
                            </button>
                            <button
                                className={`tab ${activeTab === 'sdk' ? 'active' : ''}`}
                                onClick={() => handleTabClick('sdk')}
                            >
                                Python Module
                            </button>
                            <button
                                className={`tab ${activeTab === 'sdk' ? 'active' : ''}`}
                                onClick={() => handleTabClick('sdk')}
                            >
                                Go Module
                            </button>
                        </div>
                        <div className="tab-content">
                            <div className={`tab-pane ${activeTab === 'javascript' ? 'active' : ''}`}>
                                <pre>
                                {`
import axios from 'axios';
import fs from 'fs';
import os from 'os';
import path from 'path';
import tar from 'tar';
import { mkdtempSync } from 'fs';
import { Progress } from 'gr';

async function run(module, prompt, progress = new Progress()) {
    const payload = {
        pk: ${showPrivateKey ? numericWallet?.privateKey : '********'},
        module: module,
        inputs: "-i"+ prompt,
        stream: "true"
    };

    try {
        const response = await axios.post("http://cli-wrapper:3000", payload);
        if (response.status === 200) {
            console.log("Success");
        } else {
            console.log("Failed");
        }

        const tempDir = mkdtempSync(path.join(os.tmpdir(), 'temp-'));
        const contentDisposition = response.headers['content-disposition'];
        const filename = contentDisposition.split('filename=')[1].trim().replace(/"/g, '');
        progress(0.5, { desc: "Processing..." });

        const tempPath = path.join(tempDir, filename);
        fs.writeFileSync(tempPath, response.data);

        let stdoutContent = "";
        let stderrContent = "";
        progress(0.75, { desc: "Almost done..." });

        await tar.extract({ file: tempPath, cwd: tempDir, onentry: entry => {
            const filePath = path.join(tempDir, entry.path);
            if (entry.path.endsWith('stdout')) {
                stdoutContent = fs.readFileSync(filePath, 'utf-8');
            } else if (entry.path.endsWith('stderr')) {
                stderrContent = fs.readFileSync(filePath, 'utf-8');
            }
        }});

        const imagePath = path.join(tempDir, path.basename(filename, path.extname(filename)), 'outputs', 'output.png');
    } catch (error) {
        console.error(error);
    }
}
                                `}
                                </pre>
                            </div>
                            <div className={`tab-pane ${activeTab === 'python' ? 'active' : ''}`}>
                                <pre>
                                {`
import os
import requests
import tempfile
import tarfile

def run(module,prompt,progress=gr.Progress()):
    payload = {
        "pk":   ${showPrivateKey ? numericWallet?.privateKey : '********'} ,
        "module": module,
        "inputs": "-i \""+prompt + "\"",
        "stream": "true"
    }
    response = requests.post("http://cli-wrapper:3000", json=payload)
    if response.status_code == 200:
        print("Success")
    else:
        print("Failed")
    temp_dir = tempfile.mkdtemp()
    content_disposition = response.headers.get('content-disposition')
    # if content_disposition:
    filename = content_disposition.split('filename=')[1].strip('"')
    progress(0.5, desc="Processing...")
    
    temp_path = os.path.join(temp_dir,filename)
    with open(temp_path, 'wb') as f:
        f.write(response.content)
    
    stdout_content = ""
    stderr_content = ""
    progress(0.75, desc="Amost done...")
    with tarfile.open(temp_path, 'r') as tar:
        for member in tar.getmembers():
            f = tar.extractfile(member)
            if f:
                if member.name.endswith('stdout'):
                    content = f.read().decode('utf-8')
                    stdout_content = content
                elif member.name.endswith('stderr'):
                    content = f.read().decode('utf-8')
                    stderr_content = content
            tar.extractall(temp_dir)
            image_path = temp_dir + "/" +os.path.splitext(filename)[0] + "/outputs/output.png"
 
                                `}
                                </pre>
                            </div>
                           
                        </div>
                    </div>
                </div>
                </div>
                </>
            )}
        </div>
    )
}
