import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, TrendingUp, Lightbulb, Tag } from "lucide-react";
import { api } from "../App";
import { toast } from "sonner";

export default function AIFeatures({ user, onLogout }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Forecast State
  const [forecastProductId, setForecastProductId] = useState("");
  const [forecastDays, setForecastDays] = useState("30");
  const [forecastResult, setForecastResult] = useState(null);

  // Reorder Suggestions State
  const [reorderSuggestions, setReorderSuggestions] = useState(null);

  // Categorization State
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [categorizationResult, setCategorizationResult] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get("/products");
      setProducts(response.data);
    } catch (error) {
      console.error("Failed to fetch products");
    }
  };

  const handleForecast = async (e) => {
    e.preventDefault();
    setLoading(true);
    setForecastResult(null);

    try {
      const response = await api.post("/ai/forecast", {
        product_id: parseInt(forecastProductId),
        days: parseInt(forecastDays),
      });
      setForecastResult(response.data);
      toast.success("Forecast generated!");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Forecast failed");
    } finally {
      setLoading(false);
    }
  };

  const handleReorderSuggestions = async () => {
    setLoading(true);
    setReorderSuggestions(null);

    try {
      const response = await api.post("/ai/reorder-suggestions", {});
      setReorderSuggestions(response.data);
      toast.success("Reorder suggestions generated!");
    } catch (error) {
      toast.error("Failed to generate suggestions");
    } finally {
      setLoading(false);
    }
  };

  const handleCategorization = async (e) => {
    e.preventDefault();
    setLoading(true);
    setCategorizationResult(null);

    try {
      const response = await api.post("/ai/categorize", {
        product_name: productName,
        product_description: productDescription || null,
      });
      setCategorizationResult(response.data);
      toast.success("Product categorized!");
    } catch (error) {
      toast.error("Categorization failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div data-testid="ai-features-page" className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            <Sparkles className="w-10 h-10 text-blue-400" />
            AI Features
          </h1>
          <p className="text-slate-400 text-lg">Powered by OpenAI GPT-5 for intelligent inventory insights</p>
        </div>

        {/* AI Features Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Inventory Forecasting */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-lg" data-testid="forecast-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                Inventory Forecasting
              </CardTitle>
              <CardDescription className="text-slate-400">
                Predict future demand and get reorder recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleForecast} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forecast-product" className="text-slate-300">Select Product</Label>
                  <select
                    id="forecast-product"
                    data-testid="forecast-product-select"
                    value={forecastProductId}
                    onChange={(e) => setForecastProductId(e.target.value)}
                    required
                    className="w-full p-2 bg-slate-700/50 border border-slate-600 rounded-md text-white"
                  >
                    <option value="">Choose a product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} (Stock: {product.quantity})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="forecast-days" className="text-slate-300">Forecast Period (Days)</Label>
                  <Input
                    id="forecast-days"
                    type="number"
                    min="1"
                    max="365"
                    data-testid="forecast-days-input"
                    value={forecastDays}
                    onChange={(e) => setForecastDays(e.target.value)}
                    required
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
                <Button
                  type="submit"
                  data-testid="generate-forecast-button"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  {loading ? "Generating..." : "Generate Forecast"}
                </Button>
              </form>

              {forecastResult && (
                <div data-testid="forecast-result" className="mt-6 p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                  <h4 className="text-white font-semibold mb-2">Forecast for {forecastResult.product_name}</h4>
                  <p className="text-sm text-slate-400 mb-2">Current Stock: {forecastResult.current_stock}</p>
                  <div className="text-slate-300 text-sm whitespace-pre-wrap">
                    {forecastResult.forecast}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Smart Reorder Suggestions */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-lg" data-testid="reorder-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-400" />
                Smart Reorder Suggestions
              </CardTitle>
              <CardDescription className="text-slate-400">
                Get AI-powered recommendations for low stock items
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleReorderSuggestions}
                data-testid="get-reorder-suggestions-button"
                disabled={loading}
                className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700"
              >
                {loading ? "Analyzing..." : "Get Reorder Suggestions"}
              </Button>

              {reorderSuggestions && (
                <div data-testid="reorder-result" className="mt-6 space-y-3">
                  {reorderSuggestions.suggestions && reorderSuggestions.suggestions.length > 0 ? (
                    reorderSuggestions.suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="p-4 bg-slate-700/30 rounded-lg border border-slate-600"
                      >
                        <h4 className="text-white font-semibold">{suggestion.product_name}</h4>
                        <p className="text-sm text-slate-400">SKU: {suggestion.sku}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-slate-300 text-sm">
                            Current: {suggestion.current_stock} | Reorder Level: {suggestion.reorder_level}
                          </span>
                          <span className="text-yellow-400 font-semibold">
                            Suggested: {suggestion.suggested_quantity}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-center py-4">{reorderSuggestions.message}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product Categorization */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-lg lg:col-span-2" data-testid="categorization-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Tag className="w-5 h-5 text-purple-400" />
                AI Product Categorization
              </CardTitle>
              <CardDescription className="text-slate-400">
                Automatically categorize products and generate descriptions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCategorization} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="product-name" className="text-slate-300">Product Name *</Label>
                    <Input
                      id="product-name"
                      data-testid="categorization-name-input"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      required
                      placeholder="e.g., Wireless Headphones"
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="product-desc" className="text-slate-300">Description (Optional)</Label>
                    <Input
                      id="product-desc"
                      data-testid="categorization-description-input"
                      value={productDescription}
                      onChange={(e) => setProductDescription(e.target.value)}
                      placeholder="Brief description"
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  data-testid="categorize-button"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {loading ? "Categorizing..." : "Categorize Product"}
                </Button>
              </form>

              {categorizationResult && (
                <div data-testid="categorization-result" className="mt-6 p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                  <h4 className="text-white font-semibold mb-3">AI Analysis for: {categorizationResult.product_name}</h4>
                  <div className="text-slate-300 text-sm whitespace-pre-wrap">
                    {categorizationResult.ai_response}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-blue-500/30 backdrop-blur-lg">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="bg-blue-500/20 p-3 rounded-lg border border-blue-500/30">
              <Sparkles className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">AI-Powered Insights</h3>
              <p className="text-slate-300">
                These features use OpenAI GPT-5 to analyze your inventory data and provide intelligent recommendations
                for better decision-making.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}