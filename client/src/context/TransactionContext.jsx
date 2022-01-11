import React, { useState, useEffect } from "react";
import { ethers } from 'ethers';


import { contractABI, contractAddress } from '../utils/constants';


export const TransactionContext = React.createContext();

const { ethereum } = window;


const getEthereumContract = () => {
    const provider = new ethers.providers.Web3Provider( ethereum );
    const signer = provider.getSigner();
    const transactionContract = new ethers.Contract( contractAddress, contractABI , signer);
    // console.log( {
    //     provider,
    //     signer,
    //     transactionContract
    // })

    return transactionContract;
}

export const TransactionProvider = ( { children }) => {

    const [currentAccount, setCurrentAccount] = useState('');
    const [ formData, setFormData ] = useState({ addressTo: '', amount: '', keyword : '', message: ''});
    const [isLoading, setIsLoading] = useState(false);
    const [transactionCount, setTransactionCount] = useState(localStorage.getItem('transactionCount'));
    const [transactions, setTransactions] = useState([]);
    

    const handleChange = (e, name) => {
        setFormData((prevState) => ({ ...prevState, [name] : e.target.value}));
    }

    const getAllTransactions = async () => {
        try {
            if( !ethereum ) return alert('Please install Metamask on your browser to connect an account.');

            const transactionContract = getEthereumContract();
            const availableTransactions = await transactionContract.getAllTransctions(); // made a typo error from my smart contract

            const structuredTransactions = availableTransactions.map(( transaction) => ({
                addressTo: transaction.receiver,
                addressFrom: transaction.sender,
                timestamp: new Date(transaction.timestamp.toNumber() * 1000).toLocaleString(),
                message: transaction.message,
                keyword: transaction.keyword,
                amount: parseInt( transaction.amount._hex) / ( 10 ** 18 )
            }));

            setTransactions( structuredTransactions);
            // console.log( structuredTransactions );

        } catch (error) {
            console.log(error);
            throw new Error('No Eth Obj.');
        }
    }

    const checkIfWalletIsConnected = async () => {

        try {
            if( !ethereum ) return alert('Please install Metamask on your browser to proceed...');
            const accounts = await ethereum.request({ method: 'eth_accounts'}); //metatask
            if( accounts.length ){
                // const provider = new ethers.providers.Web3Provider( window.ethereum );
                // const balance = await provider.getBalance(accounts[0]); // ethers
                // console.log(`The User Balance is ${balance}`);
                setCurrentAccount(accounts[0]);
                getAllTransactions();
            }else{
                console.log('No account found');
            }
        } catch (error) {
            console.log( error );
            throw new Error("No Ethereum Object When Checking if Wallet Is Connected.");
        }
        
    }

    const checkIfTransactionExist = async () => {
        try {
            const transactionContract = getEthereumContract();
            const transactionCount = await transactionContract.getTransactionCount();
            window.localStorage.setItem("transactionCount", transactionCount);
        } catch (error) {
            console.log(error);
            throw new Error('No Eth Obj');
        }
    }

    // connect Wallet
    const connectWallet = async () => {
        try {
            if( !ethereum ) return alert('Please install Metamask on your browser to connect an account.');
            const accounts = await ethereum.request({ method: 'eth_requestAccounts'});
            setCurrentAccount(accounts[0]); // set the user account to the first
        } catch (error) {
            console.log( error );
            throw new Error("No Ethereum Object.");
        }
    }


    // send Transaction
    const sendTransaction = async () => {
        try {
            if( !ethereum ) return alert('Please install Metamask on your browser to send Transaction.');
            
            const { addressTo, amount, keyword, message } = formData;
            const transactionContract = getEthereumContract();
            const parsedAmount = ethers.utils.parseEther(amount) // convert to GWEI

            // console.log( ethereum.selectedAddress );
            // send the eth
            await ethereum.request({
                method: 'eth_sendTransaction',
                params: [{
                    // from: ethereum.selectedAddress,
                    from: currentAccount,
                    to: addressTo,
                    gas: '0x5208', // 21000 GWEI
                    value: parsedAmount._hex
                }]
            });

            // store to blockchain
            const transactionHarsh = await transactionContract.addToBlockchain( addressTo, parsedAmount, message, keyword);

            setIsLoading( true );
            console.log(`Loading - ${transactionHarsh.hash}`);
            await transactionHarsh.wait();

            setIsLoading( false );
            console.log(`Success - ${transactionHarsh.hash}`);

            const transactionCount = await transactionContract.getTransactionCount();
            setTransactionCount(transactionCount.toNumber());            

        } catch (error) {
            console.log(error);
            throw new Error('No Ethereum Method / Send Transaction ...');
        }
    }

    // useEffect to load the function at the start of the app
    useEffect(() => {
        checkIfWalletIsConnected();
        checkIfTransactionExist();
         // force page refresh on network changes
        // const provider = new ethers.providers.Web3Provider( window.ethereum );
        // provider.on("network", ( newNetwork, oldNetwork) => {
        //     console.log( newNetwork, oldNetwork );
        //     if( oldNetwork){
        //         window.location.reload();
        //         console.log('old network selected');
        //     }
        // });

        
    }, [transactionCount]);

    useEffect(() => {
        ethereum.on('accountChanged', (accounts) => {
            console.log( ethereum.selectedAddress);
            window.location.reload();
        });
    }, [ethereum.chainId]);

    return (
        <TransactionContext.Provider value={{ 
                connectWallet, 
                currentAccount, 
                formData, 
                sendTransaction,
                handleChange,
                transactions,
                isLoading
             }}>
            {children}
        </TransactionContext.Provider>
    )
}