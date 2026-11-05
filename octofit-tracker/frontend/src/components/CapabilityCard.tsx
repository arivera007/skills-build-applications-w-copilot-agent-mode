import { useEffect, useState, type ReactNode } from 'react';
import { getJson } from '../api/client.js';

type Props<T> = {
  title: string;
  description: string;
  path: string;
  dataKey: string;
  emptyMessage: string;
  renderItem: (item: T) => ReactNode;
};

export function CapabilityCard<T>({ title, description, path, dataKey, emptyMessage, renderItem }: Props<T>) {
  const [items, setItems] = useState<T[]>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getJson<Record<string, T[]>>(path)
      .then((data) => {
        const result = data[dataKey];
        if (!Array.isArray(result)) throw new Error('Unexpected API response');
        if (active) setItems(result);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Unable to load data');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [dataKey, path]);

  return <section className="card h-100"><div className="card-body">
    <h2 className="h4">{title}</h2><p>{description}</p>
    {loading && <p role="status">Loading {title.toLowerCase()}...</p>}
    {error && <p role="alert">Unable to load {title.toLowerCase()}: {error}</p>}
    {!loading && !error && items?.length === 0 && <p>{emptyMessage}</p>}
    {!loading && !error && items && items.length > 0 && <ul>{items.map((item, index) => <li key={index}>{renderItem(item)}</li>)}</ul>}
  </div></section>;
}
