const fs = require('fs');
const path = 'client/src/pages/FarmerCentre.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add Icons
content = content.replace(
  "Sprout, PlusCircle, Package, IndianRupee, Truck",
  "Sprout, PlusCircle, Package, IndianRupee, Truck, Trash2, Edit, Video"
);

// 2. Add State Variables
const stateBlock = `  const [orderStatus, setOrderStatus] = useState<string>(''); // Filter by status
  const queryClient = useQueryClient();`;
const newStateBlock = `  const [orderStatus, setOrderStatus] = useState<string>(''); // Filter by status
  const queryClient = useQueryClient();

  // Products list states
  const [productsPage, setProductsPage] = useState(1);
  const [productsLimit, setProductsLimit] = useState(12);

  // Media Input Method States
  const [mediaInputMethod, setMediaInputMethod] = useState<'upload' | 'imageUrl' | 'videoUrl'>('upload');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [imageUrlError, setImageUrlError] = useState<string | null>(null);
  const [videoUrlError, setVideoUrlError] = useState<string | null>(null);`;
content = content.replace(stateBlock, newStateBlock);

// 3. Add useQuery for sellerProducts
const ordersQuery = `  const ordersData = ordersResponse;`;
const productsQuery = `  const ordersData = ordersResponse;

  const { data: productsData, isLoading: productsLoading, error: productsError, refetch: refetchProducts } = useQuery({
    queryKey: ['sellerProducts', productsPage, productsLimit],
    queryFn: async () => {
      const token = await getToken();
      const params = new URLSearchParams({
        page: String(productsPage),
        limit: String(productsLimit)
      });
      const { data } = await apiClient.get(\`/seller/products?\${params.toString()}\`, {
        headers: { Authorization: \`Bearer \${token}\` }
      });
      return data;
    },
    enabled: !!isSignedIn && activeTab === 'dashboard',
    staleTime: 2 * 60 * 1000
  });`;
content = content.replace(ordersQuery, productsQuery);

// 4. Update createProductMutation onSuccess
content = content.replace(
  `    onSuccess: (data) => {
      console.log('✅ Product created:', data.name);
      resetProductForm();
      setProductImage(null);
      setImageUploadError(null);
      (window as any).selectedImageFile = null;
      setShowAddProductModal(false);
      queryClient.invalidateQueries({ queryKey: ['farmerAnalytics'] });
      alert(\`\${data.name} added successfully!\`); // simple fallback for toast
    },`,
  `    onSuccess: (data) => {
      console.log('✅ Product created:', data.name);
      resetProductForm();
      setProductImage(null);
      setImageUrl('');
      setVideoUrl('');
      setImageUploadError(null);
      setImageUrlError(null);
      setVideoUrlError(null);
      setMediaInputMethod('upload');
      (window as any).selectedImageFile = null;
      setShowAddProductModal(false);
      queryClient.invalidateQueries({ queryKey: ['farmerAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['sellerProducts'] });
      alert(\`\${data.name} added successfully!\`); // simple fallback for toast
    },`
);

// 5. Replace Image Upload and Submit handlers with new Media logic
const oldHandlers = `  /**
   * Upload image file to Cloudinary and return secure URL
   */`;
const oldSubmitStart = content.indexOf(oldHandlers);
const oldSubmitEnd = content.indexOf(`  // Handler: Pagination`);

