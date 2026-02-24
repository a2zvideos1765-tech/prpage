'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const res = await fetch('/api/posts');
            const data = await res.json();
            setPosts(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const deletePost = async (id) => {
        if (!confirm('Are you sure you want to delete this post?')) return;
        try {
            await fetch(`/api/posts/${id}`, { method: 'DELETE' });
            fetchPosts();
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div>Loading dashboard...</div>;

    return (
        <div className="animate-fade-in">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <h2>Manage PRs & News</h2>
                <Link href="/admin/draft" className="btn">
                    Create New Post
                </Link>
            </div>

            {posts.length === 0 ? (
                <div className="skeuo-panel" style={{ textAlign: "center", padding: "3rem" }}>
                    <p style={{ color: "var(--text-secondary)" }}>No posts found. Create your first PR!</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {posts.map(post => (
                        <div key={post.id} className="skeuo-panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.5rem" }}>
                            <div>
                                <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "1.2rem" }}>{post.title}</h4>
                                <div style={{ display: "flex", gap: "1rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                                    <span>Status: {post.published ? <span style={{ color: "#22c55e" }}>Published</span> : <span style={{ color: "#eab308" }}>Draft</span>}</span>
                                    <span>Created: {new Date(post.createdAt).toLocaleDateString()}</span>
                                    <span>Slug: /{post.slug}</span>
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                <a href={`/blog/${post.slug}`} target="_blank" className="btn" style={{ background: "transparent", border: "1px solid var(--skeuo-border)" }}>View</a>
                                {/* <Link href={`/admin/draft?id=${post.id}`} className="btn" style={{ background: "transparent", border: "1px solid var(--accent)" }}>Edit</Link> */}
                                <button onClick={() => deletePost(post.id)} className="btn" style={{ background: "#ef4444" }}>Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
