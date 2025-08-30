'use client'
import React, { useState, useEffect } from "react";
import Web3Modal from "web3modal";
import { ethers } from "ethers";
import { CC_ADDRESS, CC_ABI } from "./constants";

// FETCHING SMART CONTRACT
const fetchContract = (signerOrProvider) =>
    new ethers.Contract(CC_ADDRESS, CC_ABI, signerOrProvider);

export const CC_Context = React.createContext();

export const CCProvider = ({ children }) => {
    const [currentAccount, setCurrentAccount] = useState("");
    const [error, setError] = useState(null);

    const generateCredit = async (amount, price) => {
        try {
            setError(null);
            const web3Modal = new Web3Modal();
            const connection = await web3Modal.connect();
            const provider = new ethers.BrowserProvider(connection);
            const signer = await provider.getSigner();
            const contract = fetchContract(signer);
            const amountBig = ethers.getBigInt(amount);
            const priceInWei = ethers.parseEther(price.toString());
            const transaction = await contract.generateCredit(amountBig, priceInWei, { gasLimit: 300000 });
            const receipt = await transaction.wait();
            if (receipt.status === 1) {
                console.log("Credit generated successfully!", receipt);
                return receipt;
            } else {
                throw new Error("Transaction failed!");
            }
        } catch (error) {
            console.error("Error in generateCredit:", error);
            setError(error.message || "Failed to generate credit");
            throw error;
        }
    };

    const sellCredit = async (creditId, price) => {
        try {
            const web3Modal = new Web3Modal();
            const connection = await web3Modal.connect();
            const provider = new ethers.BrowserProvider(connection);
            const signer = await provider.getSigner();
            const contract = fetchContract(signer);
            const priceInWei = ethers.parseEther(price.toString());
            const transaction = await contract.sellCredit(creditId, priceInWei, { gasLimit: 300000 });
            const receipt = await transaction.wait();
            console.log("Credit listed for sale!", receipt);
            return receipt;
        } catch (error) {
            console.error("Error listing for sale: ", error);
            throw error;
        }
    };

    const buyCredit = async (creditId, price) => {
        try {
            const web3Modal = new Web3Modal();
            const connection = await web3Modal.connect();
            const provider = new ethers.BrowserProvider(connection);
            const signer = await provider.getSigner();
            const contract = fetchContract(signer);
            const transaction = await contract.buyCredit(creditId, {
                value: ethers.parseEther(price.toString()),
                gasLimit: 300000
            });
            const receipt = await transaction.wait();
            console.log("Credit purchased!", receipt);
            return receipt;
        } catch (error) {
            console.error("Error purchasing credit: ", error);
            throw error;
        }
    };

    const removeFromSale = async (creditId) => {
        try {
            const web3Modal = new Web3Modal();
            const connection = await web3Modal.connect();
            const provider = new ethers.BrowserProvider(connection);
            const signer = await provider.getSigner();
            const contract = fetchContract(signer);
            const transaction = await contract.removeFromSale(creditId, { gasLimit: 300000 });
            const receipt = await transaction.wait();
            console.log('Credit removed from sale', receipt);
            return receipt;
        } catch (error) {
            console.error('Error removing credit from sale:', error);
            throw error;
        }
    };

    const expireCredit = async (creditId) => {
        try {
            const web3Modal = new Web3Modal();
            const connection = await web3Modal.connect();
            const provider = new ethers.BrowserProvider(connection);
            const signer = await provider.getSigner();
            const contract = fetchContract(signer);
            const transaction = await contract.Expire(creditId, { gasLimit: 300000 });
            const receipt = await transaction.wait();
            console.log('Expired credit: ', receipt);
            return receipt;
        } catch (error) {
            console.error('Can\'t expire credit:', error);
            throw error;
        }
    }

    const isExpired = async (creditId) => {
        try {
            const web3Modal = new Web3Modal();
            const connection = await web3Modal.connect();
            const provider = new ethers.BrowserProvider(connection);
            const contract = fetchContract(provider);
            const expired = await contract.isExpired(creditId);
            return expired;
        } catch (error) {
            console.error('Error checking expiry:', error);
            throw error;
        }
    };

    const getOwner = async (creditId) => {
        try {
            const web3Modal = new Web3Modal();
            const connection = await web3Modal.connect();
            const provider = new ethers.BrowserProvider(connection);
            const contract = fetchContract(provider);
            const owner = await contract.getOwner(creditId);
            return owner;
        } catch (error) {
            console.error('Error getting owner:', error);
            throw error;
        }
    };

    const getCreditDetails = async (creditId) => {
        try {
            const web3Modal = new Web3Modal();
            const connection = await web3Modal.connect();
            const provider = new ethers.BrowserProvider(connection);
            const contract = fetchContract(provider);
            const credit = await contract.credits(creditId);
            return {
                amount: credit.amount,
                owner: credit.owner,
                creator: credit.creator,
                expired: credit.expired,
                price: credit.price,
                forSale: credit.forSale,
                requestStatus: credit.requestStatus,
                numOfAuditors: credit.numOfAuditors,
                auditFees: credit.auditFees,
                auditScore: credit.auditScore,
                auditorsList: credit.auditorsList
            };
        } catch (error) {
            console.error('Error getting credit details:', error);
            throw error;
        }
    };

    const getNextCreditId = async () => {
        try {
            const web3Modal = new Web3Modal();
            const connection = await web3Modal.connect();
            const provider = new ethers.BrowserProvider(connection);
            const contract = fetchContract(provider);
            const nextCreditId = await contract.getNextCreditId();
            return nextCreditId;
        } catch (error) {
            console.error('Error getting next credit id:', error);
            throw error;
        }
    }

    const getPrice = async (creditId) => {
        try {
            const web3Modal = new Web3Modal();
            const connection = await web3Modal.connect();
            const provider = new ethers.BrowserProvider(connection);
            const contract = fetchContract(provider);
            const price = await contract.getPrice(creditId);
            return price;
        } catch (error) {
            console.error('Error getting price:', error);
            throw error;
        }
    }

    const requestAudit = async (creditId, price) => {
        try {
            const web3Modal = new Web3Modal();
            const connection = await web3Modal.connect();
            const provider = new ethers.BrowserProvider(connection);
            const signer = await provider.getSigner();
            const contract = fetchContract(signer);
            const transaction = await contract.requestAudit(creditId, {
                value: ethers.parseEther(price.toString()),
                gasLimit: 300000
            });
            const receipt = await transaction.wait();
            console.log("Audit Requested!", receipt);
            return receipt;
        } catch (error) {
            console.error("Error Requesting Audit: ", error);
            throw error;
        }
    }

    const auditCredit = async (creditId, vote) => {
        try {
            const web3Modal = new Web3Modal();
            const connection = await web3Modal.connect();
            const provider = new ethers.BrowserProvider(connection);
            const signer = await provider.getSigner();
            const contract = fetchContract(signer);
            const transaction = await contract.auditCredit(creditId, vote, { gasLimit: 300000 });
            const receipt = await transaction.wait();
            console.log("credit audited!", receipt);
            return receipt;
        } catch (error) {
            console.error("Error in voting", error);
            throw error;
        }
    }

    const getAuditorList = async (creditId) => {
        try {
            const web3Modal = new Web3Modal();
            const connection = await web3Modal.connect();
            const provider = new ethers.BrowserProvider(connection);
            const contract = fetchContract(provider);
            const auditorsList = await contract.getAuditorList(creditId);
            return auditorsList;
        } catch (error) {
            console.error('Error getting auditors:', error);
            throw error;
        }
    }

    const getContractBalance = async () => {
        try {
            const web3Modal = new Web3Modal();
            const connection = await web3Modal.connect();
            const provider = new ethers.BrowserProvider(connection);
            const contract = fetchContract(provider);
            const contractBalance = await contract.getContractBalance();
            return contractBalance;
        } catch (error) {
            console.error('Error getting contract Balance:', error);
            throw error;
        }
    }

    const getWalletBalance = async (address) => {
        try {
            if (!window.ethereum) return null;
            const provider = new ethers.BrowserProvider(window.ethereum);
            const balanceWei = await provider.getBalance(address);
            return ethers.formatEther(balanceWei);
        } catch (error) {
            console.error('Error getting wallet balance:', error);
            return null;
        }
    };

    const checkIfWalletIsConnected = async () => {
        try {
            console.log("checkIfWalletIsConnected called");
            if (!window.ethereum) {
                console.log("MetaMask not found, setting error");
                setError('Please install MetaMask');
                return;
            }
            console.log("MetaMask found, checking accounts...");
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            console.log("Accounts found:", accounts);
            if (accounts.length) {
                setCurrentAccount(accounts[0]);
                console.log("Wallet connected: ", accounts[0]);
            }
        } catch (error) {
            console.error('Error checking wallet connection:', error);
            setError('Error checking wallet connection');
        }
    };

    const connectWallet = async () => {
        try {
            console.log("connectWallet called");
            setError(null);
            
            if (!window.ethereum) {
                console.log("MetaMask not found in connectWallet");
                setError('Please install MetaMask');
                return;
            }
            
            console.log("Requesting wallet connection...");
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts',
            });
            
            console.log("Accounts returned:", accounts);
            
            if (accounts.length > 0) {
                setCurrentAccount(accounts[0]);
                console.log("Wallet connected successfully: ", accounts[0]);
                
                window.ethereum.on('accountsChanged', (newAccounts) => {
                    if (newAccounts.length > 0) {
                        setCurrentAccount(newAccounts[0]);
                        console.log("Account changed to: ", newAccounts[0]);
                    } else {
                        setCurrentAccount("");
                        console.log("No accounts found");
                    }
                });
                
                window.ethereum.on('chainChanged', (chainId) => {
                    console.log("Chain changed to: ", chainId);
                    window.location.reload();
                });
                
            } else {
                console.log("No accounts found");
                setError('No accounts found');
            }
        } catch (error) {
            console.error('Error connecting wallet:', error);
            if (error.code === 4001) {
                setError('User rejected wallet connection');
            } else {
                setError('Error connecting wallet: ' + error.message);
            }
        }
    };

    useEffect(() => {
        checkIfWalletIsConnected();
    }, []);

    return (
        <CC_Context.Provider
            value={{
                currentAccount,
                connectWallet,
                generateCredit,
                sellCredit,
                buyCredit,
                removeFromSale,
                expireCredit,
                getOwner,
                isExpired,
                getCreditDetails,
                getNextCreditId,
                getPrice,
                requestAudit,
                auditCredit,
                getAuditorList,
                getContractBalance,
                getWalletBalance,
                error,
            }}
        >
            {children}
        </CC_Context.Provider>
    );
};
