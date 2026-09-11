import type { ReactNode } from "react";
export default function PageHeading({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <h1>{title}</h1>
      {children && <div className="heading-intro">{children}</div>}
    </div>
  );
}
