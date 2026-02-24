import { prisma } from '@/lib/prisma';
import Link from 'next/link';

// Next.js config for revalidation to ensure AEOs get fresh content periodically
export const revalidate = 60; // Revalidate every 60 seconds

export default async function Home() {
  // Fetch latest published posts
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      coverImage: true,
      createdAt: true,
    },
    take: 10
  });

  return (
    <div className="animate-fade-in">
      <header style={{ textAlign: "center", marginBottom: "3rem" }}>
        <h1 style={{ fontSize: "3rem", color: "#1c3d5a", textShadow: "2px 2px 0px rgba(255,255,255,0.8), -1px -1px 0px rgba(163, 177, 198, 0.4)" }}>
          The Latest in PR & News
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", maxWidth: "600px", margin: "1rem auto" }}>
          Discover cutting-edge press releases, industry insights, and the latest news optimized for both readers and AI.
        </p>
      </header>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "2rem" }}>
        {posts.length === 0 ? (
          <div className="skeuo-panel" style={{ gridColumn: "1 / -1", textAlign: "center" }}>
            <h3 style={{ margin: "0" }}>No posts available yet.</h3>
            <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}>Check back later for fresh PRs!</p>
          </div>
        ) : (
          posts.map(post => (
            <article key={post.id} className="skeuo-panel" style={{ display: "flex", flexDirection: "column" }}>
              {post.coverImage && (
                <div style={{ margin: "-2rem -2rem 1.5rem -2rem", height: "200px", overflow: "hidden", borderRadius: "16px 16px 0 0" }}>
                  <img src={post.coverImage} alt={post.title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease" }} />
                </div>
              )}

              <h3 style={{ fontSize: "1.4rem", marginBottom: "0.5rem" }}>
                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
              </h3>

              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "1.5rem", flexGrow: "1" }}>
                {post.excerpt || "Read more about this release inside."}
              </p>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--skeuo-border)", paddingTop: "1rem" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  {new Date(post.createdAt).toLocaleDateString()}
                </span>
                <Link href={`/blog/${post.slug}`} className="btn" style={{ padding: "0.5rem 1rem", fontSize: "0.9rem" }}>
                  Read More
                </Link>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
