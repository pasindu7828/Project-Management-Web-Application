import axios from "axios";
import { useState } from "react";
import Toast from "../../components/Toast";

const UploadModal = ({ onClose, projectId, onUploadSuccess }) => {
    const allowedTypes = ["application/pdf", "image/png", "image/jpeg"];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [toast, setToast] = useState(null);

    const URL_API = import.meta.env.VITE_API_BASE_URL;

    const handleSubmit = async (e) => {
      e.preventDefault();

      if (selectedFiles.length === 0){
        setToast({ message: "Please select at least one file", type: "error" });
        return;
      }

      const validFiles = selectedFiles.filter(f => allowedTypes.includes(f.type) && f.size <= maxSize);
      if(validFiles.length !== selectedFiles.length){
        setToast({ message: "Some files are invalid or too large!", type: "error" });
        return;
      }

      setUploading(true);
      // handle files here
      
// console.log("Files to upload:", selectedFiles);

      const formData = new FormData();

      validFiles.forEach((file)=>{
        formData.append("attachments", file);
      });

      try {
        const res = await axios.post(
          `${URL_API}/api/v1/projects/${projectId}/attachments`,
          formData,
          {withCredentials: true, headers: {"Content-Type": "multipart/form-data"}}
        );

        onUploadSuccess?.();
        setToast({ message: "File Uploaded successfully", type: "success" });
        setTimeout(() => {
          onClose();
        }, 2000);
        
      } catch (error) {
        console.error("Upload failed", error);
        setToast({ message: "File upload failed", type: "error" });
      } finally{
        setUploading(false);
      }

      
    };

    const addFiles = (files) => {
      const valid = [];
      const invalid = [];

      files.forEach((file)=> {
        if (!allowedTypes.includes(file.type)) {
          invalid.push(`${file.name} (invalid type)`);
        } else if (file.size > maxSize) {
          invalid.push(`${file.name} (too large)`);
        } else {
          valid.push(file);
        }
      });

      if (invalid.length > 0) {
        setToast({
          message: `Invalid files: ${invalid.join(", ")}`,
          type: "error",
        });
      }

      setSelectedFiles((prev)=>{
        const newFiles = valid.filter(
          (f)=>!prev.some((p)=>p.name === f.name && p.size === f.size)
        );
        return [...prev, ...newFiles];
      });
    };
  
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-md shadow-xl w-full max-w-3xl">
          {/* header */}
          <div className="border-b px-6 py-4">
            <h2 className="text-lg font-semibold text-center">Upload Files</h2>
          </div>

          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          )}
  
          {/* body */}
          <form onSubmit={handleSubmit} className="px-8 py-6">
            <p className="text-center font-medium mb-4">
              Add project-related documents and files
            </p>
            {uploading && <p className="text-center text-gray-500 mb-4">Uploading...</p>}
            {/* drag & drop area */}
            <div className={`border-2 border-dashed  rounded-md h-64 flex items-center justify-center mb-6 ${
              isDragging ? "border-[#087990] bg-[#087990]/50" : "border-gray-400"
            }`}
            onDragOver={(e)=>{
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragEnter={(e)=>{
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(e)=>{
              e.preventDefault();
              setIsDragging(false);
            }}
            onDrop={(e)=>{
              e.preventDefault();
              setIsDragging(false);
              addFiles(Array.from(e.dataTransfer.files));
              
            }}
            
            >
              <div className="text-center text-sm text-gray-700">
                <div className="mb-4 flex justify-center">
                  <span className="text-4xl">⬆</span>
                </div>
                <p className="font-medium mb-1">Drag &amp; drop files here</p>
                <p className="mb-4">or</p>
  
                <label className="inline-block">
                  <span className="px-6 py-2 rounded-md bg-[#087990] text-white text-sm cursor-pointer hover:bg-teal-800">
                    Browse File
                  </span>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(e)=> addFiles(Array.from(e.target.files))}
                  />
                </label>
  
                <p className="mt-4 text-xs text-gray-500">
                  (Max size: 10MB| Max Files: 5 | Allowed: PDF, PNG, JPG) 
                </p>
              </div>
            </div>

            {selectedFiles.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium mb-1">Selected Files:</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  {selectedFiles.map((file, index) => (
                    <li key={index} className="flex justify-between items-center">
                      {file.name}
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
                        }
                        className="text-red-500 text-xs ml-2 hover:underline"
                      >
                        Remove
                      </button>
                      </li>
                  ))}
                </ul>
              </div>
            )}

  
            {/* footer buttons */}
            <div className="flex justify-end gap-4 pb-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 rounded-md border border-gray-300 text-gray-700 text-sm bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-md bg-[#087990] text-white text-sm hover:bg-teal-800"
              >
                Upload
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };
  
  export default UploadModal;
  