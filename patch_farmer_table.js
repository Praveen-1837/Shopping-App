const fs = require('fs');
const path = 'client/src/pages/FarmerCentre.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetString = `                <span className="text-3xl font-black font-heading text-text-primary">
                  {analyticsData.totalOrders} Orders
                </span>
              </div>
            </div>
          </div>`;

const myProductsTable = `
          <hr className="border-border-muted" />

          {/* MY PRODUCTS LIST */}
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1 block">🌾 Farmer Dashboard</span>
                <h2 className="text-2xl font-black font-heading text-text-primary">My Products Inventory</h2>
                <p className="text-text-muted font-medium mt-1">Manage your active listings, pricing, stock levels, and product details</p>
              </div>
              <button onClick={() => setActiveTab('add-products')} className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold transition shadow-soft">
                <Plus className="w-5 h-5" /> Add New Product
              </button>
            </div>

            {productsLoading ? (
              <div className="py-16 text-center">
                <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
                <p className="text-text-muted mt-4 font-medium">Loading products...</p>
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
                <h3 className="text-xl font-black font-heading text-text-primary">No products yet</h3>
                <p className="text-text-muted font-medium mt-2 max-w-md mx-auto">Click 'Add New Product' to start listing your items</p>
              </div>
            ) : (
              <div className="bg-background-card border border-border-muted rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead className="bg-background-muted text-text-muted text-xs font-bold uppercase tracking-wider border-b border-border-muted">
                      <tr>
                        <th className="px-6 py-4 whitespace-nowrap">Product</th>
                        <th className="px-6 py-4 whitespace-nowrap">Category</th>
                        <th className="px-6 py-4 whitespace-nowrap">Price</th>
                        <th className="px-6 py-4 whitespace-nowrap">Stock</th>
                        <th className="px-6 py-4 whitespace-nowrap">Created Date</th>
                        <th className="px-6 py-4 whitespace-nowrap text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-muted">
                      {productsData.products.map((product: any) => (
                        <tr key={product.id} className="hover:bg-gray-50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              {product.image ? (
                                <img src={product.image} alt={product.name} className="w-12 h-12 rounded-xl object-cover border border-border-muted flex-shrink-0" />
                              ) : product.videoUrl ? (
                                <div className="w-12 h-12 rounded-xl bg-gray-900 flex items-center justify-center flex-shrink-0">
                                  <Video className="w-5 h-5 text-white/70" />
                                </div>
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-background-muted flex items-center justify-center flex-shrink-0 border border-border-muted">
                                  <Package className="w-6 h-6 text-text-muted opacity-50" />
                                </div>
                              )}
                              <div>
                                <p className="font-bold text-text-primary line-clamp-1">{product.name}</p>
                                <p className="text-xs text-text-muted font-medium mt-0.5">ID: {product.id.substring(0, 8).toUpperCase()}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-block px-3 py-1 bg-primary/10 text-primary font-bold text-xs rounded-full border border-primary/20">
                              {product.category}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-text-primary">₹{product.price.toFixed(2)}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={\`font-bold text-sm \${product.quantity > 0 ? 'text-green-600' : 'text-red-600'}\`}>
                              {product.quantity > 0 ? \`\${product.quantity} units\` : 'Out of stock'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-text-muted">
                            {new Date(product.createdAt).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button className="p-2 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="View">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button className="p-2 text-text-muted hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteProduct(product.id, product.name)} 
                                className="p-2 text-text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {productsData.pagination?.pages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between p-6 border-t border-border-muted bg-gray-50/50">
                    <p className="text-sm font-medium text-text-muted">
                      Page <span className="font-bold text-text-primary">{productsData.pagination.page}</span> of <span className="font-bold text-text-primary">{productsData.pagination.pages}</span> • {productsData.pagination.total} total products
                    </p>
                    <div className="flex gap-2 mt-4 sm:mt-0">
                      <button 
                        onClick={handleProductsPreviousPage} 
                        disabled={productsPage === 1} 
                        className="flex items-center gap-1 px-4 py-2 text-sm font-bold bg-white border border-border-muted rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition shadow-sm"
                      >
                        <ChevronLeft className="w-4 h-4" /> Prev
                      </button>
                      <button 
                        onClick={handleProductsNextPage} 
                        disabled={!productsData.pagination.hasMore} 
                        className="flex items-center gap-1 px-4 py-2 text-sm font-bold bg-white border border-border-muted rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition shadow-sm"
                      >
                        Next <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>`;

content = content.replace(targetString, targetString + myProductsTable);
fs.writeFileSync(path, content);
console.log("Replaced with Table format");
