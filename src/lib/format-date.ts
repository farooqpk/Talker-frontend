import dayjs from "dayjs";

export const formateDate = (date: Date | string) => {
  return dayjs(date).format("h:mm a");
};
