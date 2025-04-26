"use client";

import { useState, useEffect } from 'react';
import Layout from '../../../components/layout';
import { Form, Button, Alert, Card, Table, Tabs, Tab, Modal, ListGroup, Dropdown } from 'react-bootstrap';
import { mainContract } from '../../../utils/contracts';
import { getCurrentAccount, connectWallet } from '../../../utils/web3';

export default function StudentDashboard() {
    const [account, setAccount] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [documents, setDocuments] = useState([]);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [adhaarId, setAdhaarId] = useState('');
    const [isRegistered, setIsRegistered] = useState(false);
    const [myAdhaarId, setMyAdhaarId] = useState('');
    const [credentialTypeNames] = useState(['Educational', 'Professional', 'Certification', 'Other']);
    const [showAccessModal, setShowAccessModal] = useState(false);
    const [viewerAddress, setViewerAddress] = useState('');
    const [revokeAddress, setRevokeAddress] = useState('');
    const [activeTab, setActiveTab] = useState('myCredentials');
    const [authorizedViewers, setAuthorizedViewers] = useState([]);

    useEffect(() => {
        const init = async () => {
            const connected = await connectWallet();
            if (connected) {
                const acc = await getCurrentAccount();
                console.log("Account connected:", acc);
                setAccount(acc);

                try {
                    // Check if student is registered
                    try {
                        const myAdhaar = await mainContract.methods.getMyAdhaarId().call({ from: acc });

                        if (myAdhaar && myAdhaar !== '0') {
                            setIsRegistered(true);
                            setMyAdhaarId(myAdhaar);

                            // Load all documents
                            await loadDocuments(myAdhaar, acc);
                        }
                    } catch (error) {
                        console.log("Not registered yet or no document exists");
                        setIsRegistered(false);
                    }
                } catch (error) {
                    console.error("Error during initialization:", error);
                }
            }
        };

        init();
    }, []);

    const loadDocuments = async (id, accountAddress) => {
        setLoading(true);
        try {
            // Check if documents exist
            const hasDoc = await mainContract.methods.hasDocuments(id).call();

            if (hasDoc) {
                console.log("Loading documents for:", id);
                // Get all documents
                const docs = await mainContract.methods.GetAllDocs(id).call({ from: accountAddress });
                setDocuments(docs);

                if (docs.length > 0) {
                    setSelectedDoc(docs[0]);
                }
            } else {
                setError("No documents found for this Aadhaar ID.");
            }
        } catch (error) {
            console.error("Error loading documents:", error);
            setError("Failed to load documents. You may not have permission to view them.");
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            if (!adhaarId || adhaarId.length !== 12 || isNaN(adhaarId)) {
                throw new Error("Please enter a valid 12-digit Aadhaar ID");
            }

            await mainContract.methods.registerStudent(adhaarId).send({ from: account });
            setSuccess("Successfully registered. You can now view your credentials if they exist.");
            setMyAdhaarId(adhaarId);
            setIsRegistered(true);

            // Try to load documents
            await loadDocuments(adhaarId, account);
        } catch (error) {
            console.error("Error registering student:", error);
            setError(error.message || "Failed to register. Please check your Aadhaar ID and try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSelectDocument = (doc) => {
        setSelectedDoc(doc);
    };

    const handleGrantAccess = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            if (!viewerAddress || !viewerAddress.startsWith('0x')) {
                throw new Error("Please enter a valid Ethereum address");
            }

            await mainContract.methods.grantAccess(myAdhaarId, viewerAddress).send({ from: account });

            // Update authorized viewers list
            setAuthorizedViewers(prev => [...prev, viewerAddress]);

            setSuccess(`Access granted to ${viewerAddress}`);
            setViewerAddress('');
            setShowAccessModal(false);
        } catch (error) {
            console.error("Error granting access:", error);
            setError("Failed to grant access. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleRevokeAccess = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            if (!revokeAddress || !revokeAddress.startsWith('0x')) {
                throw new Error("Please enter a valid Ethereum address");
            }

            await mainContract.methods.revokeAccess(myAdhaarId, revokeAddress).send({ from: account });

            // Remove from authorized viewers list
            setAuthorizedViewers(prev => prev.filter(addr => addr !== revokeAddress));

            setSuccess(`Access revoked from ${revokeAddress}`);
            setRevokeAddress('');

        } catch (error) {
            console.error("Error revoking access:", error);
            setError("Failed to revoke access. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!account) {
        return (
            <Layout>
                <Card className="my-4">
                    <Card.Header as="h5">Student Portal</Card.Header>
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

    if (!isRegistered) {
        return (
            <Layout>
                <Card className="my-4">
                    <Card.Header as="h5">Student Registration</Card.Header>
                    <Card.Body>
                        <p>Register with your Aadhaar ID to access your credentials</p>

                        {error && <Alert variant="danger">{error}</Alert>}
                        {success && <Alert variant="success">{success}</Alert>}

                        <Form onSubmit={handleRegister}>
                            <Form.Group className="mb-3">
                                <Form.Label>Aadhaar ID</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="12-digit Aadhaar ID"
                                    value={adhaarId}
                                    onChange={(e) => setAdhaarId(e.target.value)}
                                    maxLength={12}
                                    required
                                />
                            </Form.Group>

                            <Button variant="primary" type="submit" disabled={loading}>
                                {loading ? 'Processing...' : 'Register'}
                            </Button>
                        </Form>
                    </Card.Body>
                </Card>
            </Layout>
        );
    }

    return (
        <Layout>
            <Card className="my-4">
                <Card.Header as="h5">Student Dashboard</Card.Header>
                <Card.Body>
                    <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
                        <Tab eventKey="myCredentials" title="My Credentials">
                            {error && <Alert variant="danger">{error}</Alert>}
                            {success && <Alert variant="success">{success}</Alert>}

                            {documents.length > 0 ? (
                                <>
                                    <div className="mb-4">
                                        <h5>Select Document</h5>
                                        <div className="d-flex flex-wrap gap-2">
                                            {documents.map((doc, index) => (
                                                <Button
                                                    key={index}
                                                    variant={selectedDoc && selectedDoc.ipfsHash === doc.ipfsHash ? "primary" : "outline-primary"}
                                                    onClick={() => handleSelectDocument(doc)}
                                                >
                                                    {credentialTypeNames[doc.credentialType]}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>

                                    {selectedDoc && (
                                        <>
                                            <Alert variant={selectedDoc.verified ? "success" : "warning"}>
                                                {selectedDoc.verified
                                                    ? "This credential has been verified ✅"
                                                    : "This credential is pending verification ⏳"}
                                            </Alert>

                                            <Table striped bordered>
                                                <tbody>
                                                    <tr>
                                                        <th>Aadhaar ID</th>
                                                        <td>{selectedDoc.adhaarId}</td>
                                                    </tr>
                                                    <tr>
                                                        <th>Type</th>
                                                        <td>{credentialTypeNames[selectedDoc.credentialType] || 'Unknown'}</td>
                                                    </tr>
                                                    <tr>
                                                        <th>Issued By</th>
                                                        <td>{selectedDoc.uploaderName}</td>
                                                    </tr>
                                                    <tr>
                                                        <th>Institution</th>
                                                        <td>{selectedDoc.institutionName}</td>
                                                    </tr>
                                                    <tr>
                                                        <th>Issuer Address</th>
                                                        <td>{selectedDoc.uploader}</td>
                                                    </tr>
                                                    <tr>
                                                        <th>Issue Date</th>
                                                        <td>{selectedDoc.dateUploaded}</td>
                                                    </tr>
                                                    <tr>
                                                        <th>Verification Status</th>
                                                        <td>{selectedDoc.verified ? (
                                                            <span className="text-success">Verified ✅</span>
                                                        ) : (
                                                            <span className="text-danger">Not Verified ❌</span>
                                                        )}</td>
                                                    </tr>
                                                    <tr>
                                                        <th>IPFS Hash</th>
                                                        <td>
                                                            {selectedDoc.ipfsHash}
                                                            <br />
                                                            <a
                                                                href={`https://gateway.pinata.cloud/ipfs/${selectedDoc.ipfsHash}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="btn btn-sm btn-info mt-2"
                                                            >
                                                                View Document
                                                            </a>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </Table>

                                            <div className="mt-4">
                                                <Button variant="primary" onClick={() => setShowAccessModal(true)}>
                                                    Manage Access
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </>
                            ) : (
                                <Alert variant="info">
                                    {loading ? 'Loading your credentials...' : 'No credentials found for your Aadhaar ID.'}
                                </Alert>
                            )}
                        </Tab>

                        <Tab eventKey="profile" title="Account Information">
                            <p><strong>Connected Address:</strong> {account}</p>
                            <p><strong>Registered Aadhaar ID:</strong> {myAdhaarId}</p>
                            <p><strong>Number of Documents:</strong> {documents.length}</p>
                            <hr />
                            <p>From this portal, you can view your credentials and manage who has access to them.</p>
                        </Tab>
                    </Tabs>
                </Card.Body>
            </Card>

            {/* Access Management Modal */}
            <Modal show={showAccessModal} onHide={() => setShowAccessModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Manage Document Access</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <h5>Grant Access</h5>
                    <Form onSubmit={handleGrantAccess}>
                        <Form.Group className="mb-3">
                            <Form.Label>Ethereum Address</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="0x..."
                                value={viewerAddress}
                                onChange={(e) => setViewerAddress(e.target.value)}
                                required
                            />
                            <Form.Text className="text-muted">
                                Enter the Ethereum address of the person you want to grant access to.
                            </Form.Text>
                        </Form.Group>

                        <Button variant="success" type="submit" disabled={loading}>
                            {loading ? 'Processing...' : 'Grant Access'}
                        </Button>
                    </Form>

                    <hr />

                    <h5>Revoke Access</h5>
                    <Form onSubmit={handleRevokeAccess}>
                        <Form.Group className="mb-3">
                            <Form.Label>Ethereum Address</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="0x..."
                                value={revokeAddress}
                                onChange={(e) => setRevokeAddress(e.target.value)}
                                required
                            />
                            <Form.Text className="text-muted">
                                Enter the Ethereum address of the person you want to revoke access from.
                            </Form.Text>
                        </Form.Group>

                        <Button variant="danger" type="submit" disabled={loading}>
                            {loading ? 'Processing...' : 'Revoke Access'}
                        </Button>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAccessModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </Layout>
    );
}
