export default function TrustBadges() {
  const logos = [
    { src: "/images/logos/webpay.svg", alt: "Webpay" },
    { src: "/images/logos/transbank.svg", alt: "Transbank" },
    { src: "/images/logos/visa.svg", alt: "Visa" },
    { src: "/images/logos/mastercard.svg", alt: "Mastercard" },
    { src: "/images/logos/redcompra.svg", alt: "RedCompra" },
  ];
  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
      {logos.map(l => (
        <img
          key={l.alt}
          src={l.src}
          alt={l.alt}
          className="h-8 w-auto select-none"
        />
      ))}
    </div>
  );
}