import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Users, Trash2 } from "lucide-react";
import { api } from "../App";
import { toast } from "sonner";

export default function Suppliers({ user, onLogout }) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await api.get("/suppliers");
      setSuppliers(response.data);
    } catch (error) {
      toast.error("Failed to fetch suppliers");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.post("/suppliers", formData);
      toast.success("Supplier created successfully!");
      setDialogOpen(false);
      resetForm();
      fetchSuppliers();
    } catch (error) {
      toast.error("Failed to create supplier");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this supplier?")) return;

    try {
      await api.delete(`/suppliers/${id}`);
      toast.success("Supplier deleted successfully!");
      fetchSuppliers();
    } catch (error) {
      toast.error("Failed to delete supplier");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      contact_person: "",
      email: "",
      phone: "",
      address: "",
    });
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div data-testid="suppliers-page" className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Suppliers
            </h1>
            <p className="text-slate-400">Manage your supplier relationships</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button data-testid="add-supplier-button" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Supplier
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-xl">
              <DialogHeader>
                <DialogTitle>Add New Supplier</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Supplier Name *</Label>
                  <Input
                    id="name"
                    data-testid="supplier-name-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="bg-slate-700/50 border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_person">Contact Person</Label>
                  <Input
                    id="contact_person"
                    data-testid="supplier-contact-input"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    className="bg-slate-700/50 border-slate-600"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      data-testid="supplier-email-input"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="bg-slate-700/50 border-slate-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      data-testid="supplier-phone-input"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="bg-slate-700/50 border-slate-600"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <textarea
                    id="address"
                    data-testid="supplier-address-input"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full p-2 bg-slate-700/50 border border-slate-600 rounded-md min-h-[80px]"
                    placeholder="Full address"
                  />
                </div>
                <Button type="submit" data-testid="supplier-submit-button" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600">
                  Create Supplier
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Suppliers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <p className="text-slate-400 text-center py-8 col-span-full">Loading suppliers...</p>
          ) : suppliers.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-lg col-span-full">
              <CardContent className="py-12 text-center">
                <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No suppliers yet. Add your first supplier!</p>
              </CardContent>
            </Card>
          ) : (
            suppliers.map((supplier) => (
              <Card key={supplier.id} className="bg-slate-800/50 border-slate-700 backdrop-blur-lg card-hover" data-testid={`supplier-card-${supplier.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-600/20 p-2 rounded-lg border border-blue-500/30">
                        <Users className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <CardTitle className="text-white text-lg">{supplier.name}</CardTitle>
                        {supplier.contact_person && (
                          <p className="text-slate-400 text-sm">{supplier.contact_person}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(supplier.id)}
                      className="border-red-600 text-red-400 hover:bg-red-900/20"
                      data-testid={`delete-supplier-${supplier.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {supplier.email && (
                    <p className="text-slate-300 text-sm flex items-center gap-2">
                      <span className="text-slate-500">Email:</span> {supplier.email}
                    </p>
                  )}
                  {supplier.phone && (
                    <p className="text-slate-300 text-sm flex items-center gap-2">
                      <span className="text-slate-500">Phone:</span> {supplier.phone}
                    </p>
                  )}
                  {supplier.address && (
                    <p className="text-slate-300 text-sm flex items-start gap-2">
                      <span className="text-slate-500 min-w-fit">Address:</span>
                      <span className="text-slate-400">{supplier.address}</span>
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}