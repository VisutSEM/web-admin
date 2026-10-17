<script setup lang="ts">
import { computed, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    type: 'line' | 'bar' | 'donut'
    data: { label: string; value: number; secondary?: number; color?: string }[]
    height?: number
    currency?: boolean
    title?: string
  }>(),
  {
    height: 240,
    currency: false,
    title: '',
  },
)

const hoveredIndex = ref<number | null>(null)

// Format currency
function formatVal(val: number) {
  if (props.currency) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)
  }
  return new Intl.NumberFormat('en-US').format(val)
}

interface ChartPoint {
  x: number
  y: number
  label: string
  value: number
}

// Line Chart Calculations
const linePoints = computed(() => {
  const width = 600
  const h = props.height
  const paddingX = 40
  const paddingTop = 25
  const paddingBottom = 35
  const availableW = width - paddingX * 2
  const availableH = h - paddingTop - paddingBottom
  const baselineY = paddingTop + availableH

  if (props.type !== 'line' || props.data.length === 0) {
    return { path: '', area: '', points: [] as ChartPoint[], width, height: h, baselineY }
  }

  const maxVal = Math.max(...props.data.map((d) => d.value), 1) * 1.15
  const minVal = 0

  const stepX = availableW / Math.max(props.data.length - 1, 1)

  const coords: ChartPoint[] = props.data.map((d, i) => {
    const x = paddingX + i * stepX
    const y = paddingTop + availableH - ((d.value - minVal) / (maxVal - minVal)) * availableH
    return { x, y, label: d.label, value: d.value }
  })

  const first = coords[0]
  if (!first) {
    return { path: '', area: '', points: [] as ChartPoint[], width, height: h, baselineY }
  }

  let path = `M ${first.x} ${first.y}`
  for (let i = 0; i < coords.length - 1; i++) {
    const curr = coords[i]
    const next = coords[i + 1]
    if (curr && next) {
      const cpX1 = curr.x + (next.x - curr.x) / 2
      const cpY1 = curr.y
      const cpX2 = curr.x + (next.x - curr.x) / 2
      const cpY2 = next.y
      path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${next.x} ${next.y}`
    }
  }

  const last = coords[coords.length - 1] || first
  const area = `${path} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`

  return { path, area, points: coords, width, height: h, baselineY }
})

// Bar Chart Calculations
const barItems = computed(() => {
  if (props.type !== 'bar') return []
  const maxVal = Math.max(...props.data.map((d) => d.value), 1)
  return props.data.map((d) => ({
    ...d,
    percentage: Math.round((d.value / maxVal) * 100),
  }))
})

// Donut Chart Calculations
const donutSlices = computed(() => {
  if (props.type !== 'donut') return []
  const total = props.data.reduce((sum, d) => sum + d.value, 0) || 1
  let currentAngle = 0
  const radius = 70
  const cx = 100
  const cy = 100

  return props.data.map((item, index) => {
    const angle = (item.value / total) * 360
    const startAngle = currentAngle
    const endAngle = currentAngle + angle
    currentAngle += angle

    // SVG arc path
    const startRad = (startAngle - 90) * (Math.PI / 180)
    const endRad = (endAngle - 90) * (Math.PI / 180)

    const x1 = cx + radius * Math.cos(startRad)
    const y1 = cy + radius * Math.sin(startRad)
    const x2 = cx + radius * Math.cos(endRad)
    const y2 = cy + radius * Math.sin(endRad)

    const largeArcFlag = angle > 180 ? 1 : 0
    const d = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`

    const colors = ['#4f46e5', '#10b981', '#f59e0b', '#06b6d4', '#ef4444', '#8b5cf6']
    return {
      label: item.label,
      value: item.value,
      percentage: Math.round((item.value / total) * 100),
      color: item.color || colors[index % colors.length],
      path: d,
    }
  })
})
</script>

