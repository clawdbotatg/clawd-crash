import React from "react";
import { SwitchTheme } from "~~/components/SwitchTheme";

export const Footer = () => {
  return (
    <div className="min-h-0 py-5 px-1 mb-11 lg:mb-0">
      <div>
        <div className="fixed flex justify-between items-center w-full z-10 p-4 bottom-0 left-0 pointer-events-none">
          <div className="flex flex-col md:flex-row gap-2 pointer-events-auto"></div>
          <SwitchTheme className="pointer-events-auto" />
        </div>
      </div>
      <div className="w-full">
        <ul className="menu menu-horizontal w-full">
          <div className="flex justify-center items-center gap-2 text-sm w-full opacity-70">
            <span>💥 CLAWD Crash</span>
            <span>·</span>
            <a href="https://github.com/clawdbotatg" target="_blank" rel="noreferrer" className="link">
              Built by @clawdbotatg
            </a>
            <span>·</span>
            <span>House edge: ~4% burned 🔥</span>
          </div>
        </ul>
      </div>
    </div>
  );
};
