import React, { useState, useEffect } from 'react';
import { usePlanner } from '../../context/PlannerContext';
import { Role } from '../../types';
import { X, UserPlus, UserCheck } from 'lucide-react';

interface PersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  personId?: string | null;
}

export const PersonModal: React.FC<PersonModalProps> = ({ isOpen, onClose, personId }) => {
  const { people, addPerson, updatePerson } = usePlanner();

  const isEdit = Boolean(personId);
  const existingPerson = personId ? people.find((p) => p.id === personId) : null;

  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState('Medical Education');
  const [roles, setRoles] = useState<Role[]>(['محاضر']);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (existingPerson) {
      setName(existingPerson.name);
      setEmployeeId(existingPerson.employeeId || '');
      setDepartment(existingPerson.department);
      setRoles(existingPerson.roles?.length ? existingPerson.roles : ['محاضر']);
      setEmail(existingPerson.email || '');
      setPhone(existingPerson.phone || '');
      setActive(existingPerson.active);
    } else {
      setName('');
      setEmployeeId(`EMP-${1000 + people.length + 1}`);
      setDepartment('Health Informatics');
      setRoles(['محاضر']);
      setEmail('');
      setPhone('');
      setActive(true);
    }
  }, [existingPerson, people.length, isOpen]);

  if (!isOpen) return null;

  const handleToggleRole = (role: Role) => {
    if (roles.includes(role)) {
      if (roles.length === 1) return; // Keep at least one
      setRoles((prev) => prev.filter((r) => r !== role));
    } else {
      setRoles((prev) => [...prev, role]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (isEdit && personId) {
      updatePerson(personId, {
        name,
        employeeId,
        department,
        roles,
        email,
        phone,
        active,
      });
    } else {
      addPerson({
        name,
        employeeId,
        department,
        roles,
        email,
        phone,
        active,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md max-h-[92dvh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            {isEdit ? <UserCheck className="w-5 h-5 text-blue-600" /> : <UserPlus className="w-5 h-5 text-blue-600" />}
            <h2 className="text-base font-bold text-gray-900">
              {isEdit ? 'Edit Person' : '+ Add Person'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-3.5 text-xs">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dr. Ahmed Mohamed"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Employee ID</label>
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="EMP-1001"
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Health Informatics"
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
              <label className="block text-xs font-semibold text-gray-700">
                Assigned Role(s) *
              </label>
              <span className="text-[11px] text-blue-600 font-semibold">
                {roles.length} selected ({roles.join(', ')})
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(
                [
                  {
                    role: 'محاضر' as Role,
                    label: 'محاضر',
                    icon: '🎓',
                    desc: 'Delivers lectures & modules',
                  },
                  {
                    role: 'مشرف فنى' as Role,
                    label: 'مشرف فنى',
                    icon: '👁',
                    desc: 'Training oversight & supervision',
                  },
                  {
                    role: 'تقنى/ادارى' as Role,
                    label: 'تقنى/ادارى',
                    icon: '💻',
                    desc: 'Technical & administrative support',
                  },
                  {
                    role: 'مسؤل مالى' as Role,
                    label: 'مسؤل مالى',
                    icon: '💰',
                    desc: 'Financial coordination & accounting',
                  },
                  {
                    role: 'فنى اجهزة' as Role,
                    label: 'فنى اجهزة',
                    icon: '🔧',
                    desc: 'Equipment setup & maintenance',
                  },
                  {
                    role: 'تصوير وطباعة' as Role,
                    label: 'تصوير وطباعة',
                    icon: '🖨️',
                    desc: 'Printing, copying & materials',
                  },
                ] as const
              ).map((item) => {
                const isSelected = roles.includes(item.role);
                return (
                  <div
                    key={item.role}
                    onClick={() => handleToggleRole(item.role)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-50/90 border-blue-400 ring-2 ring-blue-500/20 text-blue-950 shadow-xs'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <span className="text-sm">{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        readOnly
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 pointer-events-none"
                      />
                    </div>
                    <p className="text-[10px] text-gray-500 leading-tight">{item.desc}</p>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-gray-500 mt-1.5">
              💡 <strong>Multi-Role Enabled:</strong> A person can hold more than one role. They will appear and be available in the assignment lists for each selected role.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dr.ahmed@hospital.org"
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+20 100 123 4567"
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          {/* Active status toggle */}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
            <div>
              <span className="font-semibold text-gray-800 text-xs block">Active Status</span>
              <span className="text-[11px] text-gray-500">
                Inactive resources cannot be assigned to new training events.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Save Person
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
