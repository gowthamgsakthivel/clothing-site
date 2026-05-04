'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { DEFAULT_CAROUSEL_CONTROLS, CAROUSEL_PAGES } from '@/lib/carouselDefaults';
import { Modal } from '@/components/ui';

const PAGE_META = {
  home: {
    label: 'Home',
    description: 'Top hero slider on the homepage.',
    accent: 'from-orange-500 to-amber-500',
  },
  sports: {
    label: 'Sports',
    description: 'Carousel on /sports.',
    accent: 'from-blue-600 to-cyan-500',
  },
  devotional: {
    label: 'Devotional',
    description: 'Carousel on /devotional.',
    accent: 'from-emerald-600 to-teal-500',
  },
  political: {
    label: 'Political',
    description: 'Carousel on /political.',
    accent: 'from-red-600 to-rose-500',
  },
};

const createBlankSlide = (page) => (
  page === 'home'
    ? { id: Date.now(), image: '', title: '', offer: '', buttonText1: '', buttonText2: '', order: 0, active: true }
    : { id: Date.now(), image: '', title: '', subtitle: '', description: '', badge: '', order: 0, active: true }
);

const normalizeControls = (controls = {}) => CAROUSEL_PAGES.reduce((acc, page) => {
  acc[page] = Array.isArray(controls?.[page]) && controls[page].length
    ? controls[page]
    : DEFAULT_CAROUSEL_CONTROLS[page];
  return acc;
}, {});

