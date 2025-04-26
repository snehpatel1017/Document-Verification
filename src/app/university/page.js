"use client";

import { useState, useEffect } from 'react';
import Layout from '../../../components/layout';
import { Form, Button, Alert, Card, Spinner, Tabs, Tab, InputGroup, Table, Dropdown } from 'react-bootstrap';
import { mainContract } from '../../../utils/contracts';
import { getCurrentAccount, connectWallet } from '../../../utils/web3';
import axios from 'axios';

export default function University() {
    const [account, setAccount] = useState('');
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [adhaarId, setAdhaarId] = useState('');
    const [uploaderName, setUploaderName] = useState('');
    const [credentialType, setCredentialType] = useState('0'); // Default to EDUCATIONAL
    const [institutionName, setInstitutionName] = useState('');
    const [activeTab, setActiveTab] = useState('issueCredential');

    // For verification
    const [verifyAdhaarId, setVerifyAdhaarId] = useState('');
    const [verifyHash, setVerifyHash] = useState('');
    const [verifyType, setVerifyType] = useState('0');
    const [verifyLoading, setVerifyLoading] = useState(false);

    // For document lookup
    const [lookupAdhaarId, setLookupAdhaarId] = useState('');
    const [documents, setDocuments] = useState([]);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [lookupLoading, setLookupLoading] = useState(false);
    const [credentialTypeNames] = useState(['Educational', 'Professional', 'Certification', 'Other']);

    useEffect(() => {
        const init = async () => {
            const connected = await connectWallet();
            if (connected) {
                const account = await getCurrentAccount();
                setAccount(account);

                try {
                    // Check if this account is an authorized institute
                    const instituteStatus = await mainContract.methods.institute(account).call();
                    setIsAuthorized(instituteStatus.toString() === '1');
                } catch (error) {
                    console.error("Error checking authorization:", error);
                    setIsAuthorized(false);
                }
            }
        };

        init();
    }, []);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || !adhaarId || !uploaderName || !institutionName) {
            setError('Please fill all required fields and upload a file.');
            return;
        }

        if (isNaN(adhaarId) || adhaarId.length !== 12) {
            setError('Please enter a valid 12-digit Aadhaar ID.');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            // Upload file to IPFS
            console.log('Uploading file to IPFS...');
            const formData = new FormData();
            formData.append('file', file);

            const ipfsResponse = await axios({
                method: 'post',
                url: 'https://api.pinata.cloud/pinning/pinFileToIPFS',
                data: formData,
                headers: {
                    pinata_api_key: process.env.NEXT_PUBLIC_PINATA_API_KEY,
                    pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_API_SECRET,
                    'Content-Type': `multipart/form-data; boundary=${formData._boundary}`
                }
            });

            if (ipfsResponse.status !== 200) {
                console.error('IPFS upload failed:', ipfsResponse.statusText);
                throw new Error('Failed to upload file to IPFS');
            }

            const ipfsData = await ipfsResponse.data;
            const ipfsHash = ipfsData.IpfsHash;
            console.log('IPFS Hash:', ipfsHash);

            // Current date
            const currentDate = new Date().toISOString().split('T')[0];

            // Store document on blockchain
            await mainContract.methods.StoreDocument(
                ipfsHash,
                currentDate,
                BigInt(adhaarId),
                uploaderName,
                parseInt(credentialType),
                institutionName
            ).send({ from: account });

            setSuccess(`Document has been successfully stored on blockchain and IPFS with hash: ${ipfsHash}`);

            // Reset form
            setFile(null);
            setAdhaarId('');
            setUploaderName('');
            setCredentialType('0');
            setInstitutionName('');

        } catch (error) {
            console.error('Error storing document:', error);
            setError('Failed to store document. Please make sure you are authorized and try again.');
        } finally {
            // Reset file input
            const fileInput = document.getElementById('file-upload');
            if (fileInput) {
                fileInput.value = '';
            }
            setLoading(false);
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();

        if (!verifyAdhaarId || !verifyHash || verifyType === undefined) {
            setError('Please enter Aadhaar ID, document hash, and select credential type.');
            return;
        }

        setVerifyLoading(true);
        setError('');
        setSuccess('');

        try {
            // Modified to include credential type
            await mainContract.methods.verify(
                verifyHash,
                verifyAdhaarId,
                parseInt(verifyType)
            ).send({ from: account });

            setSuccess('Document has been successfully verified!');

            // Reset form
            setVerifyAdhaarId('');
            setVerifyHash('');
            setVerifyType('0');
        } catch (error) {
            console.error('Error verifying document:', error);
            setError('Failed to verify document. Please check the hash and credential type, and try again.');
        } finally {
            setVerifyLoading(false);
        }
    };

    const handleLookup = async (e) => {
        e.preventDefault();

        if (!lookupAdhaarId) {
            setError('Please enter an Aadhaar ID to look up.');
            return;
        }

        setLookupLoading(true);
        setError('');
        setDocuments([]);
        setSelectedDoc(null);

        try {
            // First check if documents exist
            const hasDoc = await mainContract.methods.hasDocuments(lookupAdhaarId).call();

            if (!hasDoc) {
                setError('No documents found for this Aadhaar ID.');
                return;
            }

            // Check if institute has access
            const hasAccess = await mainContract.methods.hasViewAccess(lookupAdhaarId, account).call();

            if (!hasAccess) {
                setError('You do not have permission to view documents for this Aadhaar ID.');
                return;
            }

            // Get all documents
            const docs = await mainContract.methods.GetAllDocs(lookupAdhaarId).call({ from: account });
            setDocuments(docs);

            if (docs.length > 0) {
                setSelectedDoc(docs[0]);
            }
        } catch (error) {
            console.error('Error looking up documents:', error);
            setError('Failed to retrieve document information.');
        } finally {
            setLookupLoading(false);
        }
    };

    const handleSelectDocument = (doc) => {
        setSelectedDoc(doc);
    };

    if (!account) {
        return (
            <Layout>
                <Card className="my-4">
                    <Card.Header as="h5">University Portal</Card.Header>
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

    if (!isAuthorized) {
        return (
            <Layout>
                <Card className="my-4">
                    <Card.Header as="h5">University Portal</Card.Header>
                    <Card.Body>
                        <Alert variant="danger">
                            Your institution is not authorized to issue credentials. Please contact the admin to get authorized.
                        </Alert>
                    </Card.Body>
                </Card>
            </Layout>
        );
    }

    return (
        <Layout>
            <Card className="my-4">
                <Card.Header as="h5">University Portal</Card.Header>
                <Card.Body>
                    <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
                        <Tab eventKey="issueCredential" title="Issue Credential">
                            <h4>Issue New Credential</h4>
                            <p>Upload a student's credential document to IPFS and record it on the blockchain.</p>

                            {error && <Alert variant="danger">{error}</Alert>}
                            {success && <Alert variant="success">{success}</Alert>}

                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Student Aadhaar ID</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter 12-digit Aadhaar ID"
                                        value={adhaarId}
                                        onChange={(e) => setAdhaarId(e.target.value)}
                                        required
                                        maxLength={12}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Institution Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter your institution name"
                                        value={institutionName}
                                        onChange={(e) => setInstitutionName(e.target.value)}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Issuer Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter issuer name"
                                        value={uploaderName}
                                        onChange={(e) => setUploaderName(e.target.value)}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Credential Type</Form.Label>
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
                                    <Form.Label>Credential Document</Form.Label>
                                    <Form.Control
                                        type="file"
                                        id="file-upload"
                                        onChange={handleFileChange}
                                        required
                                    />
                                    <Form.Text className="text-muted">
                                        Upload the credential document (PDF preferred).
                                    </Form.Text>
                                </Form.Group>

                                <Button variant="primary" type="submit" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Spinner animation="border" size="sm" className="me-2" />
                                            Uploading...
                                        </>
                                    ) : (
                                        'Issue Credential'
                                    )}
                                </Button>
                            </Form>
                        </Tab>

                        <Tab eventKey="verifyCredential" title="Verify Credential">
                            <h4>Verify Existing Credential</h4>
                            <p>Verify a credential by matching its hash with the one stored on the blockchain.</p>

                            {error && <Alert variant="danger">{error}</Alert>}
                            {success && <Alert variant="success">{success}</Alert>}

                            <Form onSubmit={handleVerify}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Aadhaar ID</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter student's Aadhaar ID"
                                        value={verifyAdhaarId}
                                        onChange={(e) => setVerifyAdhaarId(e.target.value)}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Credential Type</Form.Label>
                                    <Form.Select
                                        value={verifyType}
                                        onChange={(e) => setVerifyType(e.target.value)}
                                        required
                                    >
                                        <option value="0">Educational</option>
                                        <option value="1">Professional</option>
                                        <option value="2">Certification</option>
                                        <option value="3">Other</option>
                                    </Form.Select>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Document Hash</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter IPFS hash to verify"
                                        value={verifyHash}
                                        onChange={(e) => setVerifyHash(e.target.value)}
                                        required
                                    />
                                </Form.Group>

                                <Button variant="success" type="submit" disabled={verifyLoading}>
                                    {verifyLoading ? 'Verifying...' : 'Verify Document'}
                                </Button>
                            </Form>
                        </Tab>

                        <Tab eventKey="lookupCredential" title="Lookup Credential">
                            <h4>Lookup Credential</h4>
                            <p>View details of credentials by Aadhaar ID (if you have access).</p>

                            {error && <Alert variant="danger">{error}</Alert>}

                            <Form onSubmit={handleLookup} className="mb-4">
                                <InputGroup>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter Aadhaar ID"
                                        value={lookupAdhaarId}
                                        onChange={(e) => setLookupAdhaarId(e.target.value)}
                                        required
                                    />
                                    <Button variant="outline-primary" type="submit" disabled={lookupLoading}>
                                        {lookupLoading ? 'Loading...' : 'Lookup'}
                                    </Button>
                                </InputGroup>
                            </Form>

                            {documents.length > 0 && (
                                <div className="mt-4">
                                    <h5>Select Document Type</h5>
                                    <div className="d-flex flex-wrap gap-2 mb-3">
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

                                    {selectedDoc && (
                                        <div className="mt-3">
                                            <h5>Credential Information</h5>
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
                                                        <th>Institution</th>
                                                        <td>{selectedDoc.institutionName}</td>
                                                    </tr>
                                                    <tr>
                                                        <th>Issuer</th>
                                                        <td>{selectedDoc.uploaderName}</td>
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
                                                            <a
                                                                href={`https://gateway.pinata.cloud/ipfs/${selectedDoc.ipfsHash}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                {selectedDoc.ipfsHash}
                                                            </a>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </Table>
                                        </div>
                                    )}
                                </div>
                            )}
                        </Tab>
                    </Tabs>
                </Card.Body>
            </Card>
        </Layout>
    );
}
