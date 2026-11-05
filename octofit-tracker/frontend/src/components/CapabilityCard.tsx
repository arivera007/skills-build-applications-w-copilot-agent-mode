import type { ReactNode } from 'react';
import type { ListState } from '../hooks/useAsyncList.js';

type Props<T> = ListState<T> & {
  title: string;
  description: string;
  emptyMessage: string;
  renderItem: (item: T) => ReactNode;
};

export function CapabilityCard<T>({ title, description, emptyMessage, renderItem, loading, error, items }: Props<T>) {
  return <section className="card h-100"><div className="card-body">
    <h2 className="h4">{title}</h2><p>{description}</p>
    {loading && <p role="status">Loading {title.toLowerCase()}...</p>}
    {error && <p role="alert">Unable to load {title.toLowerCase()}: {error}</p>}
    {!loading && !error && items?.length === 0 && <p>{emptyMessage}</p>}
    {!loading && !error && items && items.length > 0 && <ul>{items.map((item, index) => <li key={index}>{renderItem(item)}</li>)}</ul>}
  </div></section>;
}