<template>
  <div class="report-chart">
    <!-- Line Chart -->
    <div v-if="type === 'line'" class="line-chart-wrap">
      <svg
        viewBox="0 0 600 240"
        class="chart-svg"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#4f46e5" stop-opacity="0.3" />
            <stop offset="100%" stop-color="#4f46e5" stop-opacity="0.0" />
          </linearGradient>
        </defs>

        <!-- Subtle Grid Lines -->
        <line x1="40" y1="50" x2="560" y2="50" stroke="#f1f5f9" stroke-dasharray="4" />
        <line x1="40" y1="110" x2="560" y2="110" stroke="#f1f5f9" stroke-dasharray="4" />
        <line x1="40" y1="170" x2="560" y2="170" stroke="#f1f5f9" stroke-dasharray="4" />

        <!-- Area fill -->
        <path :d="linePoints.area" fill="url(#chartGradient)" />

        <!-- Main Stroke Line -->
        <path
          :d="linePoints.path"
          fill="none"
          stroke="#4f46e5"
          stroke-width="3.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />

        <!-- Data circles -->
        <g v-for="(p, i) in linePoints.points" :key="i">
          <circle
            :cx="p.x"
            :cy="p.y"
            r="5"
            fill="#ffffff"
            stroke="#4f46e5"
            stroke-width="2.5"
            class="chart-point"
            @mouseenter="hoveredIndex = i"
            @mouseleave="hoveredIndex = null"
          />

          <!-- Label below baseline -->
          <text
            :x="p.x"
            :y="linePoints.baselineY + 20"
            text-anchor="middle"
            font-size="11"
            fill="#64748b"
            font-weight="600"
          >
            {{ p.label }}
          </text>
        </g>
      </svg>

      <!-- Hover tooltip -->
      <div
        v-if="hoveredIndex !== null && linePoints.points[hoveredIndex]"
        class="chart-tooltip"
        :style="{
          left: `${(linePoints.points[hoveredIndex]!.x / 600) * 100}%`,
          top: `${(linePoints.points[hoveredIndex]!.y / 240) * 100}%`,
        }"
      >
        <span class="tooltip-label">{{ linePoints.points[hoveredIndex]!.label }}</span>
        <strong class="tooltip-value">{{ formatVal(linePoints.points[hoveredIndex]!.value) }}</strong>
      </div>
    </div>

    <!-- Bar Chart -->
    <div v-else-if="type === 'bar'" class="bar-chart-wrap">
      <div
        v-for="(item, i) in barItems"
        :key="i"
        class="bar-row"
      >
        <div class="bar-label-group">
          <span class="bar-label">{{ item.label }}</span>
          <span class="bar-val">{{ formatVal(item.value) }}</span>
        </div>
        <div class="bar-track">
          <div
            class="bar-fill"
            :style="{
              width: `${item.percentage}%`,
              backgroundColor: item.color || '#6366f1',
            }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Donut Chart -->
    <div v-else-if="type === 'donut'" class="donut-chart-wrap">
      <div class="donut-svg-box">
        <svg viewBox="0 0 200 200" class="donut-svg">
          <path
            v-for="(slice, i) in donutSlices"
            :key="i"
            :d="slice.path"
            :fill="slice.color"
            class="donut-slice"
          />
          <!-- Inner circle hole to make it a donut -->
          <circle cx="100" cy="100" r="46" fill="#ffffff" />
        </svg>
      </div>

      <div class="donut-legend">
        <div
          v-for="(item, i) in donutSlices"
          :key="i"
          class="legend-item"
        >
          <div class="legend-color" :style="{ backgroundColor: item.color }"></div>
          <div class="legend-info">
            <span class="legend-label">{{ item.label }}</span>
            <div class="legend-values">
              <strong>{{ item.value }}</strong>
              <small class="legend-pct">{{ item.percentage }}%</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.report-chart {
  position: relative;
  width: 100%;
}

.line-chart-wrap {
  position: relative;
  width: 100%;
}

.chart-svg {
  width: 100%;
  height: 230px;
  display: block;
}

.chart-point {
  cursor: pointer;
  transition: r 0.2s cubic-bezier(0.16, 1, 0.3, 1), stroke-width 0.2s;
}
.chart-point:hover {
  r: 8;
  stroke-width: 3.5;
  fill: #4f46e5;
}

.chart-tooltip {
  position: absolute;
  transform: translate(-50%, -130%);
  background: #0f172a;
  color: white;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  pointer-events: none;
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 10;
  white-space: nowrap;
}
.tooltip-label {
  color: #94a3b8;
  font-size: 10.5px;
}
.tooltip-value {
  color: #ffffff;
  font-size: 13px;
}

/* Bar styles */
.bar-chart-wrap {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.bar-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.bar-label-group {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}
.bar-label {
  color: #334155;
  font-weight: 500;
}
.bar-val {
  color: #0f172a;
  font-weight: 700;
}
.bar-track {
  width: 100%;
  height: 9px;
  background: #f1f5f9;
  border-radius: 999px;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Donut styles */
.donut-chart-wrap {
  display: flex;
  align-items: center;
  gap: 24px;
}
.donut-svg-box {
  width: 140px;
  height: 140px;
  flex-shrink: 0;
}
.donut-svg {
  width: 100%;
  height: 100%;
}
.donut-slice {
  transition: opacity 0.2s, transform 0.2s;
}
.donut-slice:hover {
  opacity: 0.9;
}
.donut-legend {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 10px;
}
.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 4px;
  flex-shrink: 0;
}
.legend-info {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.legend-label {
  font-size: 12.5px;
  color: #475569;
  text-transform: capitalize;
}
.legend-values {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}
.legend-pct {
  color: #64748b;
  font-size: 11px;
}
</style>