const newHandlers = `  /**
   * Upload image file to Cloudinary and return secure URL
   */
  const uploadImageToCloudinary = async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'ecomarket_products');
      formData.append('cloud_name', 'hzjhhalf');
      formData.append('folder', 'ecomarket/products');
      formData.append('quality', 'auto:good');
      formData.append('fetch_format', 'auto');

      const response = await fetch(
        'https://api.cloudinary.com/v1_1/hzjhhalf/image/upload',
        { method: 'POST', body: formData }
      );

      if (!response.ok) throw new Error('Cloudinary upload failed');

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('Image upload error:', error);
      throw new Error('Failed to upload image. Please try again.');
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageUploadError('Please select an image file (JPG, PNG, etc.)');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setImageUploadError('Image size must be less than 5MB');
      return;
    }

    setImageUploadError(null);
    const previewUrl = URL.createObjectURL(file);
    setProductImage(previewUrl);
    (window as any).selectedImageFile = file;
  };

  const handleImageUrlChange = (url: string) => {
    const trimmed = url.trim();
    setImageUrl(trimmed);
    if (!trimmed) {
      setImageUrlError(null);
      setProductImage(null);
      return;
    }
    
    try {
      new URL(trimmed); // Validate URL format
      setImageUrlError(null);
      setProductImage(trimmed);
    } catch {
      setImageUrlError('Please enter a valid URL');
      setProductImage(null);
    }
  };

  const getVideoEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    const trimmed = url.trim();
    
    // YouTube
    const ytMatch = trimmed.match(/(?:youtube\\.com\\/(?:[^\\/]+\\/.+\\/|(?:v|e(?:mbed)?)\\/|.*[?&]v=)|youtu\\.be\\/)([^"&?\\/\\s]{11})/i);
    if (ytMatch && ytMatch[1]) return \`https://www.youtube.com/embed/\${ytMatch[1]}\`;
    
    // Vimeo
    const vimeoMatch = trimmed.match(/vimeo\\.com\\/(?:.*#|.*\\/videos\\/)?([0-9]+)/i);
    if (vimeoMatch && vimeoMatch[1]) return \`https://player.vimeo.com/video/\${vimeoMatch[1]}\`;
    
    // Dailymotion
    const dmMatch = trimmed.match(/dailymotion\\.com\\/(?:video|embed\\/video)\\/(.*)/i);
    if (dmMatch && dmMatch[1]) return \`https://www.dailymotion.com/embed/video/\${dmMatch[1].split('?')[0]}\`;
    
    return null;
  };

  const handleVideoUrlChange = (url: string) => {
    const trimmed = url.trim();
    setVideoUrl(trimmed);
    
    if (!trimmed) {
      setVideoUrlError(null);
      return;
    }
    
    const embedUrl = getVideoEmbedUrl(trimmed);
    if (embedUrl) {
      setVideoUrlError(null);
    } else {
      setVideoUrlError('Unsupported video URL. Please use YouTube, Vimeo, or Dailymotion.');
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

      let finalImageUrl: string | null = null;
      let finalVideoUrl: string | null = null;

      if (mediaInputMethod === 'upload' && (window as any).selectedImageFile) {
        setIsUploadingImage(true);
        try {
          finalImageUrl = await uploadImageToCloudinary((window as any).selectedImageFile);
          console.log('✅ Image uploaded:', finalImageUrl);
        } catch (error: any) {
          setImageUploadError(error.message || 'Failed to upload image');
          setIsUploadingImage(false);
          return;
        }
        setIsUploadingImage(false);
      } else if (mediaInputMethod === 'imageUrl' && imageUrl && !imageUrlError) {
        finalImageUrl = imageUrl;
      } else if (mediaInputMethod === 'videoUrl' && videoUrl && !videoUrlError) {
        finalVideoUrl = videoUrl;
      }

      createProductMutation.mutate({
        ...formData,
        price: price,
        quantity: formData.quantity ? Number(formData.quantity) : 0,
        image: finalImageUrl,
        videoUrl: finalVideoUrl
      });
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleProductsPreviousPage = () => { if (productsPage > 1) setProductsPage(productsPage - 1); };
  const handleProductsNextPage = () => { if (productsData?.pagination?.hasMore) setProductsPage(productsPage + 1); };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (confirm(\`Are you sure you want to delete "\${productName}"?\`)) {
      try {
        const token = await getToken();
        await apiClient.delete(\`/seller/product/\${productId}\`, {
          headers: { Authorization: \`Bearer \${token}\` }
        });
        queryClient.invalidateQueries({ queryKey: ['sellerProducts'] });
        queryClient.invalidateQueries({ queryKey: ['farmerAnalytics'] });
      } catch (err) {
        alert('Failed to delete product. Please try again.');
      }
    }
  };

`;

content = content.substring(0, oldSubmitStart) + newHandlers + content.substring(oldSubmitEnd);

