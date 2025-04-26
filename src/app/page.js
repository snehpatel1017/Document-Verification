'use client';

import { useEffect, useState } from 'react';
import Layout from '../../components/layout'; // Adjust path if needed
import { Button, Card, Row, Col } from 'react-bootstrap';
import Link from 'next/link';
import { FaUniversity, FaUserGraduate, FaCheckCircle, FaUserShield } from 'react-icons/fa';
import { connectWallet, getCurrentAccount } from '../../utils/web3';

export default function Home() {
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
    <Layout>
      <div className="text-center my-5">
        <h1>Decentralized Credential Verification System</h1>
        <p className="lead">
          A secure platform for issuing, managing, and verifying academic credentials using blockchain technology
        </p>

        {!connected && (
          <Button variant="primary" size="lg" onClick={handleConnectWallet} className="mt-3">
            Connect Wallet to Get Started
          </Button>
        )}
      </div>

      <Row className="my-5">
        <Col md={3}>
          <Card className="h-100 text-center">
            <Card.Body>
              <FaUserShield size={50} className="mb-3 text-primary" />
              <Card.Title>Admin</Card.Title>
              <Card.Text>
                Authorize universities to issue credentials on the blockchain
              </Card.Text>
              <Link href="/admin">
                <Button variant="outline-primary">Admin Portal</Button>
              </Link>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100 text-center">
            <Card.Body>
              <FaUniversity size={50} className="mb-3 text-success" />
              <Card.Title>University</Card.Title>
              <Card.Text>
                Issue and manage academic credentials securely
              </Card.Text>
              <Link href="/university">
                <Button variant="outline-success">University Portal</Button>
              </Link>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100 text-center">
            <Card.Body>
              <FaUserGraduate size={50} className="mb-3 text-info" />
              <Card.Title>Student</Card.Title>
              <Card.Text>
                Verify and retrieve your academic credentials
              </Card.Text>
              <Link href="/student" >
                <Button variant="outline-info">Student Portal</Button>
              </Link>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100 text-center">
            <Card.Body>
              <FaCheckCircle size={50} className="mb-3 text-warning" />
              <Card.Title>Verifier</Card.Title>
              <Card.Text>
                Verify the authenticity of academic credentials
              </Card.Text>
              <Link href="/verify">
                <Button variant="outline-warning">Verification Portal</Button>
              </Link>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <div className="mt-5">
        <h2>How It Works</h2>
        <Row className="mt-4">
          <Col md={6}>
            <h4>For Universities</h4>
            <ol className="list-group list-group-numbered">
              <li className="list-group-item">Register your institution with the admin</li>
              <li className="list-group-item">Upload credential documents to IPFS</li>
              <li className="list-group-item">Store credential information on the blockchain</li>
            </ol>
          </Col>
          <Col md={6}>
            <h4>For Students</h4>
            <ol className="list-group list-group-numbered">
              <li className="list-group-item">Verify your credentials using your Aadhaar ID</li>
              <li className="list-group-item">Retrieve your documents securely from IPFS</li>
              <li className="list-group-item">Share credential verification with employers</li>
            </ol>
          </Col>
        </Row>
      </div>
    </Layout>
  );
}
