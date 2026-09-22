const fs = require('fs');
const path = 'client/src/pages/FarmerCentre.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add missing icons
content = content.replace(
  `Trash2, Edit, Video, Eye`,
  `Trash2, Edit, Video, Eye, X, ArrowLeft, ArrowRight, Image as ImageIcon`
);

// 2. Replace ProductImage state and interfaces
const oldStateStart = content.indexOf(`  // Products list states`);
const oldStateEnd = content.indexOf(`  const {`);

const newStates = `
  interface ProductMedia {
    id: string;
    type: 'upload' | 'url' | 'video';
    url: string; 
    file?: File; 
  }

  // Products list states
  const [productsPage, setProductsPage] = useState(1);
  const [productsLimit, setProductsLimit] = useState(12);

  // Multiple Images State
  const [productImages, setProductImages] = useState<ProductMedia[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showImageInputModal, setShowImageInputModal] = useState(false);

  // Image Input Modal States
  const [mediaInputMethod, setMediaInputMethod] = useState<'upload' | 'url' | 'video'>('upload');
  const [currentImageFile, setCurrentImageFile] = useState<File | null>(null);
  const [currentImagePreview, setCurrentImagePreview] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('');
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>('');
  const [mediaError, setMediaError] = useState<string | null>(null);

`;
content = content.substring(0, oldStateStart) + newStates + content.substring(oldStateEnd);

// 3. Update createProductMutation onSuccess
content = content.replace(
  `      console.log('✅ Product created:', data.name);
      resetProductForm();
      setProductImage(null);
      setImageUrl('');
      setVideoUrl('');
      setImageUploadError(null);
      setImageUrlError(null);
      setVideoUrlError(null);
      setMediaInputMethod('upload');
      (window as any).selectedImageFile = null;
      setShowAddProductModal(false);`,
  `      console.log('✅ Product created:', data.name);
      resetProductForm();
      setProductImages([]);
      setShowAddProductModal(false);`
);

// 4. Replace handleImageSelect ... onSubmitProduct with new logic
const oldHandlersStart = content.indexOf(`  const handleImageSelect`);
const oldHandlersEnd = content.indexOf(`  const handleProductsPreviousPage`);

const newHandlers = `
  const openImageModal = () => {
    setMediaInputMethod('upload');
    setCurrentImageFile(null);
    setCurrentImagePreview(null);
    setCurrentImageUrl('');
    setCurrentVideoUrl('');
    setMediaError(null);
    setShowImageInputModal(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setMediaError('Please select an image file (JPG, PNG, etc.)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMediaError('Image size must be less than 5MB');
      return;
    }
    setMediaError(null);
    setCurrentImageFile(file);
    setCurrentImagePreview(URL.createObjectURL(file));
  };

  const validateAndAddMedia = () => {
    if (mediaInputMethod === 'upload') {
      if (!currentImageFile || !currentImagePreview) {
        setMediaError('Please select a file first.');
        return;
      }
      setProductImages(prev => [...prev, {
        id: Math.random().toString(36).substring(7),
        type: 'upload',
        url: currentImagePreview,
        file: currentImageFile
      }]);
    } else if (mediaInputMethod === 'url') {
      if (!currentImageUrl.trim()) {
        setMediaError('Please enter a valid URL.');
        return;
      }
      try {
        new URL(currentImageUrl);
        setProductImages(prev => [...prev, {
          id: Math.random().toString(36).substring(7),
          type: 'url',
          url: currentImageUrl.trim()
        }]);
      } catch {
        setMediaError('Invalid URL format.');
        return;
      }
    } else if (mediaInputMethod === 'video') {
      if (!currentVideoUrl.trim()) {
        setMediaError('Please enter a valid video URL.');
        return;
      }
      const embed = getVideoEmbedUrl(currentVideoUrl);
      if (!embed) {
        setMediaError('Unsupported video URL. Use YouTube, Vimeo, or Dailymotion.');
        return;
      }
      setProductImages(prev => [...prev, {
        id: Math.random().toString(36).substring(7),
        type: 'video',
        url: currentVideoUrl.trim()
      }]);
    }
    setShowImageInputModal(false);
  };

  const handleRemoveImage = (id: string) => {
    setProductImages(prev => prev.filter(img => img.id !== id));
  };

  const handleMoveImage = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      setProductImages(prev => {
        const newArr = [...prev];
        [newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]];
        return newArr;
      });
    } else if (direction === 'down' && index < productImages.length - 1) {
      setProductImages(prev => {
        const newArr = [...prev];
        [newArr[index], newArr[index + 1]] = [newArr[index + 1], newArr[index]];
        return newArr;
      });
    }
  };

  const onSubmitProduct = async (formData: any) => {
    try {
      const price = Number(formData.price);
      if (isNaN(price) || price <= 0) {
        alert('Price must be a positive number');
        return;
      }
      if (!formData.name?.trim()) {
        alert('Product name is required');
        return;
      }

      setIsUploadingImage(true);
      
      const finalImages: string[] = [];
      let finalVideoUrl: string | null = null;

      // Process all images
      for (const media of productImages) {
        if (media.type === 'upload' && media.file) {
          try {
            const uploadedUrl = await uploadImageToCloudinary(media.file);
            finalImages.push(uploadedUrl);
          } catch (error: any) {
            alert(\`Failed to upload one of the images: \${error.message}\`);
            setIsUploadingImage(false);
            return;
          }
        } else if (media.type === 'url') {
          finalImages.push(media.url);
        } else if (media.type === 'video') {
          if (!finalVideoUrl) finalVideoUrl = media.url; // Keep first video as main videoUrl if needed
        }
      }

      setIsUploadingImage(false);

      createProductMutation.mutate({
        ...formData,
        price: price,
        quantity: formData.quantity ? Number(formData.quantity) : 0,
        images: finalImages,
        image: finalImages[0] || null, // set primary
        videoUrl: finalVideoUrl
      });
    } catch (error) {
      console.error('Form submission error:', error);
      setIsUploadingImage(false);
    }
  };

`;