// 6. Replace Add Product Modal Media Section
const oldMediaSectionStart = content.indexOf(`{/* Product Image Upload */}`);
const oldMediaSectionEnd = content.indexOf(`<div>\n                <label className="block text-sm font-bold text-text-primary mb-1">\n                  Product Name *`);
const newMediaSection = `{/* Tabbed Media Input Section */}
              <div className="border border-border-muted rounded-xl p-5 space-y-4 bg-background-muted/30">
                <label className="block text-sm font-bold text-text-primary">
                  Product Media
                </label>
                
                {/* Tabs */}
                <div className="flex flex-wrap gap-2 border-b border-border-muted">
                  <button
                    type="button"
                    onClick={() => setMediaInputMethod('upload')}
                    className={\`pb-2 px-3 text-sm font-semibold flex items-center gap-1.5 border-b-2 transition-colors \${
                      mediaInputMethod === 'upload' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-primary'
                    }\`}
                  >
                    📁 Upload Image
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaInputMethod('imageUrl')}
                    className={\`pb-2 px-3 text-sm font-semibold flex items-center gap-1.5 border-b-2 transition-colors \${
                      mediaInputMethod === 'imageUrl' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-primary'
                    }\`}
                  >
                    🔗 Image URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaInputMethod('videoUrl')}
                    className={\`pb-2 px-3 text-sm font-semibold flex items-center gap-1.5 border-b-2 transition-colors \${
                      mediaInputMethod === 'videoUrl' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-primary'
                    }\`}
                  >
                    🎥 Video URL
                  </button>
                </div>

                {/* Content */}
                <div className="pt-3">
                  {mediaInputMethod === 'upload' && (
                    <div className="space-y-3">
                      {productImage && !productImage.startsWith('http') && (
                        <div className="relative">
                          <img src={productImage} alt="Preview" className="w-full h-48 object-cover rounded-xl border border-border-muted" />
                          <button type="button" onClick={() => { setProductImage(null); (window as any).selectedImageFile = null; setImageUploadError(null); }} className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg shadow-sm">×</button>
                        </div>
                      )}
                      <input type="file" accept="image/*" onChange={handleImageSelect} disabled={isUploadingImage || createProductMutation.isPending} className="w-full px-3 py-2.5 border border-border-muted rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/50" />
                      <p className="text-xs text-text-muted font-medium">JPG, PNG or WebP. Max 5MB. Will be uploaded to Cloudinary.</p>
                      {imageUploadError && <p className="text-red-500 text-sm">{imageUploadError}</p>}
                      {isUploadingImage && <div className="flex items-center gap-2 text-primary text-sm font-bold"><Loader2 className="w-4 h-4 animate-spin" /> Uploading image...</div>}
                    </div>
                  )}

                  {mediaInputMethod === 'imageUrl' && (
                    <div className="space-y-3">
                      {productImage && productImage.startsWith('http') && (
                        <div className="relative">
                          <img src={productImage} alt="Preview" className="w-full h-48 object-cover rounded-xl border border-border-muted" />
                          <button type="button" onClick={() => { setImageUrl(''); setProductImage(null); setImageUrlError(null); }} className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg shadow-sm">×</button>
                        </div>
                      )}
                      <input type="url" value={imageUrl} onChange={(e) => handleImageUrlChange(e.target.value)} placeholder="https://example.com/product-image.jpg" className="w-full px-4 py-3 border border-border-muted rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/50" />
                      <p className="text-xs text-text-muted font-medium">Paste URL from Cloudinary, Imgur, Unsplash, or other image hosting service</p>
                      {imageUrlError && <p className="text-red-500 text-sm">{imageUrlError}</p>}
                      {imageUrl && !imageUrlError && productImage && <p className="text-green-600 text-sm font-bold flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> ✅ Image URL loaded successfully</p>}
                    </div>
                  )}

                  {mediaInputMethod === 'videoUrl' && (
                    <div className="space-y-3">
                      {videoUrl && !videoUrlError && getVideoEmbedUrl(videoUrl) && (
                        <div className="relative aspect-video rounded-xl overflow-hidden border border-border-muted shadow-sm bg-black">
                          <iframe src={getVideoEmbedUrl(videoUrl)!} width="100%" height="100%" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                          <button type="button" onClick={() => { setVideoUrl(''); setVideoUrlError(null); }} className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg z-10 shadow-sm">×</button>
                        </div>
                      )}
                      <input type="url" value={videoUrl} onChange={(e) => handleVideoUrlChange(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." className="w-full px-4 py-3 border border-border-muted rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/50" />
                      <p className="text-xs text-text-muted font-medium">Supported: YouTube, Vimeo, Dailymotion. Paste the full video URL.</p>
                      {videoUrlError && <p className="text-red-500 text-sm">{videoUrlError}</p>}
                      {videoUrl && !videoUrlError && <p className="text-green-600 text-sm font-bold flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> ✅ Video loaded successfully</p>}
                    </div>
                  )}
                </div>
              </div>

              `;

content = content.substring(0, oldMediaSectionStart) + newMediaSection + content.substring(oldMediaSectionEnd);

// 7. Update Dashboard to show My Products Grid
const dashboardEndString = `            <div className="bg-background-card border-2 border-text-muted/20 rounded-3xl p-8 shadow-soft space-y-3">
              <div className="p-4 bg-background-muted text-text-primary rounded-2xl w-fit border"><Truck className="w-8 h-8 text-secondary" /></div>
              <div>
                <span className="text-sm font-bold text-text-muted uppercase tracking-wider block">Orders Received</span>
                <span className="text-3xl font-black font-heading text-text-primary">{analyticsData.totalOrders} Orders</span>
              </div>
            </div>
          </div>`;
          
