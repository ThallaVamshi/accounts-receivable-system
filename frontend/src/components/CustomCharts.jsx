import React from 'react';

// Formatter for currency
const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(val);
};

export const MonthlyRevenueChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
        No chart data available
      </div>
    );
  }

  // Find max value to scale the Y-axis
  const maxVal = Math.max(
    ...data.map(d => Math.max(d.invoiced, d.collected)),
    1000 // Minimum scaling ceiling
  );

  // Pad the max value for headspace
  const ceiling = maxVal * 1.15;

  return (
    <div>
      <div className="chart-legend" style={{ marginBottom: '1.5rem' }}>
        <div className="legend-item">
          <div className="legend-color invoiced"></div>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Amount Invoiced</span>
        </div>
        <div className="legend-item">
          <div className="legend-color collected"></div>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Revenue Collected</span>
        </div>
      </div>

      <div style={{ position: 'relative', width: '100%', height: '280px' }}>
        <svg viewBox="0 0 800 280" width="100%" height="100%" style={{ overflow: 'visible' }}>
          {/* Y-axis gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
            const y = 230 - ratio * 200;
            const gridVal = ceiling * ratio;
            return (
              <g key={index}>
                <line 
                  x1="60" 
                  y1={y} 
                  x2="780" 
                  y2={y} 
                  stroke="rgba(255,255,255,0.06)" 
                  strokeDasharray="4 4" 
                />
                <text 
                  x="50" 
                  y={y + 4} 
                  fill="#64748b" 
                  fontSize="11" 
                  textAnchor="end"
                  fontFamily="inherit"
                >
                  {formatCurrency(gridVal)}
                </text>
              </g>
            );
          })}

          {/* Draw bars */}
          {data.map((item, index) => {
            const xCenter = 60 + (index * (720 / 12)) + (720 / 24);
            const barWidth = 16;
            
            // Invoiced bar height
            const invoicedHeight = (item.invoiced / ceiling) * 200;
            const invoicedY = 230 - invoicedHeight;

            // Collected bar height
            const collectedHeight = (item.collected / ceiling) * 200;
            const collectedY = 230 - collectedHeight;

            return (
              <g key={index} className="chart-bar-pair-svg">
                {/* Invoiced Bar */}
                <rect
                  x={xCenter - barWidth - 2}
                  y={invoicedY}
                  width={barWidth}
                  height={invoicedHeight}
                  rx="3"
                  fill="#3b82f6"
                  opacity="0.85"
                  style={{ transition: 'all 0.3s ease' }}
                >
                  <title>{`Invoiced: ${formatCurrency(item.invoiced)}`}</title>
                </rect>

                {item.invoiced > 0 && (
                  <text
                    x={xCenter - (barWidth / 2) - 2}
                    y={invoicedY - 6}
                    fill="#3b82f6"
                    fontSize="9"
                    fontWeight="700"
                    textAnchor="middle"
                    className="chart-bar-value"
                  >
                    {formatCurrency(item.invoiced)}
                  </text>
                )}

                {/* Collected Bar */}
                <rect
                  x={xCenter + 2}
                  y={collectedY}
                  width={barWidth}
                  height={collectedHeight}
                  rx="3"
                  fill="#10b981"
                  opacity="0.85"
                  style={{ transition: 'all 0.3s ease' }}
                >
                  <title>{`Collected: ${formatCurrency(item.collected)}`}</title>
                </rect>

                {item.collected > 0 && (
                  <text
                    x={xCenter + (barWidth / 2) + 2}
                    y={collectedY - 6}
                    fill="#10b981"
                    fontSize="9"
                    fontWeight="700"
                    textAnchor="middle"
                    className="chart-bar-value"
                  >
                    {formatCurrency(item.collected)}
                  </text>
                )}

                {/* Month Name on X-axis */}
                <text
                  x={xCenter}
                  y="255"
                  fill="#94a3b8"
                  fontSize="12"
                  fontWeight="600"
                  textAnchor="middle"
                  fontFamily="inherit"
                >
                  {item.monthName}
                </text>
              </g>
            );
          })}

          {/* X Axis line */}
          <line x1="60" y1="230" x2="780" y2="230" stroke="rgba(255,255,255,0.12)" />
        </svg>
      </div>
    </div>
  );
};

export const InvoiceStatusDonut = ({ statusCounts }) => {
  const statuses = Object.keys(statusCounts || {});
  const counts = Object.values(statusCounts || {});
  const total = counts.reduce((a, b) => a + b, 0);

  if (total === 0) {
    return (
      <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
        No invoices created yet
      </div>
    );
  }

  // Color mapping
  const statusColors = {
    Paid: '#10b981',
    'Partially Paid': '#f59e0b',
    Sent: '#3b82f6',
    Draft: '#64748b',
    Overdue: '#ef4444',
    Cancelled: '#94a3b8'
  };

  let cumulativePercent = 0;

  // Generate sector path coordinates
  const getCoordinatesForPercent = (percent) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  const slices = statuses.map((status, index) => {
    const val = statusCounts[status] || 0;
    if (val === 0) return null;

    const percent = val / total;
    const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
    cumulativePercent += percent;
    const [endX, endY] = getCoordinatesForPercent(cumulativePercent);

    const largeArcFlag = percent > 0.5 ? 1 : 0;

    // Center at 100,100, radius 70
    const pathData = [
      `M ${100 + startX * 70} ${100 + startY * 70}`,
      `A 70 70 0 ${largeArcFlag} 1 ${100 + endX * 70} ${100 + endY * 70}`
    ].join(' ');

    return {
      status,
      count: val,
      percent: Math.round(percent * 100),
      pathData,
      color: statusColors[status] || '#fff'
    };
  }).filter(Boolean);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: '200px', height: '200px' }}>
        <svg viewBox="0 0 200 200" width="100%" height="100%" className="donut-chart-svg">
          {/* Background circle */}
          <circle cx="100" cy="100" r="70" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="20" />
          
          {slices.map((slice, i) => (
            <path
              key={i}
              d={slice.pathData}
              fill="none"
              stroke={slice.color}
              strokeWidth="20"
              strokeLinecap="round"
            >
              <title>{`${slice.status}: ${slice.count} (${slice.percent}%)`}</title>
            </path>
          ))}
          
          {/* Inner circle text */}
          <text x="100" y="95" textAnchor="middle" fill="#94a3b8" fontSize="12" fontWeight="600">
            TOTAL
          </text>
          <text x="100" y="120" textAnchor="middle" fill="#fff" fontSize="22" fontWeight="800">
            {total}
          </text>
        </svg>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: '150px' }}>
        {slices.map((slice, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: slice.color }}></div>
              <span style={{ color: '#94a3b8', fontWeight: '500' }}>{slice.status}</span>
            </div>
            <span style={{ fontWeight: '700' }}>{slice.count} ({slice.percent}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
};
