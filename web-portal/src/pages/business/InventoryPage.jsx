import { useEffect, useState } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { productApi } from '../../api/endpoints';

const emptyForm = { name: '', description: '', price: '', stock: '', category: 'general' };

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const load = () => productApi.mine().then((res) => setProducts(res.data.products));

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (p) => {
    setEditingId(p._id);
    setForm({ name: p.name, description: p.description, price: p.price, stock: p.stock, category: p.category });
    setShowForm(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    const payload = { ...form, price: parseFloat(form.price), stock: parseInt(form.stock, 10) };
    if (editingId) await productApi.update(editingId, payload);
    else await productApi.create(payload);
    setShowForm(false);
    load();
  };

  const remove = async (id) => {
    if (!confirm('Delete this product?')) return;
    await productApi.remove(id);
    load();
  };

  const toggle = async (id) => {
    await productApi.toggle(id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-lg">Inventory</h2>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> Add Plant
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((p) => (
          <div key={p._id} className="card p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold">{p.name}</p>
                <p className="text-xs text-neutral-400">{p.category}</p>
              </div>
              <span className={`badge ${p.isAvailable ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-500'}`}>
                {p.isAvailable ? 'Available' : 'Hidden'}
              </span>
            </div>
            <p className="text-sm text-neutral-500 mt-2 line-clamp-2">{p.description}</p>
            <div className="flex justify-between items-center mt-3">
              <p className="font-bold">Rs {p.price}</p>
              <p className="text-xs text-neutral-400">Stock: {p.stock}</p>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => openEdit(p)} className="btn-secondary text-xs flex-1 flex items-center justify-center gap-1">
                <Pencil size={13} /> Edit
              </button>
              <button onClick={() => toggle(p._id)} className="btn-secondary text-xs flex-1">
                {p.isAvailable ? 'Hide' : 'Show'}
              </button>
              <button onClick={() => remove(p._id)} className="text-red-600 px-2">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {products.length === 0 && <p className="text-neutral-400 text-sm">No products yet — add your first plant.</p>}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="font-semibold mb-4">{editingId ? 'Edit Plant' : 'Add Plant'}</h3>
            <form onSubmit={submit} className="space-y-3">
              <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-neutral-200 rounded-xl px-3 py-2" />
              <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border border-neutral-200 rounded-xl px-3 py-2" />
              <div className="grid grid-cols-2 gap-3">
                <input required type="number" placeholder="Price (Rs)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full border border-neutral-200 rounded-xl px-3 py-2" />
                <input required type="number" placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="w-full border border-neutral-200 rounded-xl px-3 py-2" />
              </div>
              <input placeholder="Category (e.g. indoor, outdoor)" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full border border-neutral-200 rounded-xl px-3 py-2" />
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
