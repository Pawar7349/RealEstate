import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

// Components
import Navigation from './components/Navigation.js';
import Search from './components/Search.js';
import Home from './components/Home.js';

// ABIs
import RealEstate from './abis/RealEstate.json';
import Escrow from './abis/Escrow.json';

// Config
import config from './config.json';

function App() {
    const [provider, setProvider] = useState(null);
    const [escrow, setEscrow] = useState(null);
    const [account, setAccount] = useState(null);
    const [homes, setHomes] = useState([]);
    const [home, setHome] = useState({});
    const [toggle, setToggle] = useState(false);

    const loadBlockchainData = async () => {
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            setProvider(provider);
            const network = await provider.getNetwork();
            const chainId = network.chainId;

            const ContractAddress = config[chainId];
            if (!ContractAddress) {
                throw new Error(`No address found for chain ID: ${chainId}`);
            }

            const realEstate = new ethers.Contract(
                ContractAddress.realEstate.address,
                RealEstate.abi,
                provider
            );

            let totalSupply;
            try {
                totalSupply = await realEstate.totalSupply();
            } catch (error) {
                console.error("Error calling totalSupply:", error);
                return; // Exit if there's an error
            }

            const homes = [];
            for (let i = 1; i <= totalSupply; i++) {
                try {
                    const uri = await realEstate.tokenURI(i);
                    const response = await fetch(uri);
                    const metadata = await response.json();
                    homes.push(metadata);
                } catch (error) {
                    console.error(`Error fetching metadata for token ${i}:`, error);
                }
            }

            setHomes(homes);

            const escrow = new ethers.Contract(
                config[network.chainId].escrow.address,
                Escrow.abi,
                provider
            );
            setEscrow(escrow);

            window.ethereum.on('accountsChanged', async () => {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                const account = ethers.getAddress(accounts[0]);
                setAccount(account);
            });

            // Handle network changes
            window.ethereum.on('chainChanged', () => {
                window.location.reload(); // Reload the page for the new network
            });
        } catch (error) {
            console.error("Error loading blockchain data:", error);
        }
    };

    useEffect(() => {
        loadBlockchainData();
    }, []);

    const togglePop = (home) => {
        setHome(home);
        setToggle(!toggle); // Toggle state
    };

    return (
        <div>
            <Navigation account={account} setAccount={setAccount} />
            <Search />

            <div className='cards__section'>
                <h3>Homes For You</h3>
                <hr />

                <div className='cards'>
                    {homes.map((home, index) => (
                        <div className='card' key={index} onClick={() => togglePop(home)}>
                            <div className='card__image'>
                                <img src={home
                                .image} alt="Home" />
                            </div>
                            <div className='card__info'>
                                <h4>{home.attributes[0].value} ETH</h4>
                                <p>
                                    <strong>{home.attributes[2].value}</strong> bds |
                                    <strong>{home.attributes[3].value}</strong> ba |
                                    <strong>{home.attributes[4].value}</strong> sqft
                                </p>
                                <p>{home.address}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {toggle && (
                <Home home={home} provider={provider} account={account} escrow={escrow} togglePop={togglePop} />
            )}
        </div>
    );
}

export default App;