const myProductsSection = `

          <hr className="border-border-muted" />

          {/* MY PRODUCTS LIST */}
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black font-heading text-text-primary">My Products</h2>
                <p className="text-text-muted font-medium mt-1">Manage your active listings and inventory</p>
              </div>
              <button onClick={() => setShowAddProductModal(true)} className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold transition shadow-soft">
                <Plus className="w-5 h-5" /> Add Product
              </button>
            </div>

            {productsLoading ? (
              <div className="py-16 text-center">
                <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
                <p className="text-text-muted mt-4 font-medium">Loading your products...</p>
              </div>
            ) : productsError ? (
              <div className="flex flex-col items-center justify-center py-12 bg-red-50 border border-red-200 rounded-3xl">
                <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
                <h3 className="text-lg font-bold text-red-900">Failed to load products</h3>
                <button onClick={() => refetchProducts()} className="mt-4 px-5 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">Retry</button>
              </div>
            ) : !productsData?.products || productsData.products.length === 0 ? (
              <div className="text-center py-16 bg-background-card rounded-3xl border border-border-muted shadow-sm">
                <Package className="w-16 h-16 mx-auto text-text-muted opacity-30 mb-4" />
                <h3 className="text-xl font-black font-heading text-text-primary">No products listed yet</h3>
                <p className="text-text-muted font-medium mt-2 max-w-md mx-auto">Start adding your farm's fresh produce and handcrafted goods to see them here.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {productsData.products.map((product: any) => (
                    <div key={product.id} className="bg-background-card border border-border-muted rounded-2xl overflow-hidden flex flex-col hover:shadow-card transition-all group">
                      <div className="h-48 bg-gray-100 relative overflow-hidden">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        ) : product.videoUrl ? (
                          <div className="w-full h-full flex items-center justify-center bg-gray-900 relative">
                            <iframe src={getVideoEmbedUrl(product.videoUrl)!} className="w-full h-full opacity-60 pointer-events-none" frameBorder="0"></iframe>
                            <Video className="w-10 h-10 text-white absolute" />
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-text-muted">
                            <Package className="w-12 h-12 opacity-50" />
                          </div>
                        )}
                        <div className="absolute top-3 left-3">
                          <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm text-xs font-bold rounded-lg border border-black/5 shadow-sm text-text-primary">
                            {product.category}
                          </span>
                        </div>
                      </div>
                      <div className="p-5 flex-1 flex flex-col">
                        <h3 className="text-lg font-black font-heading text-text-primary line-clamp-1">{product.name}</h3>
                        <p className="text-sm text-text-muted mt-1 line-clamp-2">{product.description || 'No description provided.'}</p>
                        <div className="mt-auto pt-4 flex flex-col">
                          <p className="text-xl font-black text-secondary">₹{product.price.toFixed(2)}</p>
                          <p className={\`text-xs font-bold mt-1 \${product.quantity > 0 ? 'text-green-600' : 'text-red-500'}\`}>
                            {product.quantity > 0 ? \`In Stock (\${product.quantity})\` : 'Out of Stock'}
                          </p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-border-muted flex gap-2">
                          <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-background-muted hover:bg-gray-200 text-sm font-bold text-text-primary rounded-xl transition">
                            <Edit className="w-4 h-4" /> Edit
                          </button>
                          <button onClick={() => handleDeleteProduct(product.id, product.name)} className="flex items-center justify-center px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {productsData.pagination?.pages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between pt-6 gap-4">
                    <p className="text-sm font-medium text-text-muted">
                      Page {productsData.pagination.page} of {productsData.pagination.pages} • {productsData.pagination.total} total products
                    </p>
                    <div className="flex gap-3">
                      <button onClick={handleProductsPreviousPage} disabled={productsPage === 1} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-white border border-border-muted rounded-xl hover:bg-gray-50 disabled:opacity-50 transition">
                        <ChevronLeft className="w-4 h-4" /> Prev
                      </button>
                      <button onClick={handleProductsNextPage} disabled={!productsData.pagination.hasMore} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-white border border-border-muted rounded-xl hover:bg-gray-50 disabled:opacity-50 transition">
                        Next <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>`;

content = content.replace(dashboardEndString, dashboardEndString + myProductsSection);

fs.writeFileSync(path, content);
console.log("Patched FarmerCentre.tsx successfully");
