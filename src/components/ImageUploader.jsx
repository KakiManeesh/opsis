/**
 * Renders the file input used to upload an image from the local machine.
 */
function ImageUploader({ onFileSelect }) {
  /**
   * Passes the selected image file back to the parent component.
   */
  const handleChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className="panel-block">
      <label className="panel-label" htmlFor="image-upload">
        Upload Image
      </label>
      <input
        id="image-upload"
        type="file"
        accept="image/*"
        onChange={handleChange}
      />
    </div>
  );
}

export default ImageUploader;
