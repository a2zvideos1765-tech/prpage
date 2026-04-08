'use client';

import { useState, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import 'react-quill-new/dist/quill.snow.css';

import QuillImageDropAndPaste from 'quill-image-drop-and-paste';

// Import Quill via dynamic import so we can register modules safely
const ReactQuill = dynamic(
    async () => {
        const { default: RQ, Quill } = await import("react-quill-new");
        Quill.register('modules/imageDropAndPaste', QuillImageDropAndPaste);
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

    // Shared upload logic for both Click and Drag/Drop
    const uploadImageFile = async (file) => {
        const uploadData = new FormData();
        uploadData.append('file', file);

        const res = await fetch('/api/upload', {
            method: 'POST',
            body: uploadData
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Upload via API failed");
        }

        const { url } = await res.json();
        return url;
    };

    const imageHandler = useCallback(() => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();

        input.onchange = async () => {
            const file = input.files?.[0];
            if (file) {
                try {
                    const url = await uploadImageFile(file);
                    const quill = quillRef.current.getEditor();
                    const range = quill.getSelection(true);

                    // Prompt for Alt Text
                    const altText = prompt("Enter Alt Text for this image (Important for SEO):");

                    if (altText) {
                        // Insert as raw HTML to support Alt attributes in Quill
                        quill.clipboard.dangerouslyPasteHTML(range.index, `<img src="${url}" alt="${altText}" />`);
                    } else {
                        quill.insertEmbed(range.index, 'image', url);
                    }
                } catch (error) {
                    console.error("Upload failed", error);
                    alert("Image upload failed: " + error.message);
                }
            }
        };
    }, []);

    const imageDropHandler = useCallback(async (dataUrl, type, imageData) => {
        const file = imageData.toFile();
        if (file) {
            try {
                const url = await uploadImageFile(file);
                const quill = quillRef.current.getEditor();
                const range = quill.getSelection() || { index: quill.getLength() };

                const altText = prompt("Enter Alt Text for pasted/dropped image:");

                if (altText) {
                    quill.clipboard.dangerouslyPasteHTML(range.index, `<img src="${url}" alt="${altText}" />`);
                } else {
                    quill.insertEmbed(range.index, 'image', url);
                }
            } catch (error) {
                console.error("Drop Upload Failed", error);
                alert("Drag and Drop upload failed.");
            }
        }
    }, []);

    const modules = useMemo(() => ({
        imageDropAndPaste: {
            handler: imageDropHandler
        },
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
    }), [imageHandler, imageDropHandler]);

    const handleCoverImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingCover(true);
        try {
            const uploadData = new FormData();
            uploadData.append('file', file);

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: uploadData
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Cover upload via API failed");
            }

            const { url } = await res.json();
            setFormData(prev => ({ ...prev, coverImage: url }));
        } catch (error) {
            console.error(error);
            alert("Cover image upload failed: " + error.message);
        } finally {
            setUploadingCover(false);
        }
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
                <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
                    <label className="file-upload-btn">
                        Choose File
                        <input type="file" accept="image/*" onChange={handleCoverImageUpload} className="form-file-input" />
                    </label>

                    <span style={{ color: "var(--text-secondary)", fontStyle: "italic", fontSize: "0.9rem" }}>OR</span>

                    <input
                        name="coverImage"
                        value={formData.coverImage}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="Paste image URL here..."
                        style={{ flex: 1, minWidth: "200px" }}
                    />

                    {uploadingCover && <span style={{ color: "var(--accent)", fontSize: "0.9rem", fontWeight: "bold" }}>Uploading...</span>}
                </div>
                {formData.coverImage && (
                    <div style={{ marginTop: "1rem" }}>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Image Preview:</p>
                        <img src={formData.coverImage} alt="Cover Preview" style={{ maxWidth: "200px", borderRadius: "8px", border: "1px solid var(--skeuo-border)" }} />
                    </div>
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
