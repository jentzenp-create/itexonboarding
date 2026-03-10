'use client';

import { motion } from 'framer-motion';
import { Smartphone } from 'lucide-react';

const APP_LINKS = {
  android: 'https://play.google.com/store/apps/details?id=com.itex.mobile',
  ios: 'https://itunes.apple.com/us/app/itex-mobile/id901476506',
  amazon: 'http://www.amazon.com/ITEX-Corporation-Mobile/dp/B00Q7AQJAW/',
};

export function AppDownloadBanner() {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.4 }}
      className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-white/30 shadow-lg"
    >
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-itex flex items-center justify-center">
            <Smartphone className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-itex-dark hidden sm:block">Download the ITEX App</span>
          <span className="text-sm font-semibold text-itex-dark sm:hidden">ITEX App</span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={APP_LINKS.ios}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-itex-dark text-white text-xs font-medium hover:bg-gray-800 transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            App Store
          </a>
          <a
            href={APP_LINKS.android}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-itex-lime text-white text-xs font-medium hover:bg-green-600 transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.523 15.341l-4.023-4.023 4.023-4.023-1.414-1.414-4.023 4.023-4.023-4.023-1.414 1.414 4.023 4.023-4.023 4.023 1.414 1.414 4.023-4.023 4.023 4.023 1.414-1.414zM1.5 12C1.5 6.201 6.201 1.5 12 1.5S22.5 6.201 22.5 12 17.799 22.5 12 22.5 1.5 17.799 1.5 12z"/>
            </svg>
            Google Play
          </a>
          <a
            href={APP_LINKS.amazon}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-medium hover:bg-amber-600 transition-colors hidden sm:flex"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M.045 18.02c.072-.116.187-.124.348-.022 3.636 2.11 7.594 3.166 11.87 3.166 2.852 0 5.668-.533 8.447-1.595l.315-.14c.138-.06.234-.1.293-.13.226-.088.39-.046.525.13.12.174.09.336-.12.48-.256.19-.6.41-1.006.654-1.244.743-2.64 1.316-4.185 1.726a17.617 17.617 0 01-10.951-.577 17.88 17.88 0 01-5.43-3.35c-.1-.074-.151-.15-.151-.22 0-.047.021-.09.045-.12zm6.565-6.218c0-1.005.247-1.863.743-2.577.495-.71 1.17-1.25 2.04-1.615.796-.335 1.756-.575 2.912-.72l1.368-.165v-.496c0-.816-.178-1.4-.535-1.76-.355-.36-.9-.54-1.64-.54-1.273 0-2.116.535-2.527 1.607l-2.35-.24c.37-1.1 1.006-1.92 1.91-2.46.9-.54 2.01-.81 3.32-.81 1.48 0 2.61.38 3.39 1.14.78.76 1.17 1.84 1.17 3.24v6.3h-2.19v-1.35h-.06c-.27.48-.67.87-1.2 1.17-.53.3-1.12.45-1.77.45-.96 0-1.74-.28-2.34-.84-.6-.56-.9-1.3-.9-2.22zm2.22-.3c0 .48.16.87.48 1.17.32.3.74.45 1.26.45.72 0 1.32-.24 1.8-.72.48-.48.72-1.08.72-1.8v-.72l-1.14.12c-.84.09-1.47.27-1.89.54-.42.27-.63.63-.63 1.08l-.6-.12z"/>
            </svg>
            Amazon
          </a>
        </div>
      </div>
    </motion.div>
  );
}
