import Head from 'next/head';
import Navbar from './Navbar';
import { Container } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Layout({ children, title = 'Decentralized Credential Verification' }) {
    return (
        <>
            <Head>
                <title>{title}</title>
                <meta name="description" content="Decentralized Credential Verification System" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <Navbar />
            <Container className="mt-4 mb-4">
                <main>{children}</main>
            </Container>
            <footer className="footer mt-auto py-3 bg-light">
                <Container className="text-center">
                    <span className="text-muted">Decentralized Credential Verification System © 2025</span>
                </Container>
            </footer>
        </>
    );
}
