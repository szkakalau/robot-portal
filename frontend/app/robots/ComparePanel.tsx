'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

type ComparePanelProps = {
  items: any[]
}

function getRating(robot: any) {
  const rank = Number(robot?.specs?.rank)
  const base = Number.isFinite(rank) ? Math.max(3, Math.min(5, 5 - rank / 50)) : 4
  return Math.round(base * 10) / 10
}

export default function ComparePanel({ items }: ComparePanelProps) {
  const [selected, setSelected] = useState<string[]>([])
  const enriched = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        rating: getRating(item)
      })),
    [items]
  )
  const selectedItems = enriched.filter((item) => selected.includes(item.name))
  const toggle = (name: string) => {
    setSelected((prev) => {
      if (prev.includes(name)) return prev.filter((n) => n !== name)
      if (prev.length >= 3) return prev
      return [...prev, name]
    })
  }
  return (
    <div className="section">
      <div className="compare-hint">Select up to 3 robots to compare.</div>
      <div className="table-grid">
        <div className="table-row table-head compare-grid-row">
          <span>Compare</span>
          <span>Name</span>
          <span>Company</span>
          <span>Category</span>
          <span>Price</span>
          <span>Rating</span>
        </div>
        {enriched.map((robot) => (
          <div className="table-row compare-grid-row" key={robot.id || robot.name}>
            <input
              type="checkbox"
              checked={selected.includes(robot.name)}
              onChange={() => toggle(robot.name)}
            />
            <Link href={`/robots/${encodeURIComponent(robot.name)}`}>{robot.name}</Link>
            <span>{robot.company || '-'}</span>
            <span>{robot.category || '-'}</span>
            <span>{robot.price || '-'}</span>
            <span>{robot.rating}</span>
          </div>
        ))}
      </div>
      {selectedItems.length > 0 && (
        <div className="compare-panel">
          <div className="compare-title">Comparison</div>
          <div className="compare-grid">
            <div className="compare-row">
              <span>Robot</span>
              {selectedItems.map((item) => (
                <span key={`${item.name}-name`}>{item.name}</span>
              ))}
            </div>
            <div className="compare-row">
              <span>Company</span>
              {selectedItems.map((item) => (
                <span key={`${item.name}-company`}>{item.company || '-'}</span>
              ))}
            </div>
            <div className="compare-row">
              <span>Category</span>
              {selectedItems.map((item) => (
                <span key={`${item.name}-category`}>{item.category || '-'}</span>
              ))}
            </div>
            <div className="compare-row">
              <span>Price</span>
              {selectedItems.map((item) => (
                <span key={`${item.name}-price`}>{item.price || '-'}</span>
              ))}
            </div>
            <div className="compare-row">
              <span>Release Year</span>
              {selectedItems.map((item) => (
                <span key={`${item.name}-year`}>{item.release_year || '-'}</span>
              ))}
            </div>
            <div className="compare-row">
              <span>Rating</span>
              {selectedItems.map((item) => (
                <span key={`${item.name}-rating`}>{item.rating}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
