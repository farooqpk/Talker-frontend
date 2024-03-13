export const debounce = (func: any, timeout: number) => {
  let timer: any;
  return () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func();
    }, timeout);
  };
};
