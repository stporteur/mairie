interface PageBannerProps {
  title: string;
  subtitle: string;
}

function PageBanner({ title, subtitle }: PageBannerProps) {
  return (
    <header className="banner">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
    </header>
  );
}

export default PageBanner;
