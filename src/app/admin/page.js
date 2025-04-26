"use client";

import { useState, useEffect } from 'react';
import Layout from '../../../components/layout';
import { Form, Button, Alert, Card, Tabs, Tab } from 'react-bootstrap';
import { mainContract } from '../../../utils/contracts';
import { getCurrentAccount, connectWallet } from '../../../utils/web3';

export default function Admin() {
    const [account, setAccount] = useState('');
    const [universityAddress, setUniversityAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isOwner, setIsOwner] = useState(false);
    const [activeTab, setActiveTab] = useState('authorizeUniversity');

    useEffect(() => {
        const init = async () => {
            const connected = await connectWallet();
            if (connected) {
                const account = await getCurrentAccount();
                setAccount(account);

                try {
                    // Check if current account is owner
                    const owner = await mainContract.methods.owner().call();
                    setIsOwner(account.toLowerCase() === owner.toLowerCase());
                } catch (error) {
                    console.error("Error checking owner:", error);
                    setIsOwner(false);
                }
            }
        };

        init();
    }, []);

    const handleAuthorizeUniversity = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        if (!universityAddress || !universityAddress.startsWith('0x')) {
            setError('Please enter a valid Ethereum address.');
            setLoading(false);
            return;
        }

        try {
            // Changed from ownerVerification to instiVerification to match the new contract
            await mainContract.methods.instiVerification(universityAddress).send({ from: account });
            setSuccess(`University with address ${universityAddress} has been authorized successfully.`);
            setUniversityAddress('');
        } catch (error) {
            console.error('Error authorizing university:', error);
            setError('Failed to authorize university. Make sure you are the contract owner.');
        } finally {
            setLoading(false);
        }
    };

    if (!account) {
        return (
            <Layout>
                <Card className="my-4">
                    <Card.Header as="h5">Admin Portal</Card.Header>
                    <Card.Body>
                        <Alert variant="warning">
                            Please connect your wallet to continue.
                        </Alert>
                        <Button onClick={connectWallet}>Connect Wallet</Button>
                    </Card.Body>
                </Card>
            </Layout>
        );
    }

    if (!isOwner) {
        return (
            <Layout>
                <Card className="my-4">
                    <Card.Header as="h5">Admin Portal</Card.Header>
                    <Card.Body>
                        <Alert variant="danger">
                            You do not have admin privileges. Only the contract owner can access this page.
                        </Alert>
                    </Card.Body>
                </Card>
            </Layout>
        );
    }

    return (
        <Layout>
            <Card className="my-4">
                <Card.Header as="h5">Admin Portal</Card.Header>
                <Card.Body>
                    <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
                        <Tab eventKey="authorizeUniversity" title="Authorize University">
                            <h4>Authorize University</h4>
                            <p>Add a university to the list of authorized institutions that can issue credentials.</p>

                            {error && <Alert variant="danger">{error}</Alert>}
                            {success && <Alert variant="success">{success}</Alert>}

                            <Form onSubmit={handleAuthorizeUniversity}>
                                <Form.Group className="mb-3">
                                    <Form.Label>University Ethereum Address</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="0x..."
                                        value={universityAddress}
                                        onChange={(e) => setUniversityAddress(e.target.value)}
                                        required
                                    />
                                    <Form.Text className="text-muted">
                                        Enter the Ethereum address of the university to authorize.
                                    </Form.Text>
                                </Form.Group>

                                <Button variant="primary" type="submit" disabled={loading}>
                                    {loading ? 'Processing...' : 'Authorize University'}
                                </Button>
                            </Form>
                        </Tab>
                        <Tab eventKey="contractInfo" title="Contract Information">
                            <h4>Contract Information</h4>
                            <p>Details about the deployed credential verification contract.</p>
                            <p><strong>Your Address:</strong> {account}</p>
                            <p><strong>Contract Owner:</strong> Yes</p>
                            <p><strong>Contract Address:</strong> {mainContract._address}</p>
                        </Tab>
                    </Tabs>
                </Card.Body>
            </Card>
        </Layout>
    );
}
