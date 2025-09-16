'use client'
import React, { useState } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import axios from "axios";
import { toast } from "react-hot-toast";

const AddProduct = () => {

  const { getToken } = useAppContext();

  const [files, setFiles] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [genderCategory, setGenderCategory] = useState('Unisex');
  const [price, setPrice] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [brand, setBrand] = useState('');
  const [colors, setColors] = useState([]); // [{ color: string, stock: number }]
  const [sizes, setSizes] = useState([]);
  const [stock, setStock] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();

    formData.append('name', name)
    formData.append('description', description)
    formData.append('category', category)
    formData.append('genderCategory', genderCategory)
    formData.append('price', price)
    formData.append('offerPrice', offerPrice)
    formData.append('brand', brand)
    colors.forEach(({ color, stock }) => {
      formData.append('colors[]', JSON.stringify({ color, stock }));
    });

    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }
    sizes.forEach(size => formData.append('sizes', size));
    formData.append('stock', stock);
    try {
      const token = await getToken()

      const { data } = await axios.post('/api/product/add', formData, { headers: { Authorization: `Bearer ${token}` } })
      if (data.success) {
        toast.success(data.message);
        setFiles([]);
        setName('');
        setDescription('');
        setCategory('Earphone');
        setGenderCategory('Unisex');
        setPrice('');
        setOfferPrice('');
        setBrand('');
        setColors([]);
        setSizes([]);
        setStock('');
      } else {
        toast.error(data.message);
      }

    } catch (error) {
      toast.error(error.message);
    }


  };

  return (
    <div className="flex-1 min-h-screen flex flex-col justify-between">
      <form onSubmit={handleSubmit} className="md:p-10 p-4 space-y-5 max-w-lg">
        <div>
          <p className="text-base font-medium">Product Image</p>
          <div className="flex flex-wrap items-center gap-3 mt-2">

            {[...Array(4)].map((_, index) => (
              <label key={index} htmlFor={`image${index}`}>
                <input onChange={(e) => {
                  const updatedFiles = [...files];
                  updatedFiles[index] = e.target.files[0];
                  setFiles(updatedFiles);
                }} type="file" id={`image${index}`} hidden />
                <Image
                  key={index}
                  className="max-w-24 cursor-pointer"
                  src={files[index] ? URL.createObjectURL(files[index]) : assets.upload_area}
                  alt=""
                  width={100}
                  height={100}
                />
              </label>
            ))}

          </div>
        </div>
        <div className="flex flex-col gap-1 max-w-md">
          <label className="text-base font-medium" htmlFor="product-name">
            Product Name
          </label>
          <input
            id="product-name"
            type="text"
            placeholder="Type here"
            className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
            onChange={(e) => setName(e.target.value)}
            value={name}
            required
          />
        </div>
        <div className="flex flex-col gap-1 max-w-md">
          <label
            className="text-base font-medium"
            htmlFor="product-description"
          >
            Product Description
          </label>
          <textarea
            id="product-description"
            rows={4}
            className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40 resize-none"
            placeholder="Type here"
            onChange={(e) => setDescription(e.target.value)}
            value={description}
            required
          ></textarea>
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-base font-medium block mb-2">Sizes</label>
            <div className="flex flex-wrap gap-2">
              {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(size => (
                <label key={size} className={`px-3 py-1 rounded border cursor-pointer ${sizes.includes(size) ? 'bg-orange-500 text-white border-orange-500' : 'bg-gray-100 text-gray-700 border-gray-300'}`}>
                  <input
                    type="checkbox"
                    value={size}
                    checked={sizes.includes(size)}
                    onChange={e => {
                      if (e.target.checked) setSizes([...sizes, size]);
                      else setSizes(sizes.filter(s => s !== size));
                    }}
                    className="hidden"
                  />
                  {size}
                </label>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1 w-32">
            <label className="text-base font-medium" htmlFor="stock">
              Stock Quantity
            </label>
            <input
              id="stock"
              type="number"
              placeholder="0"
              className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
              onChange={(e) => setStock(e.target.value)}
              value={stock}
              required
            />
          </div>
          <label className="text-base font-medium" htmlFor="brand">
            Brand
          </label>
          <input
            id="brand"
            type="text"
            placeholder="Brand name"
            className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
            onChange={(e) => setBrand(e.target.value)}
            value={brand}
            required
          />
        </div>
        <div className="flex flex-col gap-1 w-32">
          <label className="text-base font-medium" htmlFor="color">Color & Units</label>
          <div className="flex flex-col gap-2 mt-2">
            {["#607D8B", "#222", "#ccc", "#E53935", "#43A047", "#1976D2", "#FBC02D", "#fff"].map((c) => {
              const colorObj = colors.find(col => col.color === c);
              return (
                <div key={c} className="flex items-center gap-2">
                  <label className="relative flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="color"
                      value={c}
                      checked={!!colorObj}
                      onChange={() => {
                        if (colorObj) setColors(colors.filter(col => col.color !== c));
                        else setColors([...colors, { color: c, stock: 1 }]);
                      }}
                      className="peer appearance-none w-6 h-6 rounded-full border border-gray-400 checked:ring-2 checked:ring-black focus:outline-none"
                      style={{ backgroundColor: c }}
                    />
                    <span
                      className="absolute left-0 top-0 w-6 h-6 rounded-full border-2 border-black pointer-events-none"
                      style={{ display: colorObj ? "block" : "none" }}
                    ></span>
                  </label>
                  {colorObj && (
                    <input
                      type="number"
                      min={1}
                      className="w-16 px-2 py-1 border rounded"
                      value={colorObj.stock}
                      onChange={e => {
                        setColors(colors.map(col => col.color === c ? { ...col, stock: Number(e.target.value) } : col));
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col gap-1 w-32">
          <label className="text-base font-medium" htmlFor="category">
            Category
          </label>
          <select
            id="category"
            className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
            onChange={(e) => setCategory(e.target.value)}
            defaultValue={category}
          >
            <option value="Shorts">Shorts</option>
            <option value="Pants">Pants</option>
            <option value="T-Shirts">T-Shirts</option>
            <option value="Tights">Tights</option>
            <option value="Socks">Socks</option>
            <option value="Sleeveless">Sleeveless</option>
            <option value="Accessories">Accessories</option>
          </select>
        </div>
        <div className="flex flex-col gap-1 w-32">
          <label className="text-base font-medium" htmlFor="genderCategory">
            Gender/Age
          </label>
          <select
            id="genderCategory"
            className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
            onChange={(e) => setGenderCategory(e.target.value)}
            value={genderCategory}
            required
          >
            <option value="Men">Men</option>
            <option value="Women">Women</option>
            <option value="Kids">Kids</option>
            <option value="Girls">Girls</option>
            <option value="Boys">Boys</option>
            <option value="Unisex">Unisex</option>
          </select>
        </div>
        <div className="flex flex-col gap-1 w-32">
          <label className="text-base font-medium" htmlFor="product-price">
            Product Price
          </label>
          <input
            id="product-price"
            type="number"
            placeholder="0"
            className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
            onChange={(e) => setPrice(e.target.value)}
            value={price}
            required
          />
        </div>
        <div className="flex flex-col gap-1 w-32">
          <label className="text-base font-medium" htmlFor="offer-price">
            Offer Price
          </label>
          <input
            id="offer-price"
            type="number"
            placeholder="0"
            className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
            onChange={(e) => setOfferPrice(e.target.value)}
            value={offerPrice}
            required
          />
        </div>
        <button type="submit" className="px-8 py-2.5 bg-orange-600 text-white font-medium rounded">
          ADD
        </button>
      </form>
      {/* <Footer /> */}
    </div>
  );
};

export default AddProduct;