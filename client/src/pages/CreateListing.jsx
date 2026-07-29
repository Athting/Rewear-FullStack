import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import api from '../services/api.js';
import { AuthContext } from '../context/AuthContext.jsx';
import LeafletMap from '../components/LeafletMap.jsx';

export default function CreateListing() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loadingAI, setLoadingAI] = useState(false);

  // Files & Preview State
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [gender, setGender] = useState('Unisex');
  const [size, setSize] = useState('M');
  const [condition, setCondition] = useState('Good');
  const [color, setColor] = useState('');
  const [material, setMaterial] = useState('');
  const [swapValue, setSwapValue] = useState(40);
  const [locationName, setLocationName] = useState(user?.locationName || 'San Francisco, CA');
  const [longitude, setLongitude] = useState(user?.locationCoordinates?.coordinates?.[0] || -122.4194);
  const [latitude, setLatitude] = useState(user?.locationCoordinates?.coordinates?.[1] || 37.7749);
  const [tags, setTags] = useState([]);

  const categories = ['Denim', 'Outerwear', 'Footwear', 'Knitwear', 'Dresses', 'Blazer', 'Shirts', 'Accessories'];
  const brands = ["Levi's", 'Patagonia', 'Doc Martens', 'Everlane', 'Reformation', 'Nike', 'Zara', 'Barbour', 'Adidas', 'Uniqlo'];
  const conditions = ['New with Tags', 'Like New', 'Good', 'Fair'];
  const sizes = ['XS', 'S', 'M', 'L', 'XL', '9', '10', '32'];

  // Handle Photo selection and trigger Gemini AI vision helper!
  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setSelectedFiles(prev => [...prev, ...files]);
    
    // Create preview URLs
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...previews]);

    // Use the first file to trigger Gemini AI details suggestions!
    triggerGeminiVisionAnalysis(files[0]);
  };

  const triggerGeminiVisionAnalysis = (file) => {
    setLoadingAI(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const base64Data = reader.result;
        const mimeType = file.type;

        // Post to backend AI Vision analyzer
        const response = await api.post('/ai/vision-describe', {
          imageBase64: base64Data,
          mimeType
        });

        const { suggestions } = response.data;
        if (suggestions) {
          setTitle(suggestions.title || '');
          setDescription(suggestions.description || '');
          setCategory(suggestions.category || '');
          setCondition(suggestions.condition || 'Good');
          setSize(suggestions.size || 'M');
          setSwapValue(suggestions.suggestedValue || 40);
          setColor(suggestions.color || '');
          setMaterial(suggestions.material || '');
          setTags(suggestions.tags || []);
        }
      } catch (error) {
        console.error('AI Vision error:', error.message);
      } finally {
        setLoadingAI(false);
      }
    };
  };

  // Submit Listing Mutation (multi-part Form Data)
  const submitMutation = useMutation({
    mutationFn: async (formData) => {
      const response = await api.post('/listings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    },
    onSuccess: (data) => {
      alert(data.message || 'Clothing item listed successfully! +10 EcoPoints earned.');
      navigate('/explore');
    },
    onError: (error) => {
      const backendError = error.response?.data?.message;
      const valErrors = error.response?.data?.errors;
      if (valErrors && Array.isArray(valErrors)) {
        const msg = valErrors.map(e => `- ${e.field}: ${e.message}`).join('\n');
        alert(`Validation Error:\n${msg}`);
      } else {
        alert(backendError || 'Failed to submit listing.');
      }
    }
  });

  const handlePublish = () => {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('brand', brand);
    formData.append('gender', gender);
    formData.append('size', size);
    formData.append('condition', condition);
    formData.append('color', color);
    formData.append('material', material);
    formData.append('swapValue', swapValue);
    formData.append('locationName', locationName);
    formData.append('longitude', longitude);
    formData.append('latitude', latitude);
    formData.append('tags', tags.join(','));

    selectedFiles.forEach((file) => {
      formData.append('images', file);
    });

    submitMutation.mutate(formData);
  };

  const handleNext = () => {
    if (step === 1 && selectedFiles.length === 0) {
      alert('Please upload at least one clothing photo.');
      return;
    }
    if (step === 2 && (!title || !brand || !category || !color || !material)) {
      alert('Please fill out all mandatory specifications.');
      return;
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => setStep(prev => prev - 1);

  return (
    <div className="container mx-auto px-6 py-8 max-w-4xl">
      {/* Wizard stepper indicators */}
      <div className="glass-panel p-4 rounded-2xl mb-8 flex justify-around items-center text-sm bg-white/70">
        {[1, 2, 3].map((num) => (
          <div key={num} className={`flex items-center gap-2 ${step === num ? 'text-primary font-bold' : 'text-text-secondary'}`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${step === num ? 'bg-primary text-white' : 'bg-gray-100'}`}>{num}</span>
            <span>
              {num === 1 && 'Upload Images'}
              {num === 2 && 'Details Spec'}
              {num === 3 && 'Location & Publish'}
            </span>
          </div>
        ))}
      </div>

      {/* STEP 1: UPLOAD PHOTOS */}
      {step === 1 && (
        <div className="glass-panel p-8 rounded-2xl bg-white/70 flex flex-col gap-6">
          <div className="text-center">
            <h2 className="font-primary font-bold text-2xl">Upload Clothing Images</h2>
            <p className="text-text-secondary text-sm mt-1">AI will automatically analyze your photo to generate details suggestions</p>
          </div>

          <div className="border-2 border-dashed border-border-custom rounded-2xl h-56 flex flex-col items-center justify-center relative hover:bg-primary/5 transition-all">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handlePhotoSelect}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <span className="material-symbols-rounded text-primary text-5xl mb-2 animate-bounce">cloud_upload</span>
            <span className="font-semibold text-sm">Drag & Drop or Click to Upload</span>
            <span className="text-xs text-text-light mt-1">Supports PNG, JPG up to 5 images</span>
          </div>

          {loadingAI && (
            <div className="flex items-center justify-center gap-2 text-primary font-bold py-2 bg-primary/10 rounded-xl">
              <span className="material-symbols-rounded animate-spin">eco</span>
              <span>Gemini AI is analyzing clothing properties...</span>
            </div>
          )}

          {imagePreviews.length > 0 && (
            <div className="flex gap-4 overflow-x-auto py-2">
              {imagePreviews.map((src, i) => (
                <div key={i} className="w-24 h-24 rounded-xl overflow-hidden relative shadow-sm border border-border-custom bg-gray-50 flex-shrink-0">
                  <img src={src} alt="preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => {
                      setSelectedFiles(prev => prev.filter((_, idx) => idx !== i));
                      setImagePreviews(prev => prev.filter((_, idx) => idx !== i));
                    }}
                    className="absolute top-1 right-1 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end mt-4">
            <button onClick={handleNext} disabled={selectedFiles.length === 0} className="btn bg-primary text-white hover:bg-primary-hover px-8 py-2.5 rounded-full font-semibold shadow-md disabled:bg-primary/40">
              Continue
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: DETAILS */}
      {step === 2 && (
        <div className="glass-panel p-8 rounded-2xl bg-white/70 flex flex-col gap-6">
          <h2 className="font-primary font-bold text-xl">Clothing Specifications</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-text-secondary font-bold">Clothing Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Classic Synchilla Fleece Jacket"
                className="px-4 py-2 border border-border-custom bg-white rounded-xl text-xs outline-none focus:border-primary"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-text-secondary font-bold">Brand</label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="px-4 py-2 border border-border-custom bg-white rounded-xl text-xs outline-none focus:border-primary"
              >
                <option value="">Select Brand</option>
                {brands.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-text-secondary font-bold">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="px-4 py-2 border border-border-custom bg-white rounded-xl text-xs outline-none focus:border-primary"
              >
                <option value="">Select Category</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-text-secondary font-bold">Size</label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="px-4 py-2 border border-border-custom bg-white rounded-xl text-xs outline-none focus:border-primary"
              >
                {sizes.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-text-secondary font-bold">Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="px-4 py-2 border border-border-custom bg-white rounded-xl text-xs outline-none focus:border-primary"
              >
                {conditions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-text-secondary font-bold">Color</label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="e.g. Navy Blue"
                className="px-4 py-2 border border-border-custom bg-white rounded-xl text-xs outline-none focus:border-primary"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-text-secondary font-bold">Material</label>
              <input
                type="text"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder="e.g. 100% Organic Cotton"
                className="px-4 py-2 border border-border-custom bg-white rounded-xl text-xs outline-none focus:border-primary"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-text-secondary font-bold">Estimated Swap Value (EcoPoints): {swapValue} pts</label>
              <input
                type="range"
                min="10"
                max="150"
                step="5"
                value={swapValue}
                onChange={(e) => setSwapValue(parseInt(e.target.value))}
                className="accent-primary mt-2"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1 w-full">
            <label className="text-xs text-text-secondary font-bold">Item Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe flaws, tags, fit details..."
              className="px-4 py-2.5 border border-border-custom bg-white rounded-xl text-xs outline-none focus:border-primary h-24"
              required
            />
          </div>

          <div className="flex justify-between mt-4">
            <button onClick={handleBack} className="btn border border-border-custom text-text-secondary px-8 py-2.5 rounded-full font-semibold">Back</button>
            <button onClick={handleNext} className="btn bg-primary text-white hover:bg-primary-hover px-8 py-2.5 rounded-full font-semibold shadow-md">Continue</button>
          </div>
        </div>
      )}

      {/* STEP 3: LOCATION & PUBLISH */}
      {step === 3 && (
        <div className="glass-panel p-8 rounded-2xl bg-white/70 flex flex-col gap-6">
          <h2 className="font-primary font-bold text-xl">Swap Location & Publish</h2>
          <p className="text-xs text-text-secondary">Verify or pin the exchange point where you want to coordinate swaps</p>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-text-secondary font-bold">Hub City Name</label>
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="e.g. Portland, OR"
              className="px-4 py-2 border border-border-custom bg-white rounded-xl text-xs outline-none focus:border-primary"
              required
            />
          </div>

          <div className="h-64 rounded-2xl overflow-hidden border border-border-custom">
            <LeafletMap
              userLocation={[latitude, longitude]}
              onMapClick={(latLng) => {
                setLatitude(latLng.lat);
                setLongitude(latLng.lng);
              }}
              height="250px"
            />
          </div>

          <div className="text-[10px] text-text-secondary text-center">
            Swap coordinates: <strong>{latitude.toFixed(5)}, {longitude.toFixed(5)}</strong>
          </div>

          <div className="flex justify-between mt-4">
            <button onClick={handleBack} className="btn border border-border-custom text-text-secondary px-8 py-2.5 rounded-full font-semibold">Back</button>
            <button
              onClick={handlePublish}
              disabled={submitMutation.isPending}
              className="btn bg-primary text-white hover:bg-primary-hover px-8 py-2.5 rounded-full font-semibold shadow-md flex items-center gap-2"
            >
              {submitMutation.isPending ? 'Publishing...' : 'Publish Listing'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
