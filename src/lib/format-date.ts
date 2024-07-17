import dayjs from "dayjs";

export const formateDate = (date: Date | string) => {
  // if today
  if (dayjs().format("DD/MM/YY") === dayjs(date).format("DD/MM/YY")) {
    return dayjs(date).format("h:mm a");
  } else {
    return dayjs(date).format("DD MMM YYYY");
  }
};
