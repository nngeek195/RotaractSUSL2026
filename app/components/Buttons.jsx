'use client';
import React from 'react';

export function LearnMore({ className, property1 = "default" }) {
  return (
    <div className={className} data-name="Property 1=default" data-node-id="69:19">
      <p className="font-poppins font-medium leading-normal relative shrink-0 text-[14px] text-nowrap text-white whitespace-pre" data-node-id="7:24">
        Learn More
      </p>
    </div>
  );
}

export function JoinUs({ className, property1 = "Default" }) {
  return (
    <div className={className} data-name="Property 1=Default" data-node-id="69:18">
      <p className="font-poppins font-medium leading-normal relative shrink-0 text-[14px] text-black text-nowrap whitespace-pre" data-node-id="7:26">
        Join Us
      </p>
    </div>
  );
}