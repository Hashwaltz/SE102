import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, AlertCircle, Package } from "lucide-react";
import { api } from "../App";
import { toast } from "sonner";

export default function Products({ user, onLogout }) {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    description: "",
    category: "",
    price: "",
    cost: "",
    quantity: "",
    reorder_level: "10",
    supplier_id: "",
  });

  useEffect(() => {
    fetchProducts();
    fetchSuppliers();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get("/products");
      setProducts(response.data);
    } catch (error) {
      toast.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await api.get("/suppliers");
      setSuppliers(response.data);
    } catch (error) {
      console.error("Failed to fetch suppliers");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = {
      ...formData,
      price: parseFloat(formData.price),
      cost: parseFloat(formData.cost),
      quantity: parseInt(formData.quantity),
      reorder_level: parseInt(formData.reorder_level),
      supplier_id: formData.supplier_id ? parseInt(formData.supplier_id) : null,
    };

    try {
      if (editMode) {
        await api.put(`/products/${currentProduct.id}`, data);
        toast.success("Product updated successfully!");
      } else {
        await api.post("/products", data);
        toast.success("Product created successfully!");
      }
      setDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Operation failed");
    }
  };

  const handleEdit = (product) => {
    setEditMode(true);
    setCurrentProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      description: product.description || "",
      category: product.category || "",
      price: product.price.toString(),
      cost: product.cost.toString(),
      quantity: product.quantity.toString(),
      reorder_level: product.reorder_level.toString(),
      supplier_id: product.supplier_id?.toString() || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      await api.delete(`/products/${id}`);
      toast.success("Product deleted successfully!");
      fetchProducts();
    } catch (error) {
      toast.error("Failed to delete product");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      sku: "",
      description: "",
      category: "",
      price: "",
      cost: "",
      quantity: "",
      reorder_level: "10",
      supplier_id: "",
    });
    setEditMode(false);
    setCurrentProduct(null);
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div data-testid="products-page" className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Products
            </h1>
            <p className="text-slate-400">Manage your inventory products</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button data-testid="add-product-button" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editMode ? "Edit Product" : "Add New Product"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      data-testid="product-name-input"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="bg-slate-700/50 border-slate-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU *</Label>
                    <Input
                      id="sku"
                      data-testid="product-sku-input"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      required
                      disabled={editMode}
                      className="bg-slate-700/50 border-slate-600"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    data-testid="product-description-input"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-slate-700/50 border-slate-600"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      data-testid="product-category-input"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="bg-slate-700/50 border-slate-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supplier">Supplier</Label>
                    <select
                      id="supplier"
                      data-testid="product-supplier-select"
                      value={formData.supplier_id}
                      onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                      className="w-full p-2 bg-slate-700/50 border border-slate-600 rounded-md"
                    >
                      <option value="">No Supplier</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (₱) *</Label>
                    <Input
                      id="price"
                      data-testid="product-price-input"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                      className="bg-slate-700/50 border-slate-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cost">Cost (₱) *</Label>
                    <Input
                      id="cost"
                      data-testid="product-cost-input"
                      type="number"
                      step="0.01"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                      required
                      className="bg-slate-700/50 border-slate-600"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      data-testid="product-quantity-input"
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      required
                      className="bg-slate-700/50 border-slate-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reorder_level">Reorder Level *</Label>
                    <Input
                      id="reorder_level"
                      data-testid="product-reorder-input"
                      type="number"
                      value={formData.reorder_level}
                      onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
                      required
                      className="bg-slate-700/50 border-slate-600"
                    />
                  </div>
                </div>
                <Button type="submit" data-testid="product-submit-button" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600">
                  {editMode ? "Update Product" : "Create Product"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Products Table */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-lg">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-400" />
              All Products ({products.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-slate-400 text-center py-8">Loading products...</p>
            ) : products.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No products found. Add your first product!</p>
            ) : (
              <div className="overflow-x-auto">
                <table data-testid="products-table" className="w-full">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td className="text-slate-300 font-mono">{product.sku}</td>
                        <td className="text-white font-medium">{product.name}</td>
                        <td className="text-slate-300">{product.category || "N/A"}</td>
                        <td className="text-slate-300">₱{product.price.toLocaleString()}</td>
                        <td className="text-slate-300">{product.quantity}</td>
                        <td>
                          {product.quantity <= product.reorder_level ? (
                            <span className="badge badge-danger flex items-center gap-1 w-fit">
                              <AlertCircle className="w-3 h-3" />
                              Low Stock
                            </span>
                          ) : (
                            <span className="badge badge-success">In Stock</span>
                          )}
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              data-testid={`edit-product-${product.id}`}
                              onClick={() => handleEdit(product)}
                              className="border-slate-600 text-slate-300 hover:bg-slate-700"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              data-testid={`delete-product-${product.id}`}
                              onClick={() => handleDelete(product.id)}
                              className="border-red-600 text-red-400 hover:bg-red-900/20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}