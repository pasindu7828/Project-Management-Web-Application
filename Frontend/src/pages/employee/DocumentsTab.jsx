import axios from "axios";
import { useEffect, useState } from "react";
import UploadModal from "./UploadModal";
import Toast from "../../components/Toast";
import useIsTeamLeader from "../../hooks/useIsTeamLeader";
import { Trash2 } from "lucide-react";



const DocumentsTab = ({projectId, projectData}) => {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [filterType, setFilterType] = useState("All");
  const [documents, setDocuments] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const { isTeamLeader, loading } = useIsTeamLeader(projectId);
  const MAX_DOCUMENTS = 5;


  const URL_API = import.meta.env.VITE_API_BASE_URL;

  const fetchDocuments =async ()=>{
    try {
      const res = await axios.get(
        `${URL_API}/api/v1/projects/${projectId}/attachments`,
        {withCredentials:true}
      );
      setDocuments(res.data.data ||[]);
      // console.log("Fetched attachments:", res.data.data);
    } catch (error) {
      setToast({ message: "Failed to fetch documents", type: "error" });
      console.error("Failed to fetch documents", error);
      setDocuments([]);
    } finally {
      setPageLoading(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    try {
      await axios.delete(
        `${URL_API}/api/v1/projects/${projectId}/attachments/${docId}`,
        { withCredentials: true }
      );
  
      setDocuments(prev => prev.filter(d => d._id !== docId));
      setToast({ message: "Document deleted successfully", type: "success" });
    } catch (error) {
      console.error("Delete failed", error);
      setToast({ message: "Failed to delete document", type: "error" });
    } finally {
      setConfirmDelete(null);
    }
  };
  

  useEffect(()=>{
    if (!projectId) return;
    setPageLoading(true);
    fetchDocuments();
  },[projectId]);

  const extMap = {
    jpg: ["jpg", "jpeg"],
    png: ["png"],
    pdf: ["pdf"],
  }

  const filteredDocs = documents.filter(doc => {
    if(filterType === "All") return true;

    const name = doc.originalName.toLowerCase();
    const exts = extMap[filterType.toLowerCase()] || [filterType.toLowerCase()];

    return exts.some(ext => name.endsWith(ext));
  });

  if (loading) {
    return <p className="m-6 text-center text-gray-500">Checking permissions...</p>;
  }
  
  const hasReachedLimit = documents.length >= MAX_DOCUMENTS;

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold ml-6">Project Documents</h2>

        <div className="flex items-center gap-3 mr-6">
         
          <select 
            value={filterType}
            onChange={(e)=> setFilterType(e.target.value)}
            className="flex items-center justify-between w-28 px-3 py-2 border rounded-md bg-white text-gray-700 text-sm">
            <option value="All">All</option>
            <option value="pdf">PDF</option>
            <option value="png">PNG</option>
            <option value="jpg">JPEG</option>
          </select>

          <button
            onClick={() => {
              if (hasReachedLimit){
                setToast({
                  message: "You can upload a maximum of 5 documents. Please delete one to upload a new file.",
                  type: "error",
                });
                return;
              }
              setIsUploadOpen(true);
            }}
            disabled={hasReachedLimit}
            className={`px-5 py-2 rounded-md text-white text-sm 
              ${hasReachedLimit
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#087990] hover:bg-teal-900"
            }`}
            
          >
            Upload File
          </button>
          {hasReachedLimit && (
            <p className="text-xs text-red-500 mt-1">
              Maximum of 5 documents allowed per project.
            </p>
          )}

        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* documents grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl m-6 max-h-[600px] overflow-y-auto">
      {pageLoading && <p className="m-6 text-gray-500 col-span-2">Loading documents...</p>}
      {!pageLoading && filteredDocs.length === 0 && (
          <p className="m-6 text-gray-500 col-span-2">No documents found.</p>
      )}
        {!pageLoading && filteredDocs.length > 0 &&
        filteredDocs.map((doc) => (
          <div
            key={doc._id}
            className="bg-white border rounded-md shadow-sm text-sm text-gray-700"
          >
            <div className="border-b px-4 py-2 font-semibold">Details</div>
            <div className="px-4 py-3 space-y-1">
              <p>
                <span className="font-medium">Title :</span> {doc.originalName || ""}
              </p>
              <p>
                <span className="font-medium">Uploaded On:</span>{" "}
                {new Date(doc.createdAt).toLocaleDateString()}
              </p>
              <p>
                <span className="font-medium">File Type:</span>{" "}
                {doc.fileType}
              </p>
              <p>
                <span className="font-medium">File Size:</span>{" "}
                {(doc.fileSize/1024).toFixed(2)} KB
              </p>
            </div>
            <div className="px-4 py-3 border-t flex justify-between gap-2">
            {isTeamLeader && (
              <button
                onClick={() => setConfirmDelete(doc)}
                className="p-2 rounded hover:bg-gray-100 hover:text-red-500 text-[#087990]"
                title="Delete"
              >
                <Trash2 size={18} />
              </button>
            )}
              <button className="px-4 py-1 rounded-md bg-[#087990] text-white text-sm hover:bg-teal-800">
                <a href={`${URL_API}${doc.fileUrl}`} download={doc.originalName}>
                Download
                </a></button>
            </div>
          </div>
        ))}
      </div>

      {/* upload modal */}
      {isUploadOpen && (
        <UploadModal
        projectId = {projectId}
        onClose={() => setIsUploadOpen(false)} 
        onUploadSuccess={fetchDocuments}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-md shadow-md max-w-sm w-full">
            <p className="mb-4 text-gray-800">
              Are you sure you want to delete
              <span className="font-semibold"> {confirmDelete.originalName}</span>?
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-400"
              >
                Cancel
              </button>

              <button
                onClick={() => handleDeleteDocument(confirmDelete._id)}
                className="px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
};

export default DocumentsTab;
