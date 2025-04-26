import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { connectWallet, getCurrentAccount } from '../utils/web3';

export default function NavbarComponent() {
    const [account, setAccount] = useState('');
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        checkIfWalletIsConnected();
    }, []);

    const checkIfWalletIsConnected = async () => {
        try {
            const account = await getCurrentAccount();
            if (account) {
                setAccount(account);
                setConnected(true);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleConnectWallet = async () => {
        const success = await connectWallet();
        if (success) {
            const account = await getCurrentAccount();
            setAccount(account);
            setConnected(true);
        }
    };

    return (
        <Navbar bg="light" expand="lg">
            <Container>
                <Nav.Link href="/"  >
                    <Navbar.Brand>Credential Verification</Navbar.Brand>
                </Nav.Link>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        <Nav.Link href="/"  >
                            Home
                        </Nav.Link>
                        <Nav.Link href="/admin"  >
                            Admin
                        </Nav.Link>

                        <Nav.Link href="/university"  >University</Nav.Link>


                        <Nav.Link href="/student"  >Student</Nav.Link>


                        <Nav.Link href="/verify"  >Verify</Nav.Link>

                    </Nav>
                    <Nav>
                        {connected ? (
                            <Navbar.Text>
                                Connected: {account.substring(0, 6)}...{account.substring(account.length - 4)}
                            </Navbar.Text>
                        ) : (
                            <button className="btn btn-primary" onClick={handleConnectWallet}>
                                Connect Wallet
                            </button>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}
