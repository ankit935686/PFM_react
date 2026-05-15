import { createContext, useContext, useMemo } from 'react';
import { Legend, Tooltip } from 'recharts';

const ChartConfigContext = createContext(null);

const buildCssVars = (config) => {
  if (!config) {
    return {};
  }

  return Object.entries(config).reduce((vars, [key, value]) => {
    if (value?.color) {
      vars[`--color-${key}`] = value.color;
    }
    return vars;
  }, {});
};

export const ChartContainer = ({ config, className, children }) => {
  const cssVars = useMemo(() => buildCssVars(config), [config]);

  return (
    <ChartConfigContext.Provider value={config || null}>
      <div className={className} style={cssVars}>
        {children}
      </div>
    </ChartConfigContext.Provider>
  );
};

export const ChartTooltip = (props) => <Tooltip {...props} />;

export const ChartLegend = (props) => <Legend {...props} />;

export const ChartTooltipContent = ({ active, payload, label }) => {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      <div className="chart-tooltip-items">
        {payload.map((item) => (
          <div key={item.dataKey || item.name} className="chart-tooltip-row">
            <span className="chart-tooltip-dot" style={{ background: item.color }} />
            <span className="chart-tooltip-name">{item.name}</span>
            <span className="chart-tooltip-value">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ChartLegendContent = ({ payload }) => {
  const config = useContext(ChartConfigContext);

  if (!payload?.length) {
    return null;
  }

  return (
    <div className="chart-legend">
      {payload.map((entry) => {
        const key = entry.dataKey || entry.value;
        const label = config?.[key]?.label || entry.value;
        const color = config?.[key]?.color || entry.color;

        return (
          <span key={key} className="chart-legend-item">
            <span className="chart-legend-dot" style={{ background: color }} />
            {label}
          </span>
        );
      })}
    </div>
  );
};
