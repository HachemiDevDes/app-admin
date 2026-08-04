'use client'

import React, { useState } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { scaleLinear } from "d3-scale";

const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

// Dark theme map with glowing blue hot spots
const colorScale = scaleLinear<string>()
  .domain([0, 50]) // Adjusted domain for real data amounts
  .range(["#1E293B", "#1A73E8"]); 

export function WorldMap({ data = [] }: { data?: { name: string; users: number }[] }) {
  const [tooltipContent, setTooltipContent] = useState("");

  // Auto adjust color scale domain based on max users
  const maxUsers = Math.max(...data.map(d => d.users), 1);
  colorScale.domain([0, maxUsers]);

  return (
    <div className="w-full h-full relative group">
      <ComposableMap
        projectionConfig={{ scale: 140 }}
        width={800}
        height={400}
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup center={[0, 20]} minZoom={1} maxZoom={4}>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const d = data.find((s) => s.name === geo.properties.name);
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={d ? colorScale(d.users) : "#1E293B"}
                    stroke="#ffffff10"
                    strokeWidth={0.5}
                    onMouseEnter={() => {
                      if (d) {
                        setTooltipContent(`${d.name}: ${d.users.toLocaleString()} Users`);
                      } else {
                        setTooltipContent(`${geo.properties.name}`);
                      }
                    }}
                    onMouseLeave={() => {
                      setTooltipContent("");
                    }}
                    style={{
                      default: { outline: "none" },
                      hover: { fill: "#3b82f6", outline: "none", cursor: "pointer", transition: "all 0.3s" },
                      pressed: { fill: "#2563eb", outline: "none" },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
      
      {tooltipContent && (
        <div className="absolute top-2 right-2 bg-[#111827]/90 backdrop-blur-md border border-white/20 text-white px-3 py-2 rounded-lg text-sm shadow-2xl pointer-events-none z-10 transition-opacity">
          {tooltipContent}
        </div>
      )}
    </div>
  );
}
