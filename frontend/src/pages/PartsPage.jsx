import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getParts, createPart, updatePart, deletePart } from '../services/api';
import Spinner from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';

const EMPTY_FORM = {
  partNo: '', partName: '', materialType: '', materialSource: '', unitPrice: '',
};

function PartForm({ form, setForm, existingImages, setExistingImages, newFiles, setNewFiles, onSubmit, saving, onCancel, mode }) {
  const fileRef = useRef();

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files);
    const total = existingImages.length + newFiles.length + selected.length;
    if (total > 4) { toast.error('Maximum 4 images per part'); return; }
    setNewFiles((prev) => [...prev, ...selected].slice(0, 4 - existingImages.length));
  };

  const removeExisting = (idx) => setExistingImages((prev) => prev.filter((_, i) => i !== idx));
  const removeNew      = (idx) => setNewFiles((prev) => prev.filter((_, i) => i !== idx));

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {[['partNo', 'Part No.', true], ['partName', 'Part Name', false]].map(([field, label, req]) => (
          <div key={field}>
            <label className="block text-xs font-medium text-slate-600 uppercase tracking-wider mb-1.5">
              {label}{req && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            <input
              type="text"
              value={form[field]}
              onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-slate-300 bg-slate-50 focus:border-blue-500 focus:bg-white outline-none transition-colors"
            />
          </div>
        ))}
        {[['materialType', 'Material Type'], ['materialSource', 'Material Source']].map(([field, label]) => (
          <div key={field}>
            <label className="block text-xs font-medium text-slate-600 uppercase tracking-wider mb-1.5">{label}</label>
            <input
              type="text"
              value={form[field]}
              onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-slate-300 bg-slate-50 focus:border-blue-500 focus:bg-white outline-none transition-colors"
            />
          </div>
        ))}
        <div className="col-span-2">
          <label className="block text-xs font-medium text-slate-600 uppercase tracking-wider mb-1.5">Unit Price (USD)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.unitPrice}
            onChange={(e) => setForm((f) => ({ ...f, unitPrice: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-slate-300 bg-slate-50 focus:border-blue-500 focus:bg-white outline-none transition-colors"
          />
        </div>
      </div>

      {/* Images */}
      <div>
        <label className="block text-xs font-medium text-slate-600 uppercase tracking-wider mb-1.5">
          Images ({existingImages.length + newFiles.length}/4)
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {existingImages.map((url, i) => (
            <div key={`ex-${i}`} className="relative w-16 h-16 border border-slate-200 bg-slate-100">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => removeExisting(i)}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-600 text-white text-[10px] flex items-center justify-center hover:bg-red-700">✕</button>
            </div>
          ))}
          {newFiles.map((f, i) => (
            <div key={`new-${i}`} className="relative w-16 h-16 border border-blue-300 bg-blue-50">
              <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => removeNew(i)}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-600 text-white text-[10px] flex items-center justify-center hover:bg-red-700">✕</button>
            </div>
          ))}
          {existingImages.length + newFiles.length < 4 && (
            <button type="button" onClick={() => fileRef.current?.click()}
              className="w-16 h-16 border-2 border-dashed border-slate-300 hover:border-blue-400 text-slate-400 hover:text-blue-500 flex items-center justify-center transition-colors text-xl">+</button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
        <p className="text-[11px] text-slate-400">JPEG, PNG, WebP — max 5 MB each, up to 4 images</p>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-slate-600 border border-slate-300 hover:bg-slate-50 transition-colors">Cancel</button>
        <button type="submit" disabled={saving || !form.partNo.trim()}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {saving && <Spinner size="sm" />}
          {mode === 'create' ? 'Create Part' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

export default function PartsPage() {
  const { supplierId, carId } = useParams();

  const [parts, setParts]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(null);   // null | { mode, item }
  const [form, setForm]           = useState(EMPTY_FORM);
  const [existingImages, setExistingImages] = useState([]);
  const [newFiles, setNewFiles]   = useState([]);
  const [saving, setSaving]       = useState(false);
  const [imgPreview, setImgPreview] = useState(null);

  // Breadcrumb info
  const [breadcrumb, setBreadcrumb] = useState({ supplier: '', car: '' });

  const load = async () => {
    try {
      setLoading(true);
      const res = await getParts({ carId, supplierId });
      const data = res.data.data || [];
      setParts(data);
      if (data.length > 0) {
        setBreadcrumb({
          supplier: data[0].supplierId?.name || '',
          car:      data[0].carId?.name || '',
        });
      }
    } catch {
      toast.error('Failed to load parts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [carId]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setExistingImages([]);
    setNewFiles([]);
    setModal({ mode: 'create', item: null });
  };

  const openEdit = (p) => {
    setForm({
      partNo:         p.partNo || '',
      partName:       p.partName || '',
      materialType:   p.materialType || '',
      materialSource: p.materialSource || '',
      unitPrice:      p.unitPrice ?? '',
    });
    setExistingImages(p.images || []);
    setNewFiles([]);
    setModal({ mode: 'edit', item: p });
  };

  const closeModal = () => setModal(null);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v); });
      fd.append('supplierId', supplierId);
      fd.append('carId', carId);

      if (modal.mode === 'create') {
        newFiles.forEach((f) => fd.append('images', f));
        await createPart(fd);
        toast.success('Part created');
      } else {
        fd.append('existingImages', JSON.stringify(existingImages));
        newFiles.forEach((f) => fd.append('images', f));
        await updatePart(modal.item._id, fd);
        toast.success('Part updated');
      }
      closeModal();
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p) => {
    if (!confirm(`Delete part "${p.partNo}"?`)) return;
    try {
      await deletePart(p._id);
      toast.success('Part deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
    }
  };

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-400 mb-6">
        <Link to="/suppliers" className="hover:text-blue-600 transition-colors">Suppliers</Link>
        <span>/</span>
        <Link to={`/suppliers/${supplierId}/cars`} className="hover:text-blue-600 transition-colors">{breadcrumb.supplier || '...'}</Link>
        <span>/</span>
        <span className="text-slate-700 font-medium">{breadcrumb.car || '...'}</span>
        <span>/</span>
        <span className="text-slate-700 font-medium">Parts</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">Parts Catalogue</h1>
          <p className="text-sm text-slate-500 mt-0.5">{parts.length} part{parts.length !== 1 ? 's' : ''} in this vehicle</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 transition-colors duration-150">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="square" d="M12 4v16m8-8H4" />
          </svg>
          Add Part
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-24"><Spinner size="lg" /></div>
      ) : parts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <p className="text-sm font-medium">No parts yet for this vehicle</p>
          <p className="text-xs mt-1">Add parts manually or use JSON Import</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800 text-white text-left">
                {['Part No.', 'Part Name', 'Material Type', 'Material Source', 'Unit Price', 'Images', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-medium uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {parts.map((p, idx) => (
                <tr key={p._id} className={`border-t border-slate-100 hover:bg-blue-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">{p.partNo}</td>
                  <td className="px-4 py-3 text-slate-700">{p.partName || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{p.materialType || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{p.materialSource || '—'}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    {p.unitPrice != null ? `$${Number(p.unitPrice).toFixed(2)}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {[...Array(4)].map((_, i) =>
                        p.images?.[i] ? (
                          <button key={i} type="button" onClick={() => setImgPreview(p.images[i])}>
                            <img
                              src={p.images[i]}
                              alt={`img-${i}`}
                              className="w-8 h-8 object-cover border border-slate-200 hover:border-blue-400 transition-colors"
                            />
                          </button>
                        ) : (
                          <div key={i} className="w-8 h-8 bg-slate-100 border border-dashed border-slate-200" />
                        )
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(p)}
                        className="px-2.5 py-1 text-xs font-medium text-blue-600 border border-blue-200 hover:bg-blue-50 transition-colors">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(p)}
                        className="px-2.5 py-1 text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors">
                        Del
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Part Form Modal */}
      <Modal isOpen={!!modal} onClose={closeModal} title={modal?.mode === 'create' ? 'Add New Part' : `Edit Part — ${modal?.item?.partNo}`} width="max-w-2xl">
        {modal && (
          <PartForm
            form={form} setForm={setForm}
            existingImages={existingImages} setExistingImages={setExistingImages}
            newFiles={newFiles} setNewFiles={setNewFiles}
            onSubmit={handleSave} saving={saving}
            onCancel={closeModal} mode={modal.mode}
          />
        )}
      </Modal>

      {/* Image Preview Modal */}
      {imgPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80" onClick={() => setImgPreview(null)}>
          <img src={imgPreview} alt="preview" className="max-w-3xl max-h-[85vh] object-contain border-4 border-white shadow-2xl" />
        </div>
      )}
    </div>
  );
}
