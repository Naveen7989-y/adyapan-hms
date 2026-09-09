import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Save, X, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';

const DAYS = [
  { index: 1, label: 'Monday' },
  { index: 2, label: 'Tuesday' },
  { index: 3, label: 'Wednesday' },
  { index: 4, label: 'Thursday' },
  { index: 5, label: 'Friday' },
  { index: 6, label: 'Saturday' },
  { index: 0, label: 'Sunday' },
];

export const DoctorScheduleModal = ({ doctor, onClose, onUpdated }) => {
  const [schedules, setSchedules] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Populate with existing schedules or initialize defaults
    const initial = DAYS.map((d) => {
      const existing = doctor.schedules?.find((s) => s.dayOfWeek === d.index);
      if (existing) {
        return {
          dayOfWeek: d.index,
          dayLabel: d.label,
          isActive: existing.isActive,
          startTime: existing.startTime,
          endTime: existing.endTime,
          slotDurationMinutes: existing.slotDurationMinutes,
          maxCapacity: existing.maxCapacity,
          breakStartTime: existing.breakStartTime || '13:00',
          breakEndTime: existing.breakEndTime || '14:00',
        };
      }
      return {
        dayOfWeek: d.index,
        dayLabel: d.label,
        isActive: d.index >= 1 && d.index <= 5, // Default active Mon-Fri
        startTime: '09:00',
        endTime: '17:00',
        slotDurationMinutes: 15,
        maxCapacity: 30,
        breakStartTime: '13:00',
        breakEndTime: '14:00',
      };
    });
    setSchedules(initial);
  }, [doctor]);

  const handleFieldChange = (index, field, value) => {
    const updated = [...schedules];
    updated[index][field] = value;
    setSchedules(updated);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Filter to only active schedules or include all with their isActive boolean
      const payload = schedules.map((s) => ({
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        slotDurationMinutes: parseInt(s.slotDurationMinutes, 10),
        maxCapacity: parseInt(s.maxCapacity, 10),
        breakStartTime: s.breakStartTime,
        breakEndTime: s.breakEndTime,
        isActive: s.isActive,
      }));

      await api.put(`/doctors/${doctor.id}/schedules`, { schedules: payload });
      onUpdated();
      onClose();
    } catch (err) {
      alert(err.message || 'Failed to save schedules');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-sky-600" />
              <span>Configure Weekly OPD Shift Schedules</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Doctor: <span className="font-semibold text-slate-700">{doctor.user?.name}</span> (
              {doctor.department?.name})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Schedule Grid */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto py-4 space-y-3">
          <div className="text-xs text-slate-500 bg-sky-50 border border-sky-200 rounded-lg p-3">
            Schedules dictate appointment time slot availability and daily token capacity for this
            physician.
          </div>

          <div className="space-y-2">
            {schedules.map((s, idx) => (
              <div
                key={s.dayOfWeek}
                className={`p-3.5 rounded-xl border transition-all ${
                  s.isActive
                    ? 'bg-white border-slate-200 shadow-sm'
                    : 'bg-slate-50/70 border-slate-200/60 opacity-60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3 w-32">
                    <input
                      type="checkbox"
                      id={`day-${s.dayOfWeek}`}
                      checked={s.isActive}
                      onChange={(e) => handleFieldChange(idx, 'isActive', e.target.checked)}
                      className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                    />
                    <label
                      htmlFor={`day-${s.dayOfWeek}`}
                      className="text-sm font-bold text-slate-800 cursor-pointer"
                    >
                      {s.dayLabel}
                    </label>
                  </div>

                  {s.isActive ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                          Shift Hours
                        </span>
                        <div className="flex items-center space-x-1 mt-0.5">
                          <input
                            type="time"
                            value={s.startTime}
                            onChange={(e) => handleFieldChange(idx, 'startTime', e.target.value)}
                            className="px-2 py-1 border border-slate-300 rounded text-xs w-20"
                          />
                          <span className="text-slate-400">-</span>
                          <input
                            type="time"
                            value={s.endTime}
                            onChange={(e) => handleFieldChange(idx, 'endTime', e.target.value)}
                            className="px-2 py-1 border border-slate-300 rounded text-xs w-20"
                          />
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                          Slot Duration
                        </span>
                        <select
                          value={s.slotDurationMinutes}
                          onChange={(e) =>
                            handleFieldChange(idx, 'slotDurationMinutes', e.target.value)
                          }
                          className="mt-0.5 px-2 py-1 border border-slate-300 rounded text-xs w-full bg-white"
                        >
                          <option value="10">10 mins</option>
                          <option value="15">15 mins</option>
                          <option value="20">20 mins</option>
                          <option value="30">30 mins</option>
                        </select>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                          Max Capacity
                        </span>
                        <input
                          type="number"
                          value={s.maxCapacity}
                          onChange={(e) => handleFieldChange(idx, 'maxCapacity', e.target.value)}
                          className="mt-0.5 px-2 py-1 border border-slate-300 rounded text-xs w-full"
                          min="1"
                          max="100"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                          Break / Lunch
                        </span>
                        <div className="flex items-center space-x-1 mt-0.5">
                          <input
                            type="time"
                            value={s.breakStartTime}
                            onChange={(e) =>
                              handleFieldChange(idx, 'breakStartTime', e.target.value)
                            }
                            className="px-2 py-1 border border-slate-300 rounded text-xs w-18"
                          />
                          <span className="text-slate-400">-</span>
                          <input
                            type="time"
                            value={s.breakEndTime}
                            onChange={(e) =>
                              handleFieldChange(idx, 'breakEndTime', e.target.value)
                            }
                            className="px-2 py-1 border border-slate-300 rounded text-xs w-18"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 italic flex-1">
                      Doctor is off-duty on this day.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center space-x-2 px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold disabled:opacity-50 shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Saving...' : 'Save Weekly Schedule'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DoctorScheduleModal;
