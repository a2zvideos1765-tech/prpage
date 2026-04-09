import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic'; // Force instant generation

export async function GET() {
  try {
    const baseUrl = 'https://news.studiohappens.tech';
    const siteTitle = 'Premium PR & News Agency';
    const siteDesc = 'Stay up to date with our top press releases, modern insights, and news.';

    const posts = await prisma.post.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      take: 20 // Standard length for RSS
    });

    const itemsXml = posts.map(post => `
      <item>
        <title><![CDATA[${post.title}]]></title>
        <link>${baseUrl}/blog/${post.slug}</link>
        <guid>${baseUrl}/blog/${post.slug}</guid>
        <pubDate>${new Date(post.createdAt).toUTCString()}</pubDate>
        <description><![CDATA[${post.excerpt || post.content.substring(0, 200)}]]></description>
      </item>
    `).join('');

    const feedXml = `<?xml version="1.0" encoding="UTF-8" ?>
      <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
        <channel>
          <title><![CDATA[${siteTitle}]]></title>
          <link>${baseUrl}</link>
          <description><![CDATA[${siteDesc}]]></description>
          <language>en-us</language>
          <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml" />
          ${itemsXml}
        </channel>
      </rss>`;

    return new NextResponse(feedXml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 's-maxage=3600, stale-while-revalidate'
      }
    });

  } catch (err) {
    console.error("RSS Error:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
