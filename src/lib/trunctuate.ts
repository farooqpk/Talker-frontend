export function truncateUsername(username: string) {
  const maxLength = 10; // Define the maximum length for the truncated username
  if (username.length <= maxLength) {
    return username;
  }
  return username?.substring(0, maxLength) + "...";
}

export function truncateMessage(msg: string) {
  const maxLength = 20;
  if (msg.length <= maxLength) {
    return msg;
  }
  return msg?.substring(0, maxLength) + "....";
}
