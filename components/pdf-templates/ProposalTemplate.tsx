interface ProposalTemplateProps {
  proposalNumber: string;
  title: string;
  clientName: string;
  validUntil: string;
  sections: { title: string; content: string }[];
}

export function ProposalTemplate({
  proposalNumber,
  title,
  clientName,
  validUntil,
  sections,
}: ProposalTemplateProps) {
  return (
    <div className="proposal-template">
      <header>
        <h1>{title}</h1>
        <p>{proposalNumber}</p>
        <p>Prepared for {clientName}</p>
        <p>Valid until {new Date(validUntil).toLocaleDateString()}</p>
      </header>

      <main>
        {sections.map((section, index) => (
          <section key={index}>
            <h2>{section.title}</h2>
            <p>{section.content}</p>
          </section>
        ))}
      </main>
    </div>
  );
}