content = content.substring(0, oldHandlersStart) + newHandlers + content.substring(oldHandlersEnd);

// 5. Replace Add Product Modal content
const modalStart = content.indexOf(`{/* Tabbed Media Input Section */}`);
const modalEnd = content.indexOf(`              <div>
                <label className="block text-sm font-bold text-text-primary mb-1">Product Name *</label>`);

const newModalTop = `
              {/* SECTION 1: BASIC PRODUCT INFO */}
              <div className="space-y-4">
`;
content = content.substring(0, modalStart) + newModalTop + content.substring(modalEnd);

// Find the end of Basic info (after SKU) to insert images section
const basicEnd = content.indexOf(`              {createProductMutation.isError`);
const newImagesSection = `
              </div>

              {/* SECTION 2: PRODUCT IMAGES (MULTIPLE) */}
              <div className="border border-border-muted rounded-xl p-5 bg-gray-50/50 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-text-primary">Product Images</h3>
                  <p className="text-xs text-text-muted mt-0.5">(Add multiple images to showcase your product. First image is primary.)</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {productImages.map((media, index) => (
                    <div key={media.id} className="relative group bg-white border border-border-muted rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
                      <div className="aspect-square w-full bg-gray-100 flex items-center justify-center relative">
                        {media.type === 'video' ? (
                          <div className="w-full h-full relative pointer-events-none">
                            <iframe src={getVideoEmbedUrl(media.url)!} className="w-full h-full" frameBorder="0"></iframe>
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                              <Video className="w-6 h-6 text-white" />
                            </div>
                          </div>
                        ) : (
                          <img src={media.url} alt="Preview" className="w-full h-full object-cover" />
                        )}
                        {/* Remove Button */}
                        <button type="button" onClick={() => handleRemoveImage(media.id)} className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-sm opacity-90 hover:opacity-100 transition z-10">
                          <X className="w-3.5 h-3.5" />
                        </button>
                        {/* Order Buttons */}
                        <div className="absolute bottom-1.5 left-1.5 right-1.5 flex justify-between gap-1 opacity-0 group-hover:opacity-100 transition z-10">
                          <button type="button" onClick={() => handleMoveImage(index, 'up')} disabled={index === 0} className="p-1 bg-white/90 rounded text-text-primary hover:bg-white disabled:opacity-30 shadow-sm"><ArrowLeft className="w-3.5 h-3.5" /></button>
                          <button type="button" onClick={() => handleMoveImage(index, 'down')} disabled={index === productImages.length - 1} className="p-1 bg-white/90 rounded text-text-primary hover:bg-white disabled:opacity-30 shadow-sm"><ArrowRight className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                      <div className="px-2 py-1.5 bg-white border-t border-border-muted flex items-center justify-between">
                        <span className="text-[10px] font-bold text-text-muted uppercase">{media.type}</span>
                        {index === 0 && <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 rounded">PRIMARY</span>}
                      </div>
                    </div>
                  ))}

                  {/* Add Image Button inside grid (if under 10 images) */}
                  {productImages.length < 10 && (
                    <button type="button" onClick={openImageModal} className="aspect-square w-full rounded-xl border-2 border-dashed border-primary/40 flex flex-col items-center justify-center gap-2 text-primary hover:bg-primary/5 transition bg-white">
                      <Plus className="w-6 h-6" />
                      <span className="text-xs font-bold">Add Image</span>
                    </button>
                  )}
                </div>
              </div>

`;
content = content.substring(0, basicEnd) + newImagesSection + content.substring(basicEnd);

