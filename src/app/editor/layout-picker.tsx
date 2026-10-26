import type {ReactNode} from 'react';

export function LayoutThumb({children}: {children: ReactNode}) {
  return (
    <svg className="layout-thumb" viewBox="0 0 64 36" aria-hidden="true">
      <rect className="layout-thumb-plate" width="64" height="36" rx="4" />
      {children}
    </svg>
  );
}

export function LayoutPicker({
  legend,
  name,
  value,
  onChange,
  options
}: {
  legend: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: {value: string; label: string; thumb: ReactNode}[];
}) {
  return (
    <fieldset className="layout-picker">
      <legend>{legend}</legend>
      {options.map(option => (
        <label key={option.value} className="layout-choice">
          <span className="layout-choice-thumb">{option.thumb}</span>
          <span className="layout-choice-label">{option.label}</span>
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />
        </label>
      ))}
    </fieldset>
  );
}
