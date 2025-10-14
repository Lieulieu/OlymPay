import { motion, AnimatePresence } from "framer-motion";

export const LoadingSpinner = ({
  size = "sm",
}: {
  size?: "sm" | "md" | "lg";
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} border-2 border-current border-t-transparent rounded-full`}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
  );
};

export const LoadingButton = ({
  isLoading,
  loadingText,
  children,
  className = "",
  ...props
}: any) => (
  <motion.button
    className={`btn relative ${className} ${
      isLoading ? "cursor-not-allowed" : ""
    }`}
    disabled={isLoading}
    whileHover={!isLoading ? { scale: 1.05 } : {}}
    whileTap={!isLoading ? { scale: 0.95 } : {}}
    transition={{ duration: 0.2 }}
    {...props}
  >
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex items-center gap-2"
        >
          <LoadingSpinner />
          <span>{loadingText}</span>
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  </motion.button>
);
