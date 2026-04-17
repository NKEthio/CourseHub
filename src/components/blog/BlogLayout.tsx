
import type { ReactNode } from 'react';

interface BlogLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
}

export default function BlogLayout({ title, description, children }: BlogLayoutProps) {
  return (
    <div className="space-y-8">
      <header className="py-8 bg-card border-b border-border rounded-xl shadow-sm">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-extrabold text-primary mb-4">{title}</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{description}</p>
        </div>
      </header>
      <div className="container mx-auto px-4">
        {children}
      </div>
    </div>
  );
}
