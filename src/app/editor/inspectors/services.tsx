"use client";
import {LayoutPicker, LayoutThumb} from '../layout-picker';
import {SidebarSelect as Choice} from '../components/fields';
import {equalWidths, defaultColumns} from '../../site/settings';
import type {InspectorProps} from './shared';

const servicesLayouts = [
  {id: 'Icon cards', label: 'Icon cards'},
  {id: 'Photo cards', label: 'Media cards'},
  {id: 'Price list', label: 'Simple list'},
] as const;

export function ServicesInspector({block, changeLayout, changeSettings}: InspectorProps) {
  const listed = block.layout === 'Price list';
  const columns = Math.min(4, Math.max(2, block.settings.columns || defaultColumns('services')));
  return (
    <>
      <LayoutPicker
        legend="Section layout"
        name="services-layout"
        value={block.layout}
        onChange={changeLayout}
        options={servicesLayouts.map(option => ({value: option.id, label: option.label, thumb: <ServicesSketch layout={option.id} />}))}
      />
      {!listed && (
        <Choice
          label="Desktop columns"
          value={String(columns) as '2' | '3' | '4'}
          onChange={value => {
            const count = Number(value) as 2 | 3 | 4;
            changeSettings({...block.settings, columns: count, widths: equalWidths(count)});
          }}
          options={[
            {value: '2', label: '2'},
            {value: '3', label: '3'},
            {value: '4', label: '4'},
          ]}
        />
      )}
    </>
  );
}

function ServicesSketch({layout}: {layout: string}) {
  if (layout === 'Photo cards') {
    return (
      <LayoutThumb>
        {[0, 1, 2].map(index => (
          <g key={index}>
            <rect className="layout-shape" x={6 + index * 19} y="7" width="16" height="10" rx="2" />
            <rect className="layout-shape-strong" x={8 + index * 19} y="20" width="12" height="2" rx="1" />
            <rect className="layout-shape" x={8 + index * 19} y="24" width="10" height="2" rx="1" />
          </g>
        ))}
      </LayoutThumb>
    );
  }
  if (layout === 'Price list') {
    return (
      <LayoutThumb>
        {[0, 1, 2].map(index => (
          <g key={index}>
            <rect className="layout-shape-strong" x="8" y={8 + index * 8} width="28" height="2.5" rx="1.25" />
            <rect className="layout-shape" x="40" y={8 + index * 8} width="16" height="2.5" rx="1.25" />
          </g>
        ))}
      </LayoutThumb>
    );
  }
  return (
    <LayoutThumb>
      {[0, 1, 2].map(index => (
        <g key={index}>
          <circle className="layout-shape-strong" cx={14 + index * 19} cy="12" r="4" />
          <rect className="layout-shape-strong" x={8 + index * 19} y="20" width="12" height="2" rx="1" />
          <rect className="layout-shape" x={8 + index * 19} y="24" width="10" height="2" rx="1" />
        </g>
      ))}
    </LayoutThumb>
  );
}
