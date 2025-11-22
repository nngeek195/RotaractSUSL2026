'use client';
import React from 'react';
import { images } from '../../assets/images';

export function ServiceCard({ className, property1 = "Default" }) {
  return (
    <div className={className} data-name="Property 1=Default" data-node-id="69:49">
      <div className="absolute bg-white inset-0 rounded-[33px] shadow-[0px_0px_28px_2px_rgba(0,0,0,0.25)]" data-node-id="69:48" />
      <p className="absolute font-playfair font-medium inset-[25.68%_56.3%_56.83%_10.08%] leading-normal text-[24px] text-black text-nowrap whitespace-pre" data-node-id="14:21">
        Service
      </p>
      <div className="absolute aspect-[60/60] left-[10.08%] right-[76.05%] top-[14px]" data-name="icons8-heart-60 1" data-node-id="18:2">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={images.imgIcons8Heart601} />
      </div>
      <p className="absolute bottom-0 font-poppins leading-normal left-[10.08%] not-italic right-0 text-[#625f5f] text-[15px] top-[50.27%]" data-node-id="18:3">
        Dedicated to serving our community and making a positive impact.
      </p>
      <div className="absolute inset-[44.81%_46.22%_55.19%_10.08%]" data-node-id="18:5">
        <div className="absolute bottom-0 left-0 right-0 top-[-1px]">
          <img alt="" className="block max-w-none size-full" src={images.imgLine1} />
        </div>
      </div>
    </div>
  );
}

export function FellowshipCard({ className }) {
  return (
    <div className={className} data-name="Component 1" data-node-id="69:64">
      <div className="absolute bg-white inset-0 rounded-[33px] shadow-[0px_0px_28px_2px_rgba(0,0,0,0.25)]" />
      <p className="absolute font-playfair font-medium inset-[25.68%_56.3%_56.83%_10.08%] leading-normal text-[24px] text-black text-nowrap whitespace-pre">
        Fellowship
      </p>
      <div className="absolute left-[10.08%] top-[14px]">
        <img alt="" className="w-[44px] h-[44px]" src={images.imgIcons8UserAccount641} />
      </div>
      <p className="absolute bottom-0 font-poppins leading-normal left-[10.08%] not-italic right-0 text-[#625f5f] text-[15px] top-[50.27%]">
        Building lasting friendships and professional networks.
      </p>
      <div className="absolute inset-[44.81%_46.22%_55.19%_10.08%]">
        <div className="absolute bottom-0 left-0 right-0 top-[-1px]">
          <img alt="" className="block max-w-none size-full" src={images.imgLine1} />
        </div>
      </div>
    </div>
  );
}

export function LeadershipCard({ className }) {
  return (
    <div className={className} data-name="Component 1" data-node-id="69:74">
      <div className="absolute bg-white inset-0 rounded-[33px] shadow-[0px_0px_28px_2px_rgba(0,0,0,0.25)]" />
      <p className="absolute font-playfair font-medium inset-[25.68%_56.3%_56.83%_10.08%] leading-normal text-[24px] text-black text-nowrap whitespace-pre">
        Leadership
      </p>
      <div className="absolute left-[10.08%] top-[14px]">
        <img alt="" className="w-[33px] h-[33px] ml-2 mt-1" src={images.imgIcons8Leadership481} />
      </div>
      <p className="absolute bottom-0 font-poppins leading-normal left-[10.08%] not-italic right-0 text-[#625f5f] text-[15px] top-[50.27%]">
        Developing future leaders through hands-on experience.
      </p>
      <div className="absolute inset-[44.81%_46.22%_55.19%_10.08%]">
        <div className="absolute bottom-0 left-0 right-0 top-[-1px]">
          <img alt="" className="block max-w-none size-full" src={images.imgLine1} />
        </div>
      </div>
    </div>
  );
}

export function ExcellenceCard({ className }) {
  return (
    <div className={className} data-name="Component 1" data-node-id="69:89">
      <div className="absolute bg-white inset-0 rounded-[33px] shadow-[0px_0px_28px_2px_rgba(0,0,0,0.25)]" />
      <p className="absolute font-playfair font-medium inset-[25.68%_56.3%_56.83%_10.08%] leading-normal text-[24px] text-black text-nowrap whitespace-pre">
        Excellence
      </p>
      <div className="absolute left-[10.08%] top-[14px]">
        <img alt="" className="w-[31px] h-[31px] ml-2 mt-1" src={images.imgIcons8Badge501} />
      </div>
      <p className="absolute bottom-0 font-poppins leading-normal left-[10.08%] not-italic right-0 text-[#625f5f] text-[15px] top-[50.27%]">
        Striving for excellence in everything we do.
      </p>
      <div className="absolute inset-[44.81%_46.22%_55.19%_10.08%]">
        <div className="absolute bottom-0 left-0 right-0 top-[-1px]">
          <img alt="" className="block max-w-none size-full" src={images.imgLine1} />
        </div>
      </div>
    </div>
  );
}