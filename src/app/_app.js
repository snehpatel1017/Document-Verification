import '../styles/globals.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useEffect } from 'react';

function MyApp({ Component, pageProps }) {
    useEffect(() => {
        // Import Bootstrap JS on client side only
        import('bootstrap/dist/js/bootstrap');
    }, []);

    return <Component {...pageProps} />;
}

export default MyApp;
