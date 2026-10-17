import type { ReactNode } from 'react';

interface AlertProps {
  role?: 'alert';
  children: ReactNode;
}

function Alert({ role, children }: AlertProps) {
  return <div className="alert" role={role}>{children}</div>;
}

export default Alert;
