import { useEffect, useState, type FormEvent } from 'react'
import { useData } from '../context/DataContext'
import { Modal, Field, inputClass, Button } from './ui'
import { todayISO } from '../utils/format'
import type { TimeEntry } from '../types'

export default function TimeEntryModal({
  open,
  onClose,
  entry,
}: {
  open: boolean
  onClose: () => void
  entry?: TimeEntry
}) {
  // Read existing records and the functions that create or update a time entry.
  const { projects, getClient, addTimeEntry, updateTimeEntry } = useData()
  const activeProjects = projects.filter((p) => {
    const client = getClient(p.clientId)
    return client && !client.archived
  })

  const [projectId, setProjectId] = useState(entry?.projectId ?? activeProjects[0]?.id ?? '')
  const [date, setDate] = useState(entry?.date ?? todayISO())
  const [hours, setHours] = useState(entry ? String(Math.floor(entry.minutes / 60)) : '1')
  const [minutes, setMinutes] = useState(entry ? String(entry.minutes % 60) : '0')
  const [note, setNote] = useState(entry?.note ?? '')
  const [error, setError] = useState('')

  useEffect(() => {
    // Each time the dialog opens, copy the chosen entry into the editable form fields.
    if (open) {
      setProjectId(entry?.projectId ?? activeProjects[0]?.id ?? '')
      setDate(entry?.date ?? todayISO())
      setHours(entry ? String(Math.floor(entry.minutes / 60)) : '1')
      setMinutes(entry ? String(entry.minutes % 60) : '0')
      setNote(entry?.note ?? '')
      setError('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, entry])

  function handleSubmit(e: FormEvent) {
    // Convert the hours/minutes inputs into one duration, then create or update the entry.
    e.preventDefault()
    const totalMinutes = Number(hours || 0) * 60 + Number(minutes || 0)
    if (!projectId) {
      setError('Choose a project for this entry.')
      return
    }
    if (totalMinutes <= 0) {
      setError('Duration needs to be more than zero.')
      return
    }
    if (entry) {
      updateTimeEntry(entry.id, { projectId, date, minutes: totalMinutes, note })
    } else {
      addTimeEntry({ projectId, date, minutes: totalMinutes, note })
    }
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={entry ? 'Edit time entry' : 'Add time entry'}>
      {activeProjects.length === 0 ? (
        <p className="text-sm text-ink-500">
          Add an active client and project before logging time against it.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Project">
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className={inputClass}
            >
              {activeProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {getClient(p.clientId)?.name} — {p.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Date">
            <input
              type="date"
              value={date}
              max={todayISO()}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Hours">
              <input
                type="number"
                min={0}
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Minutes">
              <input
                type="number"
                min={0}
                max={59}
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="Note" hint="Optional — e.g. “client call” or “bug fixes”">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={inputClass}
              placeholder="What did you work on?"
            />
          </Field>
          {error && <p className="text-sm text-rust">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{entry ? 'Save changes' : 'Add entry'}</Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
