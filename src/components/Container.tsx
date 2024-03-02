import React from "react";

const Container = ({ children }: { children: React.ReactNode }) => {
  return <main className="p-4 px-6 md:px-24">{children}</main>;
};

export default Container;