'use client';

import {useId, type ReactNode} from 'react';
import {ChevronDown, type LucideIcon} from 'lucide-react';

export type RefinedStyleGroup = {id: string; label: string; icon: LucideIcon};

export function RefinedStyleShell({
  groups,
  open,
  setOpen,
  children,
}: {
  groups: readonly RefinedStyleGroup[];
  open: string;
  setOpen: (id: string) => void;
  children: (id: string) => ReactNode;
}) {
  const base = useId();
  return (
    <div className="refined-inspector">
      {groups.map(({id, label, icon: Icon}) => (
        <section className="refined-group" key={id}>
          <h3>
            <button
              type="button"
              className="refined-toggle"
              id={`${base}-${id}-heading`}
              aria-expanded={open === id}
              aria-controls={`${base}-${id}`}
              onClick={event => {
                setOpen(open === id ? '' : id);
                event.currentTarget.scrollIntoView({block: 'nearest'});
              }}
            >
              <Icon size={16} aria-hidden="true" />
              <span>{label}</span>
              <ChevronDown size={16} className="refined-chevron" aria-hidden="true" />
            </button>
          </h3>
          {open === id && (
            <div className="refined-body" id={`${base}-${id}`} role="region" aria-labelledby={`${base}-${id}-heading`}>
              {children(id)}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
