'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import Link from 'next/link';

export default function AdminLayout({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleGoogleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
    };

    if (loading) {
        return <div style={{ textAlign: "center", padding: "4rem" }}>Loading securely...</div>;
    }

    if (!user) {
        return (
            <div style={{ maxWidth: "400px", margin: "4rem auto", backgroundColor: "var(--bg-secondary)", padding: "2rem", borderRadius: "16px", border: "1px solid var(--skeuo-border)", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
                <h2 style={{ textAlign: "center", marginBottom: "2rem" }}>Admin Login</h2>
                {error && <div style={{ color: "#ef4444", marginBottom: "1rem", fontSize: "0.9rem" }}>{error}</div>}

                <form onSubmit={handleEmailLogin} className="form-group">
                    <label className="form-label">Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="form-input" required />

                    <label className="form-label" style={{ marginTop: "1rem" }}>Password</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="form-input" required />

                    <button type="submit" className="btn" style={{ marginTop: "1.5rem", width: "100%" }}>Login with Email</button>
                </form>

                <div style={{ textAlign: "center", margin: "1.5rem 0", color: "var(--text-secondary)" }}>OR</div>

                <button onClick={handleGoogleLogin} className="btn" style={{ width: "100%", backgroundColor: "#fff", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: "18px" }} />
                    Sign in with Google
                </button>
            </div>
        );
    }

    return (
        <div style={{ display: "flex", minHeight: "80vh", gap: "2rem" }}>
            <aside style={{ width: "250px", borderRight: "1px solid var(--skeuo-border)", paddingRight: "1rem" }}>
                <h3 style={{ marginBottom: "2rem" }}>Dashboard</h3>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <li>
                        <Link href="/admin" style={{ display: "block", padding: "0.5rem", borderRadius: "8px", background: "var(--bg-secondary)" }}>All Posts</Link>
                    </li>
                    <li>
                        <Link href="/admin/draft" style={{ display: "block", padding: "0.5rem", borderRadius: "8px", background: "var(--bg-secondary)" }}>Write New Post</Link>
                    </li>
                </ul>
                <button onClick={handleLogout} style={{ marginTop: "3rem", background: "transparent", border: "1px solid #ef4444", color: "#ef4444", padding: "0.5rem 1rem", borderRadius: "8px", cursor: "pointer", width: "100%" }}>
                    Logout
                </button>
            </aside>
            <section style={{ flexGrow: "1" }}>
                {children}
            </section>
        </div>
    );
}
