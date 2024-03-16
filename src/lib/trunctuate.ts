export function truncateUsername(username: string) {
    const maxLength = 10; // Define the maximum length for the truncated username
    if (username.length <= maxLength) {
      return username;
    }
    return username.substring(0, maxLength) + "...";
  }
