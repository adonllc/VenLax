import { clsx } from 'clsx';

export interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  narrow?: boolean;
}

export function PageContainer({ children, className, narrow = false }: PageContainerProps) {
  return (
    <main className={clsx('mx-auto w-full px-4 py-6', narrow ? 'max-w-2xl' : 'max-w-5xl', className)}>
      {children}
    </main>
  );
}
