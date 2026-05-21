import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Upload,
  X,
  MapPin,
  DollarSign,
  Calendar,
  Shield,
} from 'lucide-react';
import { itemsAPI } from '../services/api';

const AddItemPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const editId = searchParams.get('edit');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    dailyPrice: '',
    itemValue: '',
    depositPercentage: '20',
    condition: 'good',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    availableFrom: '',
    availableTo: '',
  });

  const categories = [
    'books',
    'electronics',
    'gadgets',
    'tools',
    'photography',
    'sports',
    'musical-instruments',
    'furniture',
    'appliances',
    'vehicles',
  ];

  const conditions = [
    { value: 'excellent', label: 'Excellent - Like new' },
    { value: 'good', label: 'Good - Minor wear' },
    { value: 'fair', label: 'Fair - Some wear' },
    { value: 'poor', label: 'Poor - Significant wear' },
  ];

  useEffect(() => {
    const loadForEdit = async () => {
      if (!editId) return;

      try {
        const res = await itemsAPI.getItemById(editId);
        const it = res.data.data.item;

        setFormData({
          title: it.title || '',
          description: it.description || '',
          category: it.category || '',
          dailyPrice: String(it.dailyPrice ?? ''),
          itemValue: String(it.itemValue ?? ''),
          depositPercentage: String(it.depositPercentage ?? '20'),
          condition: it.condition || 'good',
          street: it.location?.street || '',
          city: it.location?.city || '',
          state: it.location?.state || '',
          zipCode: it.location?.zipCode || '',
          availableFrom: it.availableFrom
            ? it.availableFrom.split('T')[0]
            : '',
          availableTo: it.availableTo
            ? it.availableTo.split('T')[0]
            : '',
        });

        setImagePreviews((it.images || []).slice(0, 5));
      } catch (e) {
        console.error('Failed to load item', e);
      }
    };

    loadForEdit();
  }, [editId]);

  const handleInputChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);

    if (images.length + files.length > 5) {
      alert('Maximum 5 images allowed');
      return;
    }

    const newImages = [...images, ...files];

    setImages(newImages);

    const newPreviews = [...imagePreviews];

    files.forEach((file) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        newPreviews.push(e.target?.result as string);
        setImagePreviews([...newPreviews]);
      };

      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editId && images.length === 0) {
      alert('Please upload at least one image');
      return;
    }

    try {
      setIsSubmitting(true);

      const submitData = new FormData();

      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('category', formData.category);
      submitData.append('dailyPrice', formData.dailyPrice);
      submitData.append('itemValue', formData.itemValue);
      submitData.append(
        'depositPercentage',
        formData.depositPercentage
      );
      submitData.append('condition', formData.condition);

      submitData.append('location[street]', formData.street);
      submitData.append('location[city]', formData.city);
      submitData.append('location[state]', formData.state);
      submitData.append('location[zipCode]', formData.zipCode);

      if (formData.availableFrom) {
        submitData.append('availableFrom', formData.availableFrom);
      }

      if (formData.availableTo) {
        submitData.append('availableTo', formData.availableTo);
      }

      images.forEach((image) => {
        submitData.append('images', image);
      });

      if (editId) {
        await itemsAPI.updateItem(editId, submitData);
        alert('Item updated successfully!');
      } else {
        await itemsAPI.createItem(submitData);
        alert('Item listed successfully!');
      }

      navigate('/dashboard');
    } catch (error: any) {
      alert(
        error.response?.data?.message ||
          'Something went wrong'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 py-10 text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* HEADER */}
        <div className="mb-10">
          <h1 className="text-5xl font-extrabold tracking-tight mb-3 bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            {editId ? 'Edit Item' : 'List Your Item'}
          </h1>

          <p className="text-slate-300 text-lg">
            Share your items with the community and start earning.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-8 animate-fadeIn"
        >

          {/* BASIC INFO */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl shadow-2xl p-8">

            <h2 className="text-2xl font-bold mb-6">
              Basic Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-200 mb-2">
                  Item Title *
                </label>

                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Canon EOS R5 Camera"
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-200 mb-2">
                  Description *
                </label>

                <textarea
                  rows={5}
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your item..."
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-2">
                  Category *
                </label>

                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select category</option>

                  {categories.map((category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category.replace('-', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-2">
                  Condition *
                </label>

                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {conditions.map((condition) => (
                    <option
                      key={condition.value}
                      value={condition.value}
                    >
                      {condition.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* PRICING */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl shadow-2xl p-8">

            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-indigo-400" />
              Pricing & Value
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-2">
                  Daily Price *
                </label>

                <input
                  type="number"
                  name="dailyPrice"
                  value={formData.dailyPrice}
                  onChange={handleInputChange}
                  required
                  min="1"
                  placeholder="100"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-2">
                  Item Value *
                </label>

                <input
                  type="number"
                  name="itemValue"
                  value={formData.itemValue}
                  onChange={handleInputChange}
                  required
                  min="1"
                  placeholder="10000"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-2">
                  Deposit %
                </label>

                <select
                  name="depositPercentage"
                  value={formData.depositPercentage}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="10">10%</option>
                  <option value="20">20%</option>
                  <option value="30">30%</option>
                  <option value="50">50%</option>
                </select>

                {formData.itemValue && (
                  <p className="text-xs text-slate-400 mt-2">
                    Deposit: ₹
                    {(
                      (parseInt(formData.itemValue) *
                        parseInt(formData.depositPercentage)) /
                      100
                    ).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* IMAGES */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl shadow-2xl p-8">

            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Upload className="h-5 w-5 text-indigo-400" />
              Images
            </h2>

            <label className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-indigo-400/40 rounded-3xl cursor-pointer bg-white/5 hover:bg-white/10 transition-all">

              <Upload className="w-10 h-10 mb-3 text-indigo-300" />

              <p className="text-slate-300">
                Click to upload or drag images
              </p>

              <p className="text-xs text-slate-500 mt-1">
                PNG, JPG, JPEG (Max 5 images)
              </p>

              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>

            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
                {imagePreviews.map((preview, index) => (
                  <div
                    key={index}
                    className="relative"
                  >
                    <img
                      src={preview}
                      alt="preview"
                      className="w-full h-28 object-cover rounded-2xl border border-white/10"
                    />

                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 p-1 rounded-full hover:bg-red-600 transition-all"
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* LOCATION */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl shadow-2xl p-8">

            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-indigo-400" />
              Location
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div className="md:col-span-2">
                <input
                  type="text"
                  name="street"
                  value={formData.street}
                  onChange={handleInputChange}
                  placeholder="Street Address"
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="City"
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                placeholder="State"
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <input
                type="text"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleInputChange}
                placeholder="ZIP Code"
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* AVAILABILITY */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl shadow-2xl p-8">

            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-400" />
              Availability
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <input
                type="date"
                name="availableFrom"
                value={formData.availableFrom}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <input
                type="date"
                name="availableTo"
                value={formData.availableTo}
                onChange={handleInputChange}
                min={
                  formData.availableFrom ||
                  new Date().toISOString().split('T')[0]
                }
                className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* TERMS */}
          <div className="backdrop-blur-xl bg-indigo-500/10 border border-indigo-500/20 rounded-3xl p-8">

            <div className="flex items-start gap-4">

              <Shield className="h-6 w-6 text-indigo-400 mt-1" />

              <div>
                <h3 className="text-xl font-semibold mb-3">
                  Terms & Conditions
                </h3>

                <ul className="space-y-2 text-slate-300 text-sm">
                  <li>• You confirm ownership of this item</li>
                  <li>• Images and details are accurate</li>
                  <li>• You agree to EASYBORROW policies</li>
                  <li>• Platform commission: 5%</li>
                </ul>
              </div>
            </div>
          </div>

          {/* BUTTONS */}
          <div className="flex justify-end gap-4">

            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 rounded-2xl border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 transition-all"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-bold shadow-lg shadow-indigo-500/30 disabled:opacity-50 transition-all"
            >
              {isSubmitting
                ? 'Submitting...'
                : editId
                ? 'Update Item'
                : 'List Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddItemPage;