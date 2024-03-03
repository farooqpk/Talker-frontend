import React, { useEffect } from "react";
import { useQuery } from "react-query";
import { NavigateFunction, useNavigate } from "react-router-dom";
import _axios from "../../lib/_axios";
import { verifyRouteApiReq } from "@/services/api/auth";

export const VerifyRoute = ({ children }: { children: React.ReactElement }) => {
  const navigate: NavigateFunction = useNavigate();
  const { data, isError } = useQuery("verifyroute", () => verifyRouteApiReq(), {
    retry: false,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (isError) {
      navigate("/auth");
    }
  }, [isError]);

  if (data) {
    return children;
  }

  return null;
};
