  /* eslint-disable @typescript-eslint/no-explicit-any */
  export const debounce = (
    cb: (...args: any[]) => void,
    deb: (...args: any[]) => void,
    timeout: number
  ) => {
    let timer: NodeJS.Timeout;

    return (...args: any[]) => {
      cb(...args);               // immediate function
      clearTimeout(timer);       // clear previous timeout
      timer = setTimeout(() => {
        deb(...args);            // pass args to debounce function
      }, timeout);
    };
  };
