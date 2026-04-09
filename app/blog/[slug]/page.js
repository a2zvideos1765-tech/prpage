import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

export const revalidate = 60; // Revalidate every 60 seconds

// Generate Dynamic SEO/AEO Metadata
export async function generateMetadata({ params }) {
    const { slug } = await params;
    const post = await prisma.post.findUnique({
        where: { slug }
    });

    if (!post) {
        return {};
    }

    return {
        title: post.metaTitle || post.title,
        description: post.metaDescription || post.excerpt,
        openGraph: {
            title: post.metaTitle || post.title,
            description: post.metaDescription || post.excerpt,
            images: post.coverImage ? [post.coverImage] : [],
            type: "article",
            publishedTime: post.createdAt.toISOString(),
            modifiedTime: post.updatedAt.toISOString(),
        },
        alternates: {
            canonical: `https://news.studiohappens.tech/blog/${slug}`
        }
    };
}

export default async function BlogPost({ params }) {
    const { slug } = await params;

    const post = await prisma.post.findUnique({
        where: { slug }
    });

    if (!post) {
        notFound();
    }

    // Generate dynamic JSON-LD merging both definitions
    const schemaMarkup = {
        "@context": "https://schema.org",
        "@type": ["NewsArticle", "BlogPosting"],
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `https://news.studiohappens.tech/blog/${slug}`
        },
        "headline": post.title,
        "description": post.metaDescription || post.excerpt,
        "image": post.coverImage || "https://news.studiohappens.tech/og-default.jpg",
        "author": {
            "@type": "Organization",
            "name": "Premium PR Agency"
        },
        "publisher": {
            "@type": "Organization",
            "name": "Premium PR Agency",
            "logo": {
                "@type": "ImageObject",
                "url": "https://news.studiohappens.tech/logo.png"
            }
        },
        "datePublished": post.createdAt.toISOString(),
        "dateModified": post.updatedAt.toISOString()
    };

    // If the AI generated custom schema markup is present, we merge/use it
    let finalSchema = schemaMarkup;
    if (post.customSchema) {
        try {
            finalSchema = JSON.parse(post.customSchema);
        } catch (e) { /* ignore parse error */ }
    }

    // Clean up excessive non-breaking spaces injected by copy-pasting into Rich Text editors
    const cleanedContent = post.content.replace(/&nbsp;/g, ' ');

    return (
        <article className="animate-fade-in" style={{ maxWidth: "800px", margin: "0 auto" }}>
            {/* Dynamic JSON-LD injection */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(finalSchema) }}
            />

            {/* If an AI generated FAQ exists, we inject FAQ Schema as well */}
            {post.faqJson && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: post.faqJson }}
                />
            )}

            <header style={{ marginBottom: "3rem", textAlign: "center" }}>
                <h1 style={{ fontSize: "3rem", marginBottom: "1rem" }}>{post.title}</h1>
                <div style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                    <span>Published on {new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
            </header>

            {post.coverImage && (
                <div className="post-cover-image">
                    <img src={post.coverImage} alt={post.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
            )}

            <div
                className="skeuo-panel"
                style={{ fontSize: "1.1rem", lineHeight: "1.8" }}
                dangerouslySetInnerHTML={{ __html: cleanedContent }}
            />
        </article>
    );
}
