import React from 'react';

const ReleaseMarker = (props) => {
  const { cx, cy, payload, index, data } = props;

  if (payload && payload.Release) {
    // Count releases to determine stagger levels needed
    const releases = data ? data.filter(d => d.Release).length : 0;

    // Use more stagger levels for many releases (up to 8 levels)
    const staggerLevels = Math.min(8, Math.max(3, Math.ceil(releases / 5)));
    const baseOffset = 40;
    const verticalSpacing = releases > 15 ? 12 : 15; // Tighter spacing for many releases
    const labelOffset = baseOffset + (index % staggerLevels) * verticalSpacing;
    const yPosition = cy - labelOffset;

    // Dynamic label width based on text length
    const releaseText = String(payload.Release);
    const textWidth = Math.max(44, releaseText.length * 5.5);

    // Use rotation for very long labels or many releases
    const useRotation = releaseText.length > 8 || releases > 20;
    const rotation = useRotation ? -45 : 0;

    return (
      <g>
        {/* Connection line from dot to label */}
        <line
          x1={cx}
          y1={cy}
          x2={cx}
          y2={yPosition + (useRotation ? 8 : 6)}
          stroke="#d97706"
          strokeWidth={1}
          strokeDasharray="2,2"
        />

        {/* Release marker dot */}
        <circle
          cx={cx}
          cy={cy}
          r={5}
          fill="#f59e0b"
          stroke="#d97706"
          strokeWidth={2}
        />

        {/* Label background */}
        <g transform={useRotation ? `rotate(${rotation}, ${cx}, ${yPosition})` : ''}>
          <rect
            x={cx - textWidth / 2}
            y={yPosition - 6}
            width={textWidth}
            height={12}
            fill="white"
            stroke="#d97706"
            strokeWidth={1}
            rx={2}
            opacity={0.95}
          />

          {/* Release version text */}
          <text
            x={cx}
            y={yPosition}
            textAnchor="middle"
            fill="#d97706"
            fontSize="8"
            fontWeight="bold"
            dominantBaseline="middle"
          >
            {releaseText}
          </text>
        </g>
      </g>
    );
  }

  return <circle cx={cx} cy={cy} r={3} fill={props.fill} stroke={props.stroke} strokeWidth={2} />;
};

export default ReleaseMarker;
