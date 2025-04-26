"use client";

import { useState, useEffect } from 'react';
import Layout from '../../../components/layout';
import { Form, Button, Alert, Card, Table, Badge, Spinner } from 'react-bootstrap';
import { mainContract } from '../../../utils/contracts';
import { getCurrentAccount, connectWallet } from '../../../utils/web3';

export default function Verify() {
    const [account, setAccount] = useState('');
    const [adhaarId, setAdhaarId] = useState('');
    const [ipfsHash, setIpfsHash] = useState('');
    const [credentialType, setCredentialType] = useState('0');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [document, setDocument] = useState(null);
    const [credentialTypeNames] = useState(['Educational', 'Professional', 'Certification', 'Other']);

    useEffect(() => {
        const init = async () => {
            try {
                const connected = await connectWallet();
                if (connected) {
                    const acc = await getCurrentAccount();
                    setAccount(acc);
                }
            } catch (error) {
                console.error("Initialization error:", error);
            }
        };

        init();
    }, []);

    const handleVerify = async (e) => {
        e.preventDefault();

        if (!adhaarId || !ipfsHash) {
            setError('Please fill all required fields.');
            return;
        }

        if (isNaN(adhaarId) || adhaarId.length !== 12) {
            setError('Please enter a valid 12-digit Aadhaar ID.');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');
        setDocument(null);

        try {
            const hasAccess = await mainContract.methods.hasViewAccess(adhaarId, account).call();

            if (!hasAccess) {
                setError('You do not have permission to view documents for this Aadhaar ID.');
                return;
            }

            // Check if document of this type exists
            const hasDocType = await mainContract.methods.hasDocumentOfType(
                adhaarId,
                parseInt(credentialType)
            ).call();

            if (!hasDocType) {
                setError(`No document of this type found for this Aadhaar ID.`);
                setLoading(false);
                return;
            }

            // Get the specific document
            const doc = await mainContract.methods.GetDocByType(
                adhaarId,
                parseInt(credentialType)
            ).call({ from: account });

            // Check if the provided IPFS hash matches the one in the contract
            if (doc.ipfsHash !== ipfsHash) {
                setError('There is no document of this type. The provided IPFS hash does not match our records.');
                setLoading(false);
                return;
            }

            // Document exists and hash matches - display it
            setDocument(doc);

            // If already verified, show a message
            if (doc.verified) {
                setSuccess('This document is already verified!');
                setLoading(false);
                return;
            }



            // Refresh document data to show updated verification status
            const updatedDoc = await mainContract.methods.GetDocByType(
                adhaarId,
                parseInt(credentialType)
            ).call({ from: account });

            setDocument(updatedDoc);

        } catch (error) {
            console.error('Error during verification:', error);
            setError('Failed to verify document. Please check your inputs and try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!account) {
        return (
            <Layout>
                <Card className="my-4">
                    <Card.Header as="h5">Verification Portal</Card.Header>
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

    return (
        <Layout>
            <Card className="my-4">
                <Card.Header as="h5">Document Verification Portal</Card.Header>
                <Card.Body>
                    <p className="mb-4">
                        Enter the Aadhaar ID, document type, and IPFS hash to verify a document's authenticity.
                    </p>

                    {error && <Alert variant="danger">{error}</Alert>}
                    {success && <Alert variant="success">{success}</Alert>}

                    <Form onSubmit={handleVerify}>
                        <Form.Group className="mb-3">
                            <Form.Label>Aadhaar ID</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="12-digit Aadhaar number"
                                value={adhaarId}
                                onChange={(e) => setAdhaarId(e.target.value)}
                                required
                                maxLength={12}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Document Type</Form.Label>
                            <Form.Select
                                value={credentialType}
                                onChange={(e) => setCredentialType(e.target.value)}
                                required
                            >
                                <option value="0">Educational</option>
                                <option value="1">Professional</option>
                                <option value="2">Certification</option>
                                <option value="3">Other</option>
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>IPFS Hash</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="QmXYZ..."
                                value={ipfsHash}
                                onChange={(e) => setIpfsHash(e.target.value)}
                                required
                            />
                            <Form.Text className="text-muted">
                                Enter the IPFS hash of the document you want to verify.
                            </Form.Text>
                        </Form.Group>

                        <Button variant="primary" type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Spinner animation="border" size="sm" className="me-2" />
                                    Verifying...
                                </>
                            ) : (
                                'Verify Document'
                            )}
                        </Button>
                    </Form>
                </Card.Body>
            </Card>

            {document && (
                <Card className="my-4">
                    <Card.Header as="h5">Document Information</Card.Header>
                    <Card.Body>
                        <div className="mb-3">
                            <Badge bg={document.verified ? "success" : "warning"} className="p-2">
                                {document.verified ? 'Verified Document ✅' : 'Pending Verification ⏳'}
                            </Badge>
                        </div>

                        <Table striped bordered hover>
                            <tbody>
                                <tr>
                                    <th>Aadhaar ID</th>
                                    <td>{document.adhaarId}</td>
                                </tr>
                                <tr>
                                    <th>Document Type</th>
                                    <td>{credentialTypeNames[document.credentialType] || 'Unknown'}</td>
                                </tr>
                                <tr>
                                    <th>Institution</th>
                                    <td>{document.institutionName}</td>
                                </tr>
                                <tr>
                                    <th>Issued By</th>
                                    <td>{document.uploaderName}</td>
                                </tr>
                                <tr>
                                    <th>Issuer Address</th>
                                    <td>{document.uploader}</td>
                                </tr>
                                <tr>
                                    <th>Issue Date</th>
                                    <td>{document.dateUploaded}</td>
                                </tr>
                                <tr>
                                    <th>Verification Status</th>
                                    <td>
                                        {document.verified ? (
                                            <span className="text-success">Verified ✅</span>
                                        ) : (
                                            <span className="text-warning">Pending Verification ⏳</span>
                                        )}
                                    </td>
                                </tr>
                                <tr>
                                    <th>IPFS Hash</th>
                                    <td>{document.ipfsHash}</td>
                                </tr>
                            </tbody>
                        </Table>

                        <div className="mt-3">
                            <a
                                href={`https://gateway.pinata.cloud/ipfs/${document.ipfsHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-success"
                            >
                                View Document
                            </a>
                        </div>
                    </Card.Body>
                </Card>
            )}
        </Layout>
    );
}