// 6. Append Image Input Modal just after Add Product Modal ends
const addProductModalEnd = content.indexOf(`      {/* TAB NAVIGATION */}`);
const imageInputModal = `
      {/* IMAGE INPUT MODAL (Nested) */}
      {showImageInputModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-text-primary">Add Media Source</h3>
              <button onClick={() => setShowImageInputModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex bg-gray-100 p-1 rounded-lg mb-5">
              <button onClick={() => { setMediaInputMethod('upload'); setMediaError(null); }} className={\`flex-1 py-2 text-sm font-bold rounded-md transition \${mediaInputMethod === 'upload' ? 'bg-white shadow-sm text-primary' : 'text-text-muted hover:text-text-primary'}\`}>📁 Upload</button>
              <button onClick={() => { setMediaInputMethod('url'); setMediaError(null); }} className={\`flex-1 py-2 text-sm font-bold rounded-md transition \${mediaInputMethod === 'url' ? 'bg-white shadow-sm text-primary' : 'text-text-muted hover:text-text-primary'}\`}>🔗 URL</button>
              <button onClick={() => { setMediaInputMethod('video'); setMediaError(null); }} className={\`flex-1 py-2 text-sm font-bold rounded-md transition \${mediaInputMethod === 'video' ? 'bg-white shadow-sm text-primary' : 'text-text-muted hover:text-text-primary'}\`}>🎥 Video</button>
            </div>

            <div className="space-y-4">
              {mediaInputMethod === 'upload' && (
                <div>
                  {currentImagePreview ? (
                    <div className="relative rounded-xl overflow-hidden border border-border-muted h-40 mb-3">
                      <img src={currentImagePreview} className="w-full h-full object-cover" alt="Preview" />
                      <button onClick={() => { setCurrentImageFile(null); setCurrentImagePreview(null); }} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <div className="h-40 border-2 border-dashed border-border-muted rounded-xl flex flex-col items-center justify-center bg-gray-50 mb-3 relative">
                      <ImageIcon className="w-8 h-8 text-text-muted mb-2" />
                      <span className="text-sm font-bold text-text-muted">Click to browse file</span>
                      <input type="file" accept="image/*" onChange={handleFileSelect} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                  )}
                  <p className="text-xs text-text-muted text-center">JPG, PNG, WebP. Max 5MB</p>
                </div>
              )}

              {mediaInputMethod === 'url' && (
                <div>
                  <input type="url" value={currentImageUrl} onChange={e => setCurrentImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" className="w-full px-4 py-3 border border-border-muted rounded-xl bg-white mb-2 focus:ring-2 focus:ring-primary/50" />
                  <p className="text-xs text-text-muted">Paste Cloudinary, Imgur, Unsplash URL, etc</p>
                  {currentImageUrl && (
                    <div className="mt-3 rounded-xl overflow-hidden border border-border-muted h-40">
                      <img src={currentImageUrl} onError={() => setMediaError("Could not load image from URL")} className="w-full h-full object-cover" alt="URL Preview" />
                    </div>
                  )}
                </div>
              )}

              {mediaInputMethod === 'video' && (
                <div>
                  <input type="url" value={currentVideoUrl} onChange={e => setCurrentVideoUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." className="w-full px-4 py-3 border border-border-muted rounded-xl bg-white mb-2 focus:ring-2 focus:ring-primary/50" />
                  <p className="text-xs text-text-muted">YouTube, Vimeo, Dailymotion URLs supported</p>
                  {currentVideoUrl && getVideoEmbedUrl(currentVideoUrl) && (
                    <div className="mt-3 rounded-xl overflow-hidden border border-border-muted aspect-video bg-black">
                      <iframe src={getVideoEmbedUrl(currentVideoUrl)!} className="w-full h-full" frameBorder="0"></iframe>
                    </div>
                  )}
                </div>
              )}

              {mediaError && <p className="text-sm text-red-500 font-medium text-center">{mediaError}</p>}
            </div>

            <div className="flex gap-3 mt-6 pt-5 border-t border-border-muted">
              <button onClick={() => { setCurrentImageFile(null); setCurrentImagePreview(null); setCurrentImageUrl(''); setCurrentVideoUrl(''); setMediaError(null); }} className="px-4 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition">Clear</button>
              <div className="flex-1"></div>
              <button onClick={() => setShowImageInputModal(false)} className="px-4 py-2 text-sm font-bold text-text-primary bg-gray-100 hover:bg-gray-200 rounded-lg transition">Cancel</button>
              <button onClick={validateAndAddMedia} className="px-5 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded-lg transition">Add Image</button>
            </div>
          </div>
        </div>
      )}

`;
content = content.substring(0, addProductModalEnd) + imageInputModal + content.substring(addProductModalEnd);

fs.writeFileSync(path, content);
console.log("Successfully patched FarmerCentre.tsx to support multiple images");
