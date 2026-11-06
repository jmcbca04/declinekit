// A plain FAQ list plus the matching FAQPage structured data for search engines.
export type QA = { q: string; a: string };

export function Faq({ items, title = "Questions" }: { items: QA[]; title?: string }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })),
  };
  return (
    <section className="faq">
      <h2>{title}</h2>
      <dl>
        {items.map((i) => (
          <div key={i.q}>
            <dt>{i.q}</dt>
            <dd>{i.a}</dd>
          </div>
        ))}
      </dl>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </section>
  );
}
