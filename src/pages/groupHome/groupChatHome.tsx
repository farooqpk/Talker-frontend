import { GroupChatHeader } from "@/components/groupHome/chatHeader";
import Loader from "@/components/loader";
import { getGroupDetailsApi } from "@/services/api/group";
import { ReactElement } from "react";
import { useQuery } from "react-query";
import { useParams } from "react-router-dom";

export const GroupChatHome = (): ReactElement => {
  const { id } = useParams();

  const { data: groupDetails, isLoading: groupDetailsLoading } = useQuery({
    queryKey: [id, "groupdetails"],
    queryFn: () => getGroupDetailsApi(id!),
  });

  console.log(groupDetails);

  return (
    <>
      <main className="h-screen flex flex-col relative">
        {groupDetailsLoading ? (
          <Loader />
        ) : (
          <>
            <GroupChatHeader groupDetails={groupDetails} />
          </>
        )}
      </main>
    </>
  );
};
