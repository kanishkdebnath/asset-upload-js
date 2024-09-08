import React, {
  createContext,
  useContext,
  useRef,
  useState,
} from "react";
import DEFAULT_ICON from "../assets/react.svg";
import "./AssetSelect.css";

const AssetSelectContext = createContext(undefined);

function useAssetSelectContext() {
  const context = useContext(AssetSelectContext);
  if (!context) {
    throw new Error("useAssetSelectContext must be used within an AssetSelect");
  }
  return context;
}

const AssetSelect = ({
  children,
  assetRef,
  assetName,
  validationObject,
  onError,
  className,
}) => {
  const [files, setFiles] = useState([]);

  return (
    <AssetSelectContext.Provider
      value={{
        assetName,
        assetRef,
        files,
        setFiles,
        validationObject,
        onError,
      }}
    >
      <div className={className}>{children}</div>
    </AssetSelectContext.Provider>
  );
};

AssetSelect.Description = function AssetSelectDescription({
  className,
  maxSize,
  dimension,
  fileType,
}) {
  return (
    <div className={className}>
      <div>{maxSize}</div>
      <div>{dimension}</div>
      <div>{fileType}</div>
    </div>
  );
};

AssetSelect.SingleImagePreview = function AssetSelectSingleImagePreview({
  className,
}) {
  const { files } = useAssetSelectContext();
  const filePreview = files[0] ? URL.createObjectURL(files[0]) : DEFAULT_ICON;
  return (
    <div className={className}>
      <img
        src={filePreview}
        alt="Preview Image"
        className="single-image-preview"
      />
    </div>
  );
};

AssetSelect.SingleVideoPreview = function AssetSelectSingleVideoPreview({
  className,
}) {
  const { files } = useAssetSelectContext();
  return (
    <div className={className}>
      {files[0] && (
        <video
          src={URL.createObjectURL(files[0])}
          controls
          className="single-video-preview"
        />
      )}
    </div>
  );
};

AssetSelect.MultipleImagesPreview = function AssetSelectMultipleImagesPreview({
  className,
}) {
  const { assetName, assetRef, files, setFiles } = useAssetSelectContext();

  const handleRemove = (indexToRemove) => {
    // Remove the file at the specified index
    const updatedFiles = files.filter(
      (_, index) => index !== indexToRemove
    );
    setFiles(updatedFiles);
    assetRef.current[assetName] = updatedFiles;
  };

  const filePreviews = files.map((file) => URL.createObjectURL(file));

  return (
    <div className={"default-multipreview-style " + className}>
      {filePreviews.map((filePreview, index) => (
        <div key={index} className="preview-container">
          <button className="remove-button" onClick={() => handleRemove(index)}>
            X
          </button>
          <img
            src={filePreview}
            alt={`preview-${index}`}
            className="multiple-preview-media"
          />
        </div>
      ))}
    </div>
  );
};

AssetSelect.Button = function AssetSelectButton({
  className,
  children,
  multiple = false,
}) {
  const { assetRef, assetName, files, setFiles, validationObject, onError } = useAssetSelectContext();
  const inputRef = useRef(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const newFiles = Array.from(event.target.files || []);
    let updatedFiles = [...files]; // for multiple file case
    const hasError = newFiles.some((file) => {
      if (file.size > (validationObject.maxSize.value)) {
        onError(validationObject.maxSize.errorMessage);
        return true;
      }

      if (
        !validationObject.accepted.value.some((type) =>
          file.type.includes(type.trim())
        )
      ) {
        onError(validationObject.accepted.errorMessage);
        return true;
      }

      return false;
    });

    if (hasError) {
      return;
    }

    if (validationObject.customValidation) {
      updatedFiles = [...updatedFiles, ...newFiles]; // persists existing file
      // Use the external validation function if provided
      const validationError = validationObject.customValidation(updatedFiles);
      if (validationError) {
        onError(validationError);
        return;
      }
    }

    const validFiles = multiple ? updatedFiles : newFiles;
    setFiles(validFiles);
    assetRef.current[assetName] = validFiles;
  };

  return (
    <>
      <button className={className} onClick={handleClick}>
        {children}
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        accept={validationObject.accepted.value.join(",")}
        onChange={handleFileChange}
        style={{ display: "none" }} // Hide the input
      />
    </>
  );
};

export default AssetSelect;