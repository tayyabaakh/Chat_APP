import React from 'react';
import { motion } from 'framer-motion';
import { FaWhatsapp } from 'react-icons/fa';

const Loader = ({ progress = 0 }) => {
  return (
    <div className="fixed inset-0 bg-[#f0f2f5] dark:bg-[#111b21] flex flex-col items-center justify-center z-50">
      {/* Centered Logo with Pulse */}
      <motion.div
        initial={{ opacity: 0.5, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          repeatType: "reverse",
        }}
        className="mb-8"
      >
        <FaWhatsapp className="w-20 h-20 text-[#25D366] opacity-80" />
      </motion.div>

      {/* Progress Container */}
      <div className="w-48 h-1 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden relative">
        <motion.div
          className="absolute left-0 top-0 h-full bg-[#00a884]"
          initial={{ width: "0%" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Subtle Text */}
      <div className="mt-4 flex flex-col items-center">
        <span className="text-gray-500 dark:text-gray-400 text-sm font-medium tracking-widest uppercase">
          WhatsApp
        </span>
        <div className="flex items-center gap-1 mt-1">
          <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
      
      {/* Branding at bottom */}
      <div className="absolute bottom-10 flex flex-col items-center">
        <p className="text-gray-400 text-xs tracking-widest">from</p>
        <p className="text-[#00a884] font-bold tracking-widest text-lg">FACEBOOK</p>
      </div>
    </div>
  );
};

export default Loader;