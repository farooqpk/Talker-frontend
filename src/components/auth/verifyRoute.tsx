import { useEffect } from "react";
import { useQuery } from "react-query";
import { Outlet, useNavigate } from "react-router-dom";
import _axios from "../../lib/_axios";
import { verifyRouteApiReq } from "@/services/api/auth";
import { useGetUser } from "@/hooks/useGetUser";
import { getValueFromStoreIDB } from "@/lib/idb";
import { useToast } from "../ui/use-toast";

export const VerifyRoute = () => {
  const navigate = useNavigate();
  const { user } = useGetUser();
  const { toast } = useToast();

  const { data, isError } = useQuery("verifyroute", () => verifyRouteApiReq(), {
    retry: false,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (isError) {
      navigate("/auth");
    }
  }, [isError]);

  useEffect(() => {
    if (!user) return;

    const isPrivateKeyExist = async () => {
      const privateKey = await getValueFromStoreIDB(user.userId);

      if (!privateKey) {
        toast({
          title: "Private key not found!",
          description: "Please log again and upload your private key file.",
          variant: "destructive",
        });
        navigate("/auth");
      }
    };

    isPrivateKeyExist();
  }, [user]);

  if (data) {
    return <Outlet />;
  }

  return null;
};
