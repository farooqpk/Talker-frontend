import React from "react";

const Container = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return <main className={`p-4 px-6 md:px-24 ${className}`}>{children}</main>;
};

export default Container;