const AssetControlsPage = () => {
  const [controls, setControls] = useState(DEFAULT_CAROUSEL_CONTROLS);
  const [activePage, setActivePage] = useState('home');
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewModalViewport, setPreviewModalViewport] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState('');

  const activeSlides = useMemo(() => controls?.[activePage] || [], [activePage, controls]);
  const previewSlides = useMemo(() => (
    [...activeSlides]
      .filter((slide) => slide)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
  ), [activeSlides]);
  const previewSlidesCount = previewSlides.length;
  const activePreviewSlide = previewSlides[previewIndex] || previewSlides[0] || null;

  const loadControls = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/carousel-controls');
      const data = await response.json();
      if (data.success) {
        setControls(normalizeControls(data.controls));
      }
    } catch (error) {
      console.error(error);
      setControls(DEFAULT_CAROUSEL_CONTROLS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadControls();
  }, []);

  useEffect(() => {
    setPreviewIndex(0);
  }, [activePage, previewSlidesCount]);

  const updateSlide = (page, index, field, value) => {
    setControls((current) => ({
      ...current,
      [page]: (current?.[page] || []).map((slide, slideIndex) => (
        slideIndex === index ? { ...slide, [field]: value } : slide
      )),
    }));
  };

  const addSlide = (page) => {
    setControls((current) => {
      const nextSlides = [...(current?.[page] || []), createBlankSlide(page)];
      return { ...current, [page]: nextSlides };
    });
  };

  const removeSlide = (page, index) => {
    if (!confirm('Remove this slide?')) return;
    setControls((current) => ({
      ...current,
      [page]: (current?.[page] || []).filter((_, slideIndex) => slideIndex !== index),
    }));
  };

  const toggleSlide = (page, index) => {
    setControls((current) => ({
      ...current,
      [page]: (current?.[page] || []).map((slide, slideIndex) => (
        slideIndex === index ? { ...slide, active: !slide.active } : slide
      )),
    }));
  };

  const uploadSlideImage = async (page, index, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    setUploading(`${page}-${index}`);
    try {
      const response = await fetch('/api/admin/uploads/image', { method: 'POST', body: formData });
      const data = await response.json();
      if (!response.ok || !data?.url) {
        throw new Error(data?.message || 'Image upload failed');
      }
      updateSlide(page, index, 'image', data.url);
    } catch (error) {
      console.error(error);
      alert(error.message || 'Failed to upload image');
    } finally {
      setUploading('');
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/carousel-controls', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(controls),
      });
      const data = await response.json();
      if (data.success) {
        setControls(normalizeControls(data.controls));
        alert('Saved');
      } else {
        alert(data.message || 'Failed to save');
      }
    } catch (error) {
      console.error(error);
      alert('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const pageStyle = PAGE_META[activePage] || PAGE_META.home;
  const isPreviewModalOpen = Boolean(previewModalViewport);
  const activePreviewLabel = previewModalViewport === 'desktop' ? 'Desktop preview' : 'Mobile preview';
  const previewImageClass = previewModalViewport === 'desktop' ? 'h-[28rem]' : 'h-64';
  const previewImageWidth = previewModalViewport === 'desktop' ? 1200 : 390;
  const previewImageHeight = previewModalViewport === 'desktop' ? 520 : 256;

  const goToPreviewSlide = (nextIndex) => {
    if (!previewSlidesCount) return;
    const normalizedIndex = (nextIndex + previewSlidesCount) % previewSlidesCount;
    setPreviewIndex(normalizedIndex);
  };

  const renderPreviewBody = () => {
    if (!activePreviewSlide) {
      return <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">Add and enable a slide to see the live preview.</div>;
    }

    return (
      <div className="space-y-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => goToPreviewSlide(previewIndex - 1)}
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Previous
          </button>
          <div className="text-xs font-medium text-slate-500">
            {previewIndex + 1} / {previewSlidesCount}
          </div>
          <button
            type="button"
            onClick={() => goToPreviewSlide(previewIndex + 1)}
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Next
          </button>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{activePreviewLabel}</p>
          </div>
          <div className="flex justify-center bg-slate-50 px-4 py-4">
            <div className={`w-full ${previewModalViewport === 'desktop' ? 'max-w-6xl' : 'max-w-[390px]'}`}>
              <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm">
                <div className="overflow-hidden bg-slate-100">
                  {activePreviewSlide.image ? (
                    <Image
                      src={activePreviewSlide.image}
                      alt={activePreviewSlide.title || pageStyle.label}
                      width={previewImageWidth}
                      height={previewImageHeight}
                      className={`w-full object-cover ${previewImageClass}`}
                    />
                  ) : (
                    <div className={`flex ${previewImageClass} items-center justify-center text-sm text-slate-400`}>No image preview</div>
                  )}
                </div>
                <div className="space-y-2 px-6 py-5">
                  {activePage === 'home' ? (
                    <>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">{activePreviewSlide.offer || 'Your offer text'}</p>
                      <h3 className="text-2xl font-semibold text-slate-950">{activePreviewSlide.title || 'Title goes here'}</h3>
                      <div className="flex flex-wrap gap-2 pt-2">
                        <span className="rounded-full bg-orange-600 px-4 py-2 text-sm font-medium text-white">{activePreviewSlide.buttonText1 || 'Primary button'}</span>
                        <span className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">{activePreviewSlide.buttonText2 || 'Secondary button'}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="inline-flex rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">{activePreviewSlide.badge || 'Badge text'}</span>
                      <h3 className="text-2xl font-semibold text-slate-950">{activePreviewSlide.title || 'Title goes here'}</h3>
                      <p className="text-sm font-medium text-slate-600">{activePreviewSlide.subtitle || 'Subtitle goes here'}</p>
                      <p className="text-sm leading-6 text-slate-500">{activePreviewSlide.description || 'Description goes here.'}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {previewSlidesCount > 1 ? (
            <div className="flex flex-wrap items-center gap-2 px-4 pb-4">
              {previewSlides.map((slide, index) => (
                <button
                  key={`preview-dot-${slide.id || index}`}
                  type="button"
                  onClick={() => setPreviewIndex(index)}
                  className={`h-2.5 rounded-full transition-all ${index === previewIndex ? 'w-8 bg-slate-950' : 'w-2.5 bg-slate-300 hover:bg-slate-400'}`}
                  aria-label={`Preview slide ${index + 1}`}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="p-6 text-slate-500">Loading asset controls...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">Asset Controls</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Carousel assets and current text</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                Update the image, headline, badge, and copy for the four carousel pages from one place.
              </p>
            </div>
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="text-base font-semibold text-slate-900">Pages</h2>
                <p className="mt-1 text-sm text-slate-500">Choose which carousel to edit.</p>
              </div>
              <div className="flex flex-wrap gap-2 px-5 py-4">
                {CAROUSEL_PAGES.map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setActivePage(page)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${activePage === page ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                  >
                    {PAGE_META[page].label}
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="text-base font-semibold text-slate-900">{PAGE_META[activePage].label} slides</h2>
                <p className="mt-1 text-sm text-slate-500">{PAGE_META[activePage].description}</p>
              </div>

              <div className="space-y-4 px-5 py-5">
                {(activeSlides || []).length ? (
                  activeSlides.map((slide, index) => (
                    <div key={`${activePage}-${slide.id || index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex-1 space-y-4">
                          <div className="grid gap-3 md:grid-cols-2">
                            <label className="text-sm font-medium text-slate-700">
                              Image URL
                              <input
                                value={slide.image || ''}
                                onChange={(e) => updateSlide(activePage, index, 'image', e.target.value)}
                                placeholder="Paste or upload image URL"
                                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                              />
                            </label>
                            <label className="text-sm font-medium text-slate-700">
                              Upload image
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => uploadSlideImage(activePage, index, e.target.files?.[0])}
                                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                              />
                              <span className="mt-1 block text-xs text-slate-500">{uploading === `${activePage}-${index}` ? 'Uploading...' : 'Upload to replace the current image'}</span>
                            </label>
                          </div>

                          {activePage === 'home' ? (
                            <div className="grid gap-3 md:grid-cols-2">
                              <label className="text-sm font-medium text-slate-700">
                                Offer
                                <input
                                  value={slide.offer || ''}
                                  onChange={(e) => updateSlide(activePage, index, 'offer', e.target.value)}
                                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                />
                              </label>
                              <label className="text-sm font-medium text-slate-700">
                                Title
                                <input
                                  value={slide.title || ''}
                                  onChange={(e) => updateSlide(activePage, index, 'title', e.target.value)}
                                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                />
                              </label>
                              <label className="text-sm font-medium text-slate-700">
                                Primary button
                                <input
                                  value={slide.buttonText1 || ''}
                                  onChange={(e) => updateSlide(activePage, index, 'buttonText1', e.target.value)}
                                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                />
                              </label>
                              <label className="text-sm font-medium text-slate-700">
                                Secondary button
                                <input
                                  value={slide.buttonText2 || ''}
                                  onChange={(e) => updateSlide(activePage, index, 'buttonText2', e.target.value)}
                                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                />
                              </label>
                            </div>
                          ) : (
                            <div className="grid gap-3 md:grid-cols-2">
                              <label className="text-sm font-medium text-slate-700">
                                Title
                                <input
                                  value={slide.title || ''}
                                  onChange={(e) => updateSlide(activePage, index, 'title', e.target.value)}
                                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                />
                              </label>
                              <label className="text-sm font-medium text-slate-700">
                                Subtitle
                                <input
                                  value={slide.subtitle || ''}
                                  onChange={(e) => updateSlide(activePage, index, 'subtitle', e.target.value)}
                                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                />
                              </label>
                              <label className="md:col-span-2 text-sm font-medium text-slate-700">
                                Description
                                <textarea
                                  value={slide.description || ''}
                                  onChange={(e) => updateSlide(activePage, index, 'description', e.target.value)}
                                  rows={3}
                                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                />
                              </label>
                              <label className="text-sm font-medium text-slate-700">
                                Badge
                                <input
                                  value={slide.badge || ''}
                                  onChange={(e) => updateSlide(activePage, index, 'badge', e.target.value)}
                                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                />
                              </label>
                            </div>
                          )}

                          <div className="grid gap-3 md:grid-cols-3">
                            <label className="text-sm font-medium text-slate-700">
                              Order
                              <input
                                type="number"
                                value={slide.order ?? 0}
                                onChange={(e) => updateSlide(activePage, index, 'order', Number(e.target.value))}
                                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                              />
                            </label>
                            <label className="text-sm font-medium text-slate-700">
                              Status
                              <button
                                type="button"
                                onClick={() => toggleSlide(activePage, index)}
                                className={`mt-1 inline-flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm font-medium ${slide.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}
                              >
                                {slide.active ? 'Disable' : 'Enable'}
                              </button>
                            </label>
                            <label className="text-sm font-medium text-slate-700">
                              Action
                              <button
                                type="button"
                                onClick={() => removeSlide(activePage, index)}
                                className="mt-1 inline-flex w-full items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
                              >
                                Remove
                              </button>
                            </label>
                          </div>
                        </div>

                        <div className="w-full lg:w-44">
                          {slide.image ? (
                            <Image
                              src={slide.image}
                              alt={slide.title || `${PAGE_META[activePage].label} slide`}
                              width={320}
                              height={220}
                              className="h-40 w-full rounded-xl object-cover border border-slate-200 bg-white"
                            />
                          ) : (
                            <div className="flex h-40 w-full items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-xs text-slate-400">
                              No image
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
                    No slides configured yet.
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 px-5 py-4">
                <button
                  type="button"
                  onClick={() => addSlide(activePage)}
                  className="inline-flex items-center justify-center rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-orange-700"
                >
                  Add slide
                </button>
              </div>
            </section>
          </div>

          <div className="space-y-6 lg:sticky lg:top-6">
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="text-base font-semibold text-slate-900">Live preview</h2>
                <p className="mt-1 text-sm text-slate-500">Open mobile or desktop in a popup preview.</p>
              </div>

              <div className="px-5 py-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setPreviewModalViewport('mobile')}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-orange-300 hover:bg-orange-50"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Mobile</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">Open mobile preview</p>
                    <p className="mt-1 text-xs text-slate-500">Shows the slide in a narrow phone frame.</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewModalViewport('desktop')}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-orange-300 hover:bg-orange-50"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Desktop</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">Open desktop preview</p>
                    <p className="mt-1 text-xs text-slate-500">Shows the slide in a wide desktop frame.</p>
                  </button>
                </div>
              </div>
            </section>

            <Modal
              open={isPreviewModalOpen}
              title={activePreviewLabel}
              description={`Previewing ${PAGE_META[activePage].label.toLowerCase()} slide ${previewIndex + 1} of ${previewSlidesCount || 0}`}
              onClose={() => setPreviewModalViewport('')}
              className={previewModalViewport === 'desktop' ? 'max-w-7xl' : 'max-w-[520px]'}
            >
              {renderPreviewBody()}
            </Modal>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">What this controls</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>• Images used in the carousels</li>
                <li>• Current text and badge copy</li>
                <li>• Slide order and active state</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetControlsPage;