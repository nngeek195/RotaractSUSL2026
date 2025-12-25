"use client";

import { useEffect, useState } from "react";

const Snow = () => {
  const [snowflakes, setSnowflakes] = useState([]);

  useEffect(() => {
    // Check if current date is within Christmas season (Dec 20 - Dec 31)
    const now = new Date();
    const month = now.getMonth(); // 0-indexed, 11 is December
    const day = now.getDate();

    const isChristmasSeason = month === 11 && day >= 20 && day <= 31;

    if (!isChristmasSeason) {
      setSnowflakes([]);
      return;
    }

    // Generate a fixed number of snowflakes
    const flakes = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100, // Random horizontal position
      animationDelay: Math.random() * 10, // Random start time
      animationDuration: 10 + Math.random() * 10, // Random fall speed
      opacity: Math.random(), // Random opacity
      size: Math.random() * 5 + 5, // Random size
      type: Math.random() > 0.5 ? 'char' : 'dot', // Randomly choose between char and dot
    }));
    setSnowflakes(flakes);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden" aria-hidden="true">
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className={`absolute ${flake.type === 'dot' ? 'bg-white rounded-full' : 'text-white'}`}
          style={{
            left: `${flake.left}%`,
            top: `-20px`,
            width: flake.type === 'dot' ? `${flake.size}px` : 'auto',
            height: flake.type === 'dot' ? `${flake.size}px` : 'auto',
            fontSize: flake.type === 'char' ? `${flake.size * 2}px` : undefined,
            opacity: flake.opacity,
            animation: `fall ${flake.animationDuration}s linear infinite`,
            animationDelay: `-${flake.animationDelay}s`,
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          {flake.type === 'char' ? '❄' : null}
        </div>
      ))}
    </div>
  );
};

export default Snow;
