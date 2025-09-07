import React from "react";

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>((props, ref) => (
  <button ref={ref} {...props} />
));

export { Button };
