import axios, { AxiosResponse } from "axios";
import React, { useEffect } from "react";
import { useQuery } from "react-query";
import { NavigateFunction, useNavigate } from "react-router-dom";

const verifyRouteApiReq = async (): Promise<any> => {
  try {
    const response: AxiosResponse = await axios.get(
      `${import.meta.env.VITE_SERVER_URL}/verifyRoute`,
      { headers: { "Content-Type": "application/json" }, withCredentials: true }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

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
