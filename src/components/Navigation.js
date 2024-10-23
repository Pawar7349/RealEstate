import React from 'react';
import { ethers } from 'ethers';
import logo from '../assets/logo.svg';

// Access utils like this
const Navigation = ({ account, setAccount }) => {
    const connectHandler = async () => {
        if (window.ethereum) {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                const account = ethers.getAddress(accounts[0]);
                setAccount(account);
            } catch (error) {
                alert("Connection denied. Please allow access to your wallet.");
                console.error("Error connecting to wallet:", error);
            }
        } else {
            alert("Please install MetaMask!");
        }
    };

    return (
        <nav>
            <ul className='nav__links'>
                <li><a href="#">Buy</a></li>
                <li><a href="#">Rent</a></li>
                <li><a href="#">Sell</a></li>
            </ul>
            <div className='nav__brand'>
                <img src={logo} alt="Logo" />
                <h1>Millow</h1>
            </div>
            {account ? (
                <button
                    type="button"
                    className='nav__connect'
                >
                    {account.slice(0, 6) + '...' + account.slice(-4)}
                </button>
            ) : (
                <button
                    type="button"
                    className='nav__connect'
                    onClick={connectHandler}
                >
                    Connect
                </button>
            )}
        </nav>
    );
};

export default Navigation;
