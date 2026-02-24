'use client';

import { useState, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import 'react-quill-new/dist/quill.snow.css';

// Dynamically import ReactQuill to prevent document/window SSR issues
const ReactQuill = dynamic(
    async () => {
        const { default: RQ } = await import("react-quill-new");
        const QuillWrapper = ({ forwardedRef, ...props }) => <RQ ref={forwardedRef} {...props} />;
        QuillWrapper.displayName = 'QuillWrapper';
        return QuillWrapper;
    },
    { ssr: false, loading: () => <p>Loading editor...</p> }
);

export default function DraftPost() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        coverImage: '',
        metaTitle: '',
        metaDescription: '',
        excerpt: '',
        faqJson: '',
        customSchema: '',
        published: false,
    });

    const [loadingAI, setLoadingAI] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);
    const quillRef = useRef(null);

    const imageHandler = useCallback(() => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();

        input.onchange = async () => {
            const file = input.files?.[0];
            if (file) {
                const storageRef = ref(storage, 'blog_images/' + Date.now() + '_' + file.name);
                const uploadTask = uploadBytesResumable(storageRef, file);
                uploadTask.on('state_changed',
                    (snapshot) => { },
                    (error) => { console.error("Upload failed", error); alert("Image upload failed."); },
                    async () => {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        const quill = quillRef.current.getEditor();
                        const range = quill.getSelection(true);
                        quill.insertEmbed(range.index, 'image', downloadURL);
                    }
                );
            }
        };
    }, []);

    const modules = useMemo(() => ({
        toolbar: {
            container: [
                [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
                ['link', 'image'],
                ['clean']
            ],
            handlers: {
                image: imageHandler
            }
        }
    }), [imageHandler]);

    const handleCoverImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingCover(true);
        const storageRef = ref(storage, 'blog_covers/' + Date.now() + '_' + file.name);
        const uploadTask = uploadBytesResumable(storageRef, file);
        uploadTask.on('state_changed',
            (snapshot) => { },
            (error) => { console.error(error); alert("Cover image upload failed."); setUploadingCover(false); },
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                setFormData(prev => ({ ...prev, coverImage: downloadURL }));
                setUploadingCover(false);
            }
        );
    };

    const handleContentChange = (content) => {
        setFormData(prev => ({ ...prev, content }));
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleAutogenerateSEO = async () => {
        if (!formData.title || !formData.content) {
            alert("Please provide at least a title and some content first.");
            return;
        }

        setLoadingAI(true);
        try {
            const res = await fetch('/api/ai-seo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: formData.title, content: formData.content })
            });

            const data = await res.json();
            if (res.ok) {
                setFormData(prev => ({
                    ...prev,
                    metaTitle: data.metaTitle || prev.metaTitle,
                    metaDescription: data.metaDescription || prev.metaDescription,
                    excerpt: data.excerpt || prev.excerpt,
                    faqJson: data.faqJson ? JSON.stringify(data.faqJson) : prev.faqJson,
                    customSchema: data.customSchema ? JSON.stringify(data.customSchema) : prev.customSchema,
                }));
                alert("AI successfully generated SEO mapping and structured data!");
            } else {
                alert(data.error || "Failed to generate SEO");
            }
        } catch (err) {
            console.error(err);
            alert("An error occurred during AI generation.");
        } finally {
            setLoadingAI(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                router.push('/admin');
            } else {
                alert("Failed to save post");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="animate-fade-in" style={{ maxWidth: "800px", margin: "0 auto" }}>
            <h2 style={{ marginBottom: "2rem" }}>Write New PR / Blog Post</h2>

            <form onSubmit={handleSave} className="form-group skeuo-panel">

                {/* Core Content */}
                <label className="form-label">Post Title</label>
                <input name="title" value={formData.title} onChange={handleChange} className="form-input" required />

                <label className="form-label" style={{ marginTop: "1.5rem" }}>Cover Image</label>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                    <input type="file" accept="image/*" onChange={handleCoverImageUpload} className="form-input" style={{ flex: 1, padding: "0.5rem" }} />
                    {uploadingCover && <span style={{ color: "var(--accent)", fontSize: "0.9rem" }}>Uploading...</span>}
                </div>
                {formData.coverImage && (
                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}>
                        Uploaded: <a href={formData.coverImage} target="_blank" rel="noreferrer" style={{ textDecoration: "underline", color: "var(--accent)" }}>View Image</a>
                    </p>
                )}

                <label className="form-label" style={{ marginTop: "1.5rem" }}>Content (Rich Text Editor)</label>
                <div style={{ background: "#fff", borderRadius: "8px", overflow: "hidden" }}>
                    <ReactQuill
                        forwardedRef={quillRef}
                        theme="snow"
                        value={formData.content}
                        onChange={handleContentChange}
                        modules={modules}
                        style={{ height: "400px", borderBottom: "none", paddingBottom: "42px" }}
                    />
                </div>
                <hr style={{ margin: "2rem 0", borderColor: "var(--skeuo-border)" }} />

                {/* AI Setup */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                    <h3 style={{ margin: 0 }}>SEO & AEO Metadata</h3>
                    <button type="button" onClick={handleAutogenerateSEO} className="btn" style={{ background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", gap: "0.5rem" }} disabled={loadingAI}>
                        {loadingAI ? "Generating..." : "✨ Auto-Generate with AI"}
                    </button>
                </div>

                <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
                    Write your article above, then click the AI button to automatically extract excerpts, optimize meta titles, and build complex JSON-LD structured data for Answer Engine visibility.
                </p>

                <label className="form-label">Excerpt / Summary</label>
                <textarea name="excerpt" value={formData.excerpt} onChange={handleChange} className="form-textarea" rows="2" />

                <label className="form-label" style={{ marginTop: "1.5rem" }}>Meta Title</label>
                <input name="metaTitle" value={formData.metaTitle} onChange={handleChange} className="form-input" />

                <label className="form-label" style={{ marginTop: "1.5rem" }}>Meta Description</label>
                <textarea name="metaDescription" value={formData.metaDescription} onChange={handleChange} className="form-textarea" rows="2" />

                <label className="form-label" style={{ marginTop: "1.5rem" }}>FAQ JSON-LD (Schema)</label>
                <textarea name="faqJson" value={formData.faqJson} onChange={handleChange} className="form-textarea" rows="3" placeholder='[{"@type":"Question", "name":"..."}]' />

                <label className="form-label" style={{ marginTop: "1.5rem" }}>Custom Article JSON-LD (Schema)</label>
                <textarea name="customSchema" value={formData.customSchema} onChange={handleChange} className="form-textarea" rows="3" placeholder='{"@type":"BlogPosting", ...}' />

                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "2rem" }}>
                    <input type="checkbox" name="published" checked={formData.published} onChange={handleChange} style={{ width: "20px", height: "20px" }} />
                    <label className="form-label" style={{ margin: 0 }}>Publish Immediately</label>
                </div>

                <button type="submit" className="btn" style={{ marginTop: "2rem", width: "100%", background: "#10b981" }} disabled={saving}>
                    {saving ? "Saving..." : "Save Post"}
                </button>
            </form>
        </div>
    );
}
