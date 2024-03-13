export const debounce = (func: any, timeout: number) => {
  let timer: any;
  return (value: string) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func(value);
    }, timeout);
  };
};
