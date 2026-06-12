import { useEffect, useState } from "react";

const Toast = ({ message, type = "success", onClose, duration = 3000 }) => {
    const [visible, setVisible] = useState(false);
  useEffect(() => {
    setVisible(true);

    const timer = setTimeout(() => {
        setVisible(false);

        setTimeout(()=>{
            if (onClose) onClose();
        }, 300);
    }, duration)
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = type === "success" ? "bg-green-500" : "bg-red-500";

  return (
    <div
      className={`${bgColor} text-white px-4 py-2 rounded-md shadow-md flex justify-between items-center mb-4 text-sm`}
    >
      <span>{message}</span>
      {onClose && (
        <button
          className="ml-4 text-white font-bold hover:text-gray-200"
          onClick={()=> setVisible(false)}
        >
          &times;
        </button>
      )}
    </div>
  );
};

export default Toast;
