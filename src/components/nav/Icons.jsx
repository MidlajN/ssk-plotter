/* eslint-disable react/prop-types */

export const Line = (props) => (
  <svg
    width={18}
    height={16}
    viewBox="0 0 18 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M0.933502 15.5356L17.0665 0.575484" stroke={ props.color } />
  </svg>
);